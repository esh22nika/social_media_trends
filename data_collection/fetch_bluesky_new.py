from atproto import Client
import pandas as pd
import time
import json

class BlueskyDataCollector:
    def __init__(self, handle, password):
        self.client = Client()
        self.client.login(handle, password)
        print(f"Logged in as {handle}")

    def get_trending_topics(self):
        try:
            return self.client.app.bsky.unspecced.get_trends()
        except Exception as e:
            print(f"Error fetching trends: {e}")
            return {}

    def get_popular_feed(self, limit=100):
        try:
            # Use the correct feed URI for "What's Hot"
            params = {
                'feed': 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot',
                'limit': limit
            }
            return self.client.app.bsky.feed.get_feed(params=params)
        except Exception as e:
            print(f"Error fetching popular feed: {e}")
            return {}

    def search_posts(self, query, limit=100, cursor=None):
        try:
            params = {'q': query, 'limit': limit, 'cursor': cursor}
            return self.client.app.bsky.feed.search_posts(params=params)
        except Exception as e:
            print(f"Error searching posts for '{query}': {e}")
            return {}

    def parse_post_data(self, post):
        try:
            # Use getattr for both attribute and dictionary access for robustness
            record = getattr(post, 'record', None)
            author = getattr(post, 'author', None)

            if not record or not author:
                return None

            # Access text and created_at using getattr
            text = getattr(record, 'text', getattr(record, 'text', ''))
            created_at = getattr(record, 'createdAt', getattr(record, 'createdAt', ''))


            # Extract hashtags, mentions, urls from facets — these are lists of objects
            hashtags = []
            mentions = []
            urls = []

            facets = getattr(record, 'facets', [])
            if facets: # Check if facets is not None or empty
                for facet in facets:
                    features = getattr(facet, 'features', [])
                    if features: # Check if features is not None or empty
                        for feature in features:
                            t = getattr(feature, '$type', '')
                            if t == 'app.bsky.richtext.facet#tag':
                                tag = getattr(feature, 'tag', '')
                                if tag: hashtags.append(tag)
                            elif t == 'app.bsky.richtext.facet#mention':
                                did = getattr(feature, 'did', '')
                                if did: mentions.append(did)
                            elif t == 'app.bsky.richtext.facet#link':
                                uri = getattr(feature, 'uri', '')
                                if uri: urls.append(uri)


            embed = getattr(record, 'embed', None)
            embed_type = getattr(embed, '$type', '') if embed else ''
            has_image = embed_type == 'app.bsky.embed.images'
            has_video = embed_type == 'app.bsky.embed.video' # This might not be a direct type, adjust if needed
            has_external = embed_type == 'app.bsky.embed.external'
            image_count = len(getattr(embed, 'images', [])) if has_image and getattr(embed, 'images', None) is not None else 0


            return {
                'uri': getattr(post, 'uri', ''),
                'cid': getattr(post, 'cid', ''),
                'author_did': getattr(author, 'did', ''),
                'author_handle': getattr(author, 'handle', ''),
                'author_display_name': getattr(author, 'displayName', getattr(author, 'displayName', '')),
                'author_followers': getattr(author, 'followersCount', getattr(author, 'followersCount', 0)),
                'author_following': getattr(author, 'followingCount', getattr(author, 'followingCount', 0)),
                'author_posts': getattr(author, 'postsCount', getattr(author, 'postsCount', 0)),
                'text': text,
                'created_at': created_at,
                'reply_count': getattr(post, 'replyCount', getattr(post, 'replyCount', 0)),
                'repost_count': getattr(post, 'repostCount', getattr(post, 'repostCount', 0)),
                'like_count': getattr(post, 'likeCount', getattr(post, 'likeCount', 0)),
                'quote_count': getattr(post, 'quoteCount', getattr(post, 'quoteCount', 0)),
                'hashtags': hashtags,
                'mentions': mentions,
                'urls': urls,
                'has_image': has_image,
                'has_video': has_video,
                'has_external': has_external,
                'image_count': image_count,
                'is_reply': hasattr(record, 'reply') or (isinstance(record, dict) and 'reply' in record),
                'language': getattr(record, 'langs', [''])[0] if getattr(record, 'langs', None) else ''
            }
        except Exception as e:
            # print(f"Error parsing post: {e}. Post data: {post}") # Uncomment for detailed debugging
            return None


    def collect_trending_data(self, max_posts=200):
        all_posts = []

        # 1. Get trending topics
        trends_data = self.get_trending_topics()
        trending_topics = []

        # Check for 'trends' attribute first, then dictionary key
        if hasattr(trends_data, 'trends') and trends_data.trends is not None:
            trending_topics = [trend.topic for trend in trends_data.trends if hasattr(trend, 'topic')]
        elif isinstance(trends_data, dict) and 'trends' in trends_data and trends_data['trends'] is not None:
             trending_topics = [trend.get('topic', '') for trend in trends_data['trends'] if isinstance(trend, dict) and 'topic' in trend]

        print(f"Found {len(trending_topics)} trending topics")

        # 2. Get popular feed posts
        popular_feed = self.get_popular_feed(limit=100)
        # Check for 'feed' attribute first, then dictionary key
        if hasattr(popular_feed, 'feed') and popular_feed.feed is not None:
            for item in popular_feed.feed:
                # Check if item.post exists before parsing
                if hasattr(item, 'post') and item.post is not None:
                    post_data = self.parse_post_data(item.post)
                    if post_data:
                        post_data['source'] = 'popular_feed'
                        all_posts.append(post_data)
        elif isinstance(popular_feed, dict) and 'feed' in popular_feed and popular_feed['feed'] is not None:
             for item in popular_feed['feed']:
                # Check if item['post'] exists before parsing
                if isinstance(item, dict) and 'post' in item and item['post'] is not None:
                    post_data = self.parse_post_data(item['post'])
                    if post_data:
                        post_data['source'] = 'popular_feed'
                        all_posts.append(post_data)

        time.sleep(1)

        # 3. Search posts for trending topics using authenticated client
        queries = trending_topics[:10]  # limit to top 10 topics
        for query in queries:
            print(f"Searching posts for: {query}")
            cursor = None
            posts_collected = 0

            while posts_collected < max_posts:
                search_results = self.search_posts(query, limit=100, cursor=cursor)
                # Check for 'posts' attribute first, then dictionary key
                posts = getattr(search_results, 'posts', [])
                if not posts:
                    break

                for post in posts:
                    post_data = self.parse_post_data(post)
                    if post_data:
                        post_data['source'] = f'search:{query}'
                        all_posts.append(post_data)
                        posts_collected += 1

                cursor = getattr(search_results, 'cursor', None)
                if not cursor:
                    break
                time.sleep(1)
            print(f"  Collected {posts_collected} posts for query: {query}")
            time.sleep(1)

        # Create DataFrame and deduplicate
        df = pd.DataFrame(all_posts)
        if not df.empty:
            df = df.drop_duplicates(subset=['uri'], keep='first')

        print(f"\nTotal posts collected: {len(df)}")
        return df


    def save_dataset(self, df, filename='bluesky_trending_authenticated.csv'):
        list_columns = ['hashtags', 'mentions', 'urls']
        for col in list_columns:
            if col in df.columns:
                # Ensure the column is treated as a list before dumping
                df[col] = df[col].apply(lambda x: json.dumps(x) if isinstance(x, list) else json.dumps([]))


        df.to_csv(filename, index=False)
        print(f"Dataset saved to {filename}")
        return filename

# Usage example
if __name__ == "__main__":
    handle = "neeks05.bsky.social"
    password = "ttendlens"

    collector = BlueskyDataCollector(handle, password)
    df = collector.collect_trending_data(max_posts=100)
    collector.save_dataset(df, 'bluesky_trending_authenticated.csv')

    print(f"Total posts collected: {len(df)}")
