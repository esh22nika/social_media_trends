import requests
import pandas as pd
import time
from datetime import datetime, timedelta
import json

class BlueskyDataCollector:
    def __init__(self):
        self.base_url = "https://public.api.bsky.app/xrpc"
        self.session = requests.Session()
    
    def get_trending_topics(self):
        """Get current trending topics"""
        try:
            url = f"{self.base_url}/app.bsky.unspecced.getTrends"
            response = self.session.get(url)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching trends: {e}")
            return {}
    
    def search_posts(self, query, limit=100, cursor=None):
        """Search posts by query"""
        try:
            url = f"{self.base_url}/app.bsky.feed.searchPosts"
            params = {
                'q': query,
                'limit': limit
            }
            if cursor:
                params['cursor'] = cursor
            
            response = self.session.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error searching posts for '{query}': {e}")
            return {}
    
    def get_author_feed(self, actor, limit=50):
        """Get posts from a specific author"""
        try:
            url = f"{self.base_url}/app.bsky.feed.getAuthorFeed"
            params = {
                'actor': actor,
                'limit': limit
            }
            response = self.session.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching author feed: {e}")
            return {}
    
    def get_post_thread(self, uri):
        """Get post thread with replies"""
        try:
            url = f"{self.base_url}/app.bsky.feed.getPostThread"
            params = {'uri': uri}
            response = self.session.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching thread: {e}")
            return {}
    
    def get_popular_feed(self, limit=100):
        """Get popular feed"""
        try:
            url = f"{self.base_url}/app.bsky.feed.getFeed"
            params = {
                'feed': 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot',
                'limit': limit
            }
            response = self.session.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching popular feed: {e}")
            return {}
    
    def get_timeline(self, limit=100):
        """Get public timeline"""
        try:
            url = f"{self.base_url}/app.bsky.feed.getTimeline"
            params = {'limit': limit}
            response = self.session.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching timeline: {e}")
            return {}
    
    def parse_post_data(self, post):
        """Parse post data into structured format"""
        try:
            record = post.get('record', {})
            author = post.get('author', {})
            
            # Extract hashtags
            hashtags = []
            facets = record.get('facets', [])
            for facet in facets:
                for feature in facet.get('features', []):
                    if feature.get('$type') == 'app.bsky.richtext.facet#tag':
                        hashtags.append(feature.get('tag', ''))
            
            # Extract mentions
            mentions = []
            for facet in facets:
                for feature in facet.get('features', []):
                    if feature.get('$type') == 'app.bsky.richtext.facet#mention':
                        mentions.append(feature.get('did', ''))
            
            # Extract URLs
            urls = []
            for facet in facets:
                for feature in facet.get('features', []):
                    if feature.get('$type') == 'app.bsky.richtext.facet#link':
                        urls.append(feature.get('uri', ''))
            
            # Extract media
            embed = record.get('embed', {})
            has_image = embed.get('$type') == 'app.bsky.embed.images'
            has_video = embed.get('$type') == 'app.bsky.embed.video'
            has_external = embed.get('$type') == 'app.bsky.embed.external'
            
            image_count = len(embed.get('images', [])) if has_image else 0
            
            return {
                'uri': post.get('uri', ''),
                'cid': post.get('cid', ''),
                'author_did': author.get('did', ''),
                'author_handle': author.get('handle', ''),
                'author_display_name': author.get('displayName', ''),
                'author_followers': author.get('followersCount', 0),
                'author_following': author.get('followingCount', 0),
                'author_posts': author.get('postsCount', 0),
                'text': record.get('text', ''),
                'created_at': record.get('createdAt', ''),
                'reply_count': post.get('replyCount', 0),
                'repost_count': post.get('repostCount', 0),
                'like_count': post.get('likeCount', 0),
                'quote_count': post.get('quoteCount', 0),
                'hashtags': hashtags,
                'mentions': mentions,
                'urls': urls,
                'has_image': has_image,
                'has_video': has_video,
                'has_external': has_external,
                'image_count': image_count,
                'is_reply': 'reply' in record,
                'language': record.get('langs', [''])[0] if record.get('langs') else ''
            }
        except Exception as e:
            print(f"Error parsing post: {e}")
            return None
    
    def collect_comprehensive_dataset(self, trending_topics=None, additional_queries=None, 
                                     max_posts_per_query=200):
        """Collect comprehensive dataset from multiple sources"""
        all_posts = []
        
        # 1. Get trending topics if not provided
        if trending_topics is None:
            print("Fetching trending topics...")
            trends_data = self.get_trending_topics()
            trending_topics = []
            
            if 'trends' in trends_data:
                trending_topics = [trend.get('topic', '') for trend in trends_data['trends']]
                print(f"Found {len(trending_topics)} trending topics")
        
        # 2. Get popular feed
        print("Fetching popular feed...")
        popular_feed = self.get_popular_feed(limit=100)
        if 'feed' in popular_feed:
            for item in popular_feed['feed']:
                post_data = self.parse_post_data(item.get('post', {}))
                if post_data:
                    post_data['source'] = 'popular_feed'
                    all_posts.append(post_data)
        
        time.sleep(1)
        
        # 3. Search for trending topics
        queries = trending_topics[:10] if trending_topics else []
        if additional_queries:
            queries.extend(additional_queries)
        
        for query in queries:
            print(f"Searching posts for: {query}")
            cursor = None
            posts_collected = 0
            
            while posts_collected < max_posts_per_query:
                search_results = self.search_posts(query, limit=100, cursor=cursor)
                
                if 'posts' not in search_results or len(search_results['posts']) == 0:
                    break
                
                for post in search_results['posts']:
                    post_data = self.parse_post_data(post)
                    if post_data:
                        post_data['source'] = f'search:{query}'
                        post_data['search_query'] = query
                        all_posts.append(post_data)
                        posts_collected += 1
                
                # Check for cursor to get more results
                cursor = search_results.get('cursor')
                if not cursor:
                    break
                
                time.sleep(1)  # Rate limiting
            
            print(f"  Collected {posts_collected} posts")
            time.sleep(2)
        
        # 4. Remove duplicates based on URI
        df = pd.DataFrame(all_posts)
        if not df.empty:
            df = df.drop_duplicates(subset=['uri'], keep='first')
        
        print(f"\nTotal posts collected: {len(df)}")
        return df
    
    def enrich_with_threads(self, df, sample_size=50):
        """Enrich dataset with thread information for a sample of posts"""
        print(f"Enriching dataset with thread information (sample size: {sample_size})...")
        
        # Sample posts with high engagement
        if len(df) > sample_size:
            sample_df = df.nlargest(sample_size, 'like_count')
        else:
            sample_df = df
        
        thread_data = []
        
        for idx, row in sample_df.iterrows():
            try:
                thread = self.get_post_thread(row['uri'])
                if 'thread' in thread:
                    thread_post = thread['thread']
                    replies = thread_post.get('replies', [])
                    
                    thread_data.append({
                        'uri': row['uri'],
                        'reply_count_actual': len(replies),
                        'thread_depth': self._get_thread_depth(thread_post)
                    })
                
                time.sleep(0.5)
            except Exception as e:
                print(f"Error getting thread for {row['uri']}: {e}")
                continue
        
        # Merge thread data
        if thread_data:
            thread_df = pd.DataFrame(thread_data)
            df = df.merge(thread_df, on='uri', how='left')
        
        return df
    
    def _get_thread_depth(self, thread_post, depth=0):
        """Recursively calculate thread depth"""
        replies = thread_post.get('replies', [])
        if not replies:
            return depth
        
        max_depth = depth
        for reply in replies:
            reply_depth = self._get_thread_depth(reply, depth + 1)
            max_depth = max(max_depth, reply_depth)
        
        return max_depth
    
    def save_dataset(self, df, filename='bluesky_data.csv'):
        """Save dataset to CSV"""
        # Convert list columns to JSON strings
        list_columns = ['hashtags', 'mentions', 'urls']
        for col in list_columns:
            if col in df.columns:
                df[col] = df[col].apply(json.dumps)
        
        df.to_csv(filename, index=False)
        print(f"Dataset saved to {filename}")
        return filename

# Example usage
if __name__ == "__main__":
    collector = BlueskyDataCollector()
    
    # Additional search queries (customize based on your interests)
    additional_queries = [
        'artificial intelligence',
        'machine learning',
        'technology',
        'programming',
        'data science',
        'web development'
    ]
    
    # Collect comprehensive dataset
    df = collector.collect_comprehensive_dataset(
        additional_queries=additional_queries,
        max_posts_per_query=200
    )
    
    # Enrich with thread information
    df = collector.enrich_with_threads(df, sample_size=50)
    
    # Save dataset
    collector.save_dataset(df, 'bluesky_trending_data.csv')
    
    # Print summary statistics
    print("\n" + "="*60)
    print("BLUESKY DATA COLLECTION SUMMARY")
    print("="*60)
    print(f"Total posts collected: {len(df)}")
    print(f"Date range: {df['created_at'].min()} to {df['created_at'].max()}")
    print(f"Unique authors: {df['author_handle'].nunique()}")
    print(f"Total engagement: {df['like_count'].sum() + df['repost_count'].sum()}")
    print(f"Posts with images: {df['has_image'].sum()}")
    print(f"Posts with videos: {df['has_video'].sum()}")
    print(f"Average likes per post: {df['like_count'].mean():.2f}")
    print(f"Average reposts per post: {df['repost_count'].mean():.2f}")