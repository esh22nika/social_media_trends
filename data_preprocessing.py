import pandas as pd
import numpy as np
import re
import json
from datetime import datetime
from textblob import TextBlob
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
import warnings
warnings.filterwarnings('ignore')

# Download required NLTK data
# List of all required NLTK resources
nltk_packages = ['punkt', 'punkt_tab', 'stopwords', 'averaged_perceptron_tagger']

for pkg in nltk_packages:
    try:
        nltk.data.find(f'tokenizers/{pkg}') if 'punkt' in pkg else nltk.data.find(f'corpora/{pkg}')
    except LookupError:
        try:
            nltk.download(pkg, quiet=True)
        except:
            print(f"Warning: Could not download {pkg}. Some text processing may fail.")

class DataPreprocessor:
    def __init__(self):
        self.stop_words = set(stopwords.words('english'))
        
    def clean_text(self, text):
        """Clean and normalize text"""
        if pd.isna(text) or text == '':
            return ''
        
        # Convert to string
        text = str(text)
        
        # Remove URLs
        text = re.sub(r'http\S+|www.\S+', '', text)
        
        # Remove mentions and hashtags symbols (keep the words)
        text = re.sub(r'[@#]', '', text)
        
        # Remove special characters but keep spaces
        text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        return text.lower()
    
    def extract_hashtags(self, text):
        """Extract hashtags from text"""
        if pd.isna(text) or text == '':
            return []
        
        hashtags = re.findall(r'#(\w+)', str(text))
        return list(set(hashtags))  # Remove duplicates
    
    def extract_mentions(self, text):
        """Extract mentions from text"""
        if pd.isna(text):
            return []
        return re.findall(r'@(\w+)', str(text))
    
    def calculate_engagement(self, row, platform):
        """Calculate engagement score based on platform"""
        if platform == 'reddit':
            return row.get('score', 0) + row.get('num_comments', 0) * 2
        elif platform == 'youtube':
            views = row.get('view_count', 0)
            likes = row.get('like_count', 0)
            comments = row.get('comment_count', 0)
            return likes * 2 + comments * 3 + views * 0.01
        elif platform == 'bluesky':
            return (row.get('like_count', 0) * 2 + 
                   row.get('repost_count', 0) * 3 + 
                   row.get('reply_count', 0) * 2)
        return 0
    
    def extract_keywords(self, text, max_keywords=10):
        """Extract keywords from text"""
        if pd.isna(text) or text == '':
            return []
        
        # Simple keyword extraction: get words that are longer and appear to be meaningful
        words = re.findall(r'\b[a-zA-Z]{4,}\b', str(text).lower())
        
        # Remove common stop words
        stop_words = {'that', 'this', 'with', 'from', 'have', 'will', 'your', 'more', 
                     'about', 'been', 'their', 'what', 'when', 'where', 'which', 'would'}
        
        keywords = [w for w in words if w not in stop_words]
        
        # Return most common ones
        from collections import Counter
        counter = Counter(keywords)
        return [word for word, _ in counter.most_common(max_keywords)]

    
    def analyze_sentiment(self, text):
        """Analyze sentiment of text"""
        if pd.isna(text) or text == '':
            return 'neutral'
        
        try:
            blob = TextBlob(str(text))
            polarity = blob.sentiment.polarity
            
            if polarity > 0.1:
                return 'positive'
            elif polarity < -0.1:
                return 'negative'
            else:
                return 'neutral'
        except:
            return 'neutral'

    
    def preprocess_reddit(self, df):
        """Preprocess Reddit data to unified format"""
        if df is None or df.empty:
            return pd.DataFrame()
        
        print("Preprocessing Reddit data...")
        
        # Create unified format
        unified = pd.DataFrame()
        
        # Map Reddit columns to unified format
        unified['id'] = df['post_id'].astype(str)
        unified['title'] = df['title'].fillna('')
        unified['text'] = df['selftext'].fillna('')
        unified['author'] = df['author'].fillna('unknown')
        
        # Fix datetime column - Reddit uses 'created_utc_x'
        unified['created_at'] = pd.to_datetime(df['created_utc_x'], errors='coerce')
        
        # Engagement metrics
        unified['score'] = pd.to_numeric(df['score'], errors='coerce').fillna(0)
        unified['num_comments'] = pd.to_numeric(df['num_comments'], errors='coerce').fillna(0)
        unified['engagement_score'] = unified['score'] + (unified['num_comments'] * 2)
        
        # Platform identifier
        unified['platform'] = 'reddit'
        unified['url'] = 'https://reddit.com' + df['permalink'].fillna('')
        
        # Extract keywords from title and text
        unified['keywords'] = unified.apply(
            lambda row: self.extract_keywords(row['title'] + ' ' + row['text']), 
            axis=1
        )
        
        # Reddit doesn't have hashtags, so extract from text if any
        unified['hashtags'] = unified['text'].apply(self.extract_hashtags)
        
        # Sentiment analysis
        unified['sentiment'] = unified['text'].apply(self.analyze_sentiment)
        
        # Normalize engagement (0-100 scale)
        if unified['engagement_score'].max() > 0:
            unified['normalized_engagement'] = (
                (unified['engagement_score'] / unified['engagement_score'].max()) * 100
            )
        else:
            unified['normalized_engagement'] = 0
        
        # Trend status based on engagement
        unified['trend_status'] = unified['normalized_engagement'].apply(
            lambda x: 'rising' if x > 70 else ('stable' if x > 40 else 'falling')
        )
        
        print(f"  Processed {len(unified)} Reddit posts")
        return unified

    # Backwards-compatible wrapper
    def preprocess_reddit_data(self, df):
        """Backward compatible wrapper for older callers that expect preprocess_reddit_data."""
        return self.preprocess_reddit(df)
    
    def preprocess_youtube(self, df):
        """Preprocess YouTube data to unified format"""
        if df is None or df.empty:
            return pd.DataFrame()
        
        print("Preprocessing YouTube data...")
        
        unified = pd.DataFrame()
        
        # Map YouTube columns
        unified['id'] = df['video_id'].astype(str)
        unified['title'] = df['title'].fillna('')
        unified['text'] = df['description'].fillna('')
        unified['author'] = df['channel_title'].fillna('unknown')
        
        # Fix datetime column - YouTube uses 'published_at'
        unified['created_at'] = pd.to_datetime(df['published_at'], errors='coerce')
        
        # Engagement metrics
        unified['like_count'] = pd.to_numeric(df['like_count'], errors='coerce').fillna(0)
        unified['comment_count'] = pd.to_numeric(df['comment_count'], errors='coerce').fillna(0)
        unified['view_count'] = pd.to_numeric(df['view_count'], errors='coerce').fillna(0)
        
        # Calculate engagement score
        unified['engagement_score'] = (
            unified['like_count'] + 
            (unified['comment_count'] * 3) + 
            (unified['view_count'] * 0.01)
        )
        
        # Platform
        unified['platform'] = 'youtube'
        unified['url'] = 'https://youtube.com/watch?v=' + df['video_id'].fillna('')
        
        # Parse tags (they're stored as string representation of list)
        def parse_tags(tags_str):
            if pd.isna(tags_str) or tags_str == '':
                return []
            try:
                if isinstance(tags_str, str):
                    # Remove brackets and quotes, split by comma
                    tags_str = tags_str.strip("[]'\"")
                    return [t.strip().strip("'\"") for t in tags_str.split(',') if t.strip()]
                return []
            except:
                return []
        
        unified['keywords'] = df['tags'].apply(parse_tags)
        
        # YouTube doesn't typically have hashtags in API, extract from description
        unified['hashtags'] = unified['text'].apply(self.extract_hashtags)
        
        # Sentiment
        unified['sentiment'] = unified['text'].apply(self.analyze_sentiment)
        
        # Normalize engagement
        if unified['engagement_score'].max() > 0:
            unified['normalized_engagement'] = (
                (unified['engagement_score'] / unified['engagement_score'].max()) * 100
            )
        else:
            unified['normalized_engagement'] = 0
        
        unified['trend_status'] = unified['normalized_engagement'].apply(
            lambda x: 'rising' if x > 70 else ('stable' if x > 40 else 'falling')
        )
        
        print(f"  Processed {len(unified)} YouTube videos")
        return unified

    # Backwards-compatible wrapper
    def preprocess_youtube_data(self, df):
        """Backward compatible wrapper for older callers that expect preprocess_youtube_data."""
        return self.preprocess_youtube(df)
    
    def preprocess_bluesky(self, df):
        """Preprocess Bluesky data to unified format"""
        if df is None or df.empty:
            return pd.DataFrame()
        
        print("Preprocessing Bluesky data...")
        
        unified = pd.DataFrame()
        
        # Map Bluesky columns
        unified['id'] = df['uri'].astype(str)
        unified['title'] = df['text'].fillna('').str[:100]  # Use first 100 chars of text as title
        unified['text'] = df['text'].fillna('')
        unified['author'] = df['author_handle'].fillna('unknown')
        
        # Fix datetime - Bluesky has created_at but might have NaN values
        unified['created_at'] = pd.to_datetime(df['created_at'], errors='coerce')
        # Fill NaN dates with a default recent date
        unified['created_at'] = unified['created_at'].fillna(pd.Timestamp.now())
        
        # Engagement metrics
        unified['like_count'] = pd.to_numeric(df['like_count'], errors='coerce').fillna(0)
        unified['reply_count'] = pd.to_numeric(df['reply_count'], errors='coerce').fillna(0)
        unified['repost_count'] = pd.to_numeric(df['repost_count'], errors='coerce').fillna(0)
        
        unified['engagement_score'] = (
            unified['like_count'] + 
            (unified['reply_count'] * 2) + 
            (unified['repost_count'] * 1.5)
        )
        
        # Platform
        unified['platform'] = 'bluesky'
        unified['url'] = df['uri'].fillna('')
        
        # Parse hashtags (stored as string representation of list)
        def parse_list_str(list_str):
            if pd.isna(list_str) or list_str == '' or list_str == '[]':
                return []
            try:
                if isinstance(list_str, str):
                    return eval(list_str)
                return []
            except:
                return []
        
        unified['hashtags'] = df['hashtags'].apply(parse_list_str)
        
        # Extract keywords from text
        unified['keywords'] = unified['text'].apply(self.extract_keywords)
        
        # Sentiment
        unified['sentiment'] = unified['text'].apply(self.analyze_sentiment)
        
        # Normalize engagement
        if unified['engagement_score'].max() > 0:
            unified['normalized_engagement'] = (
                (unified['engagement_score'] / unified['engagement_score'].max()) * 100
            )
        else:
            unified['normalized_engagement'] = 0
        
        unified['trend_status'] = unified['normalized_engagement'].apply(
            lambda x: 'rising' if x > 70 else ('stable' if x > 40 else 'falling')
        )
        
        print(f"  Processed {len(unified)} Bluesky posts")
        return unified

    # Backwards-compatible wrapper
    def preprocess_bluesky_data(self, df):
        """Backward compatible wrapper for older callers that expect preprocess_bluesky_data."""
        return self.preprocess_bluesky(df)
    
    def normalize_scores(self, series):
        """Normalize scores to 0-100 range"""
        if series.max() == series.min():
            return pd.Series([50] * len(series))
        return ((series - series.min()) / (series.max() - series.min()) * 100).fillna(0)
    
    def create_unified_dataset(self, reddit_df=None, youtube_df=None, bluesky_df=None):
        """Create unified dataset from all platforms"""
        print("Creating unified dataset...")
        # Handle None or empty DataFrames gracefully
        if reddit_df is None or reddit_df.empty:
            print("⚠️  Reddit data is missing or empty.")
        if youtube_df is None or youtube_df.empty:
            print("⚠️  YouTube data is missing or empty.")
        if bluesky_df is None or bluesky_df.empty:
            print("⚠️  Bluesky data is missing or empty.")

        unified_data = []
        
        # Process Reddit
        if reddit_df is not None and not reddit_df.empty:
            reddit_df = self.preprocess_reddit_data(reddit_df)
            for _, row in reddit_df.iterrows():
                unified_data.append({
                    'id': row.get('post_id', ''),
                    'platform': 'reddit',
                    'title': row.get('title', ''),
                    'text': row.get('cleaned_text', ''),
                    'author': row.get('author', ''),
                    'created_at': row.get('created_utc', datetime.now()),
                    'engagement_score': row.get('engagement_score', 0),
                    'normalized_engagement': row.get('normalized_engagement', 0),
                    'sentiment': row.get('sentiment', 'neutral'),
                    'sentiment_score': row.get('sentiment_score', 0),
                    'keywords': row.get('keywords', []),
                    'hashtags': row.get('hashtags', []),
                    'subreddit': row.get('subreddit', ''),
                    'url': f"https://reddit.com{row.get('permalink', '')}"
                })
        
        # Process YouTube
        if youtube_df is not None and not youtube_df.empty:
            youtube_df = self.preprocess_youtube_data(youtube_df)
            for _, row in youtube_df.iterrows():
                unified_data.append({
                    'id': row.get('video_id', ''),
                    'platform': 'youtube',
                    'title': row.get('title', ''),
                    'text': row.get('cleaned_text', ''),
                    'author': row.get('channel_title', ''),
                    'created_at': row.get('published_at', datetime.now()),
                    'engagement_score': row.get('engagement_score', 0),
                    'normalized_engagement': row.get('normalized_engagement', 0),
                    'sentiment': row.get('sentiment', 'neutral'),
                    'sentiment_score': row.get('sentiment_score', 0),
                    'keywords': row.get('keywords', []),
                    'hashtags': row.get('tags', []),
                    'channel': row.get('channel_title', ''),
                    'url': f"https://youtube.com/watch?v={row.get('video_id', '')}"
                })
        
        # Process Bluesky
        if bluesky_df is not None and not bluesky_df.empty:
            bluesky_df = self.preprocess_bluesky_data(bluesky_df)
            for _, row in bluesky_df.iterrows():
                unified_data.append({
                    'id': row.get('uri', ''),
                    'platform': 'bluesky',
                    'title': str(row.get('text', '') or '')[:100],  # Safe conversion
                    'text': row.get('cleaned_text', ''),
                    'author': row.get('author_handle', ''),
                    'created_at': row.get('created_at', datetime.now()),
                    'engagement_score': row.get('engagement_score', 0),
                    'normalized_engagement': row.get('normalized_engagement', 0),
                    'sentiment': row.get('sentiment', 'neutral'),
                    'sentiment_score': row.get('sentiment_score', 0),
                    'keywords': row.get('keywords', []),
                    'hashtags': row.get('hashtags', []),
                    'handle': row.get('author_handle', ''),
                    'url': row.get('uri', '')
                })
        
        # Create unified DataFrame
        unified_df = pd.DataFrame(unified_data)
        
        if not unified_df.empty:
            # Sort by engagement
            unified_df = unified_df.sort_values('engagement_score', ascending=False)
            
            # Add trend indicators
            unified_df['trend_status'] = unified_df['normalized_engagement'].apply(
                lambda x: 'rising' if x > 70 else 'stable' if x > 40 else 'falling'
            )
        
        print(f"Unified dataset created with {len(unified_df)} records")
        return unified_df

# Example usage
if __name__ == "__main__":
    preprocessor = DataPreprocessor()
    
    def safe_read_csv(path):
        try:
            return pd.read_csv(path)
        except FileNotFoundError:
            print(f"⚠️  File not found: {path}")
            return pd.DataFrame()
        except Exception as e:
            print(f"⚠️  Error reading {path}: {e}")
            return pd.DataFrame()
    
    reddit_df = safe_read_csv('reddit_trending_data.csv')
    youtube_df = safe_read_csv('youtube_trending_data.csv')
    bluesky_df = safe_read_csv('bluesky_trending_authenticated.csv')
    
    unified_df = preprocessor.create_unified_dataset(reddit_df, youtube_df, bluesky_df)
    
    if not unified_df.empty:
        unified_df.to_csv('processed_unified_data.csv', index=False)
        print("✅ Saved processed data to processed_unified_data.csv")
    else:
        print("⚠️  No unified data to save.")
