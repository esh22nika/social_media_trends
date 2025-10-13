import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from collections import defaultdict, Counter
import json

class RecommendationEngine:
    def __init__(self):
        self.tfidf = TfidfVectorizer(max_features=1000, stop_words='english')
        self.item_features = None
        self.user_profiles = {}
        
    def build_item_features(self, df):
        """Build TF-IDF features for content-based filtering"""
        print("Building item features...")
        
        # Combine text features
        df['combined_text'] = (
            df['title'].fillna('') + ' ' +
            df['text'].fillna('') + ' ' +
            df['keywords'].apply(lambda x: ' '.join(x) if isinstance(x, list) else '') + ' ' +
            df['hashtags'].apply(lambda x: ' '.join(x) if isinstance(x, list) else '')
        )
        
        # Build TF-IDF matrix
        self.item_features = self.tfidf.fit_transform(df['combined_text'])
        
        print(f"Built features for {self.item_features.shape[0]} items")
        return self.item_features
    
    def create_user_profile(self, user_interests, user_interactions=None):
        """Create user profile from interests and interactions"""
        profile = {
            'interests': [interest.lower() for interest in user_interests],
            'preferred_platforms': [],
            'preferred_sentiment': 'neutral',
            'keywords': set(),
            'hashtags': set()
        }
        
        if user_interactions:
            # Analyze user interaction history
            platforms = [item.get('platform') for item in user_interactions if 'platform' in item]
            profile['preferred_platforms'] = list(set(platforms))
            
            # Collect keywords and hashtags from liked items
            for item in user_interactions:
                if 'keywords' in item and isinstance(item['keywords'], list):
                    profile['keywords'].update([k.lower() for k in item['keywords']])
                if 'hashtags' in item and isinstance(item['hashtags'], list):
                    profile['hashtags'].update([h.lower() for h in item['hashtags']])
        
        return profile
    
    def content_based_recommendation(self, df, user_profile, top_n=20):
        """Content-based filtering recommendations"""
        print("Generating content-based recommendations...")
        
        # Create user query from profile
        user_query = ' '.join(
            user_profile['interests'] +
            list(user_profile.get('keywords', [])) +
            list(user_profile.get('hashtags', []))
        )
        
        if not user_query.strip():
            # Return top trending items
            return df.nlargest(top_n, 'engagement_score')
        
        # Transform user query
        user_vector = self.tfidf.transform([user_query])
        
        # Calculate similarity
        similarities = cosine_similarity(user_vector, self.item_features).flatten()
        
        # Add similarity scores to dataframe
        df_copy = df.copy()
        df_copy['content_score'] = similarities
        
        # Filter by preferred platforms if specified
        if user_profile.get('preferred_platforms'):
            df_copy = df_copy[df_copy['platform'].isin(user_profile['preferred_platforms'])]
        
        # Combine with engagement score
        df_copy['recommendation_score'] = (
            df_copy['content_score'] * 0.6 +
            df_copy['normalized_engagement'] / 100 * 0.4
        )
        
        # Get top recommendations
        recommendations = df_copy.nlargest(top_n, 'recommendation_score')
        
        return recommendations
    
    def collaborative_filtering(self, df, user_profile, user_interactions, top_n=20):
        """Collaborative filtering based on similar users"""
        print("Generating collaborative recommendations...")
        
        if not user_interactions:
            return pd.DataFrame()
        
        # Get items user has interacted with
        interacted_ids = [item.get('id') for item in user_interactions if 'id' in item]
        
        if not interacted_ids:
            return pd.DataFrame()
        
        # Find similar items based on co-occurrence
        user_keywords = set()
        user_hashtags = set()
        
        for item in user_interactions:
            if 'keywords' in item and isinstance(item['keywords'], list):
                user_keywords.update([k.lower() for k in item['keywords']])
            if 'hashtags' in item and isinstance(item['hashtags'], list):
                user_hashtags.update([h.lower() for h in item['hashtags']])
        
        # Score items based on overlap
        df_copy = df.copy()
        df_copy = df_copy[~df_copy['id'].isin(interacted_ids)]  # Exclude already seen
        
        def calculate_overlap(row):
            score = 0
            if isinstance(row.get('keywords'), list):
                keywords_overlap = len(set([k.lower() for k in row['keywords']]) & user_keywords)
                score += keywords_overlap * 2
            
            if isinstance(row.get('hashtags'), list):
                hashtags_overlap = len(set([h.lower() for h in row['hashtags']]) & user_hashtags)
                score += hashtags_overlap * 1.5
            
            return score
        
        df_copy['collab_score'] = df_copy.apply(calculate_overlap, axis=1)
        
        # Combine with engagement
        df_copy['recommendation_score'] = (
            df_copy['collab_score'] * 0.5 +
            df_copy['normalized_engagement'] / 100 * 0.5
        )
        
        recommendations = df_copy[df_copy['collab_score'] > 0].nlargest(top_n, 'recommendation_score')
        
        return recommendations
    
    def hybrid_recommendation(self, df, user_profile, user_interactions=None, top_n=20):
        """Hybrid recommendation combining content-based and collaborative"""
        print("Generating hybrid recommendations...")
        
        # Build features if not already built
        if self.item_features is None:
            self.build_item_features(df)
        
        # Get content-based recommendations
        content_recs = self.content_based_recommendation(df, user_profile, top_n=top_n*2)
        
        # Get collaborative recommendations if interactions available
        if user_interactions and len(user_interactions) > 0:
            collab_recs = self.collaborative_filtering(df, user_profile, user_interactions, top_n=top_n*2)
            
            # Combine both
            combined = pd.concat([content_recs, collab_recs]).drop_duplicates(subset=['id'])
            
            # Re-score
            combined['final_score'] = (
                combined.get('content_score', 0) * 0.4 +
                combined.get('collab_score', 0) * 0.3 +
                combined['normalized_engagement'] / 100 * 0.3
            )
        else:
            combined = content_recs
            combined['final_score'] = combined.get('recommendation_score', combined['normalized_engagement'] / 100)
        
        # Get top N
        recommendations = combined.nlargest(top_n, 'final_score')
        
        return recommendations
    
    def get_trending_topics(self, df, time_window_days=7, top_n=20):
        """Get currently trending topics"""
        print("Analyzing trending topics...")
        
        # Filter recent data
        df['created_at'] = pd.to_datetime(df['created_at'])
        cutoff_date = df['created_at'].max() - pd.Timedelta(days=time_window_days)
        recent_df = df[df['created_at'] >= cutoff_date]
        
        # Count keyword and hashtag frequencies
        keyword_counts = Counter()
        hashtag_counts = Counter()
        keyword_engagement = defaultdict(list)
        
        for _, row in recent_df.iterrows():
            engagement = row['engagement_score']
            
            if isinstance(row.get('keywords'), list):
                for kw in row['keywords']:
                    kw_lower = kw.lower()
                    keyword_counts[kw_lower] += 1
                    keyword_engagement[kw_lower].append(engagement)
            
            if isinstance(row.get('hashtags'), list):
                for tag in row['hashtags']:
                    tag_lower = tag.lower()
                    hashtag_counts[tag_lower] += 1
                    keyword_engagement[tag_lower].append(engagement)
        
        # Calculate trending score
        trending = []
        
        for keyword, count in keyword_counts.most_common(top_n * 2):
            if count < 3:  # Minimum frequency
                continue
            
            avg_engagement = np.mean(keyword_engagement[keyword])
            trending_score = count * np.log1p(avg_engagement)
            
            trending.append({
                'topic': keyword,
                'mentions': count,
                'avg_engagement': avg_engagement,
                'trending_score': trending_score,
                'type': 'keyword'
            })
        
        for hashtag, count in hashtag_counts.most_common(top_n):
            if count < 3:
                continue
            
            avg_engagement = np.mean(keyword_engagement[hashtag])
            trending_score = count * np.log1p(avg_engagement)
            
            trending.append({
                'topic': f"#{hashtag}",
                'mentions': count,
                'avg_engagement': avg_engagement,
                'trending_score': trending_score,
                'type': 'hashtag'
            })
        
        # Sort by trending score
        trending.sort(key=lambda x: x['trending_score'], reverse=True)
        
        return trending[:top_n]
    
    def get_personalized_trends(self, df, user_profile, top_n=20):
        """Get trending topics personalized for user interests"""
        print("Generating personalized trending topics...")
        
        # Get all trending topics
        all_trending = self.get_trending_topics(df, top_n=50)
        
        # Score based on user interests
        user_interests_lower = [i.lower() for i in user_profile['interests']]
        user_keywords = set([k.lower() for k in user_profile.get('keywords', [])])
        
        for topic in all_trending:
            relevance = 0
            topic_lower = topic['topic'].lower().replace('#', '')
            
            # Check if topic matches user interests
            for interest in user_interests_lower:
                if interest in topic_lower or topic_lower in interest:
                    relevance += 3
            
            # Check if topic in user keywords
            if topic_lower in user_keywords:
                relevance += 2
            
            # Partial matching
            for interest in user_interests_lower:
                words = interest.split()
                for word in words:
                    if len(word) > 3 and word in topic_lower:
                        relevance += 1
            
            topic['relevance_score'] = relevance
            topic['personalized_score'] = topic['trending_score'] * (1 + relevance * 0.3)
        
        # Sort by personalized score
        all_trending.sort(key=lambda x: x['personalized_score'], reverse=True)
        
        return all_trending[:top_n]
    
    def get_similar_items(self, df, item_id, top_n=10):
        """Get items similar to a given item"""
        if self.item_features is None:
            self.build_item_features(df)
        
        # Find item index
        item_idx = df[df['id'] == item_id].index
        
        if len(item_idx) == 0:
            return pd.DataFrame()
        
        item_idx = item_idx[0]
        
        # Calculate similarities
        item_vector = self.item_features[item_idx]
        similarities = cosine_similarity(item_vector, self.item_features).flatten()
        
        # Get top similar items (excluding itself)
        similar_indices = similarities.argsort()[::-1][1:top_n+1]
        
        similar_items = df.iloc[similar_indices].copy()
        similar_items['similarity_score'] = similarities[similar_indices]
        
        return similar_items

# Example usage
if __name__ == "__main__":
    # Load processed data
    df = pd.read_csv('processed_unified_data.csv')
    
    # Parse list columns
    for col in ['keywords', 'hashtags']:
        if col in df.columns:
            df[col] = df[col].apply(lambda x: eval(x) if isinstance(x, str) and x.startswith('[') else [])
    
    # Initialize recommendation engine
    recommender = RecommendationEngine()
    
    # Build item features
    recommender.build_item_features(df)
    
    # Create sample user profile
    user_profile = recommender.create_user_profile(
        user_interests=['artificial intelligence', 'machine learning', 'technology']
    )
    
    # Get recommendations
    recommendations = recommender.hybrid_recommendation(df, user_profile, top_n=20)
    
    print("\nTop 10 Recommendations:")
    for idx, row in recommendations.head(10).iterrows():
        print(f"\n{row['title'][:100]}")
        print(f"Platform: {row['platform']}, Engagement: {row['engagement_score']:.2f}")
        print(f"Keywords: {row['keywords'][:3]}")
    
    # Get trending topics
    trending = recommender.get_trending_topics(df, top_n=20)
    
    print("\n\nTop 10 Trending Topics:")
    for i, topic in enumerate(trending[:10], 1):
        print(f"{i}. {topic['topic']} - {topic['mentions']} mentions")
    
    # Get personalized trends
    personalized = recommender.get_personalized_trends(df, user_profile, top_n=20)
    
    print("\n\nTop 10 Personalized Trends:")
    for i, topic in enumerate(personalized[:10], 1):
        print(f"{i}. {topic['topic']} - Score: {topic['personalized_score']:.2f}")
    
    # Save results
    recommendations.to_csv('recommendations.csv', index=False)
    
    with open('trending_topics.json', 'w') as f:
        json.dump(trending, f, indent=2)
    
    with open('personalized_trends.json', 'w') as f:
        json.dump(personalized, f, indent=2)