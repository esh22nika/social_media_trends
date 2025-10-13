import praw
import pandas as pd
import time
from datetime import datetime, timedelta
import json
import re

class RedditDataCollector:
    def __init__(self, client_id, client_secret, user_agent):
        """Initialize Reddit API client"""
        self.reddit = praw.Reddit(
            client_id=client_id,
            client_secret=client_secret,
            user_agent=user_agent
        )
        print(f"Connected to Reddit as: {self.reddit.read_only}")
    
    def get_trending_subreddits(self, limit=50):
        """Get trending/popular subreddits"""
        try:
            trending = list(self.reddit.subreddits.popular(limit=limit))
            return [sub.display_name for sub in trending]
        except Exception as e:
            print(f"Error fetching trending subreddits: {e}")
            return []
    
    def get_subreddit_posts(self, subreddit_name, time_filter='week', limit=100, 
                           sort_by='hot'):
        """
        Get posts from a subreddit
        sort_by: 'hot', 'new', 'top', 'rising', 'controversial'
        time_filter: 'hour', 'day', 'week', 'month', 'year', 'all'
        """
        posts = []
        try:
            subreddit = self.reddit.subreddit(subreddit_name)
            
            if sort_by == 'hot':
                submissions = subreddit.hot(limit=limit)
            elif sort_by == 'new':
                submissions = subreddit.new(limit=limit)
            elif sort_by == 'top':
                submissions = subreddit.top(time_filter=time_filter, limit=limit)
            elif sort_by == 'rising':
                submissions = subreddit.rising(limit=limit)
            elif sort_by == 'controversial':
                submissions = subreddit.controversial(time_filter=time_filter, limit=limit)
            else:
                submissions = subreddit.hot(limit=limit)
            
            for submission in submissions:
                post_data = self.parse_submission(submission, subreddit_name)
                if post_data:
                    posts.append(post_data)
            
        except Exception as e:
            print(f"Error fetching posts from r/{subreddit_name}: {e}")
        
        return posts
    
    def search_posts(self, query, subreddit_name=None, time_filter='week', 
                    limit=100, sort='relevance'):
        """
        Search for posts across Reddit or in specific subreddit
        sort: 'relevance', 'hot', 'top', 'new', 'comments'
        """
        posts = []
        try:
            if subreddit_name:
                subreddit = self.reddit.subreddit(subreddit_name)
            else:
                subreddit = self.reddit.subreddit('all')
            
            submissions = subreddit.search(
                query=query,
                sort=sort,
                time_filter=time_filter,
                limit=limit
            )
            
            for submission in submissions:
                post_data = self.parse_submission(submission, subreddit_name or 'all')
                if post_data:
                    post_data['search_query'] = query
                    posts.append(post_data)
        
        except Exception as e:
            print(f"Error searching posts for '{query}': {e}")
        
        return posts
    
    def parse_submission(self, submission, subreddit_name):
        """Parse Reddit submission into structured format"""
        try:
            # Get post type
            if submission.is_self:
                post_type = 'text'
            elif submission.is_video:
                post_type = 'video'
            elif hasattr(submission, 'post_hint'):
                post_type = submission.post_hint
            else:
                post_type = 'link'
            
            # Extract URLs from text
            urls = re.findall(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', 
                            submission.selftext if submission.is_self else '')
            
            # Calculate engagement metrics
            total_engagement = submission.score + submission.num_comments
            
            # Get awards info
            award_count = submission.total_awards_received
            
            # Get flair
            link_flair = submission.link_flair_text if submission.link_flair_text else ''
            author_flair = submission.author_flair_text if submission.author_flair_text else ''
            
            return {
                'post_id': submission.id,
                'subreddit': subreddit_name,
                'title': submission.title,
                'selftext': submission.selftext if submission.is_self else '',
                'author': str(submission.author) if submission.author else '[deleted]',
                'created_utc': datetime.fromtimestamp(submission.created_utc),
                'score': submission.score,
                'upvote_ratio': submission.upvote_ratio,
                'num_comments': submission.num_comments,
                'total_engagement': total_engagement,
                'post_type': post_type,
                'is_self': submission.is_self,
                'is_video': submission.is_video,
                'is_original_content': submission.is_original_content,
                'over_18': submission.over_18,
                'spoiler': submission.spoiler,
                'stickied': submission.stickied,
                'locked': submission.locked,
                'permalink': submission.permalink,
                'url': submission.url,
                'domain': submission.domain,
                'award_count': award_count,
                'link_flair': link_flair,
                'author_flair': author_flair,
                'gilded': submission.gilded,
                'distinguished': submission.distinguished if submission.distinguished else 'none',
                'urls_in_text': urls,
                'text_length': len(submission.selftext) if submission.is_self else 0,
                'title_length': len(submission.title)
            }
        except Exception as e:
            print(f"Error parsing submission: {e}")
            return None
    
    def get_post_comments(self, post_id, limit=100):
        """Get comments for a specific post"""
        comments_data = []
        try:
            submission = self.reddit.submission(id=post_id)
            submission.comments.replace_more(limit=0)  # Remove "load more comments"
            
            comment_count = 0
            for comment in submission.comments.list():
                if comment_count >= limit:
                    break
                
                if hasattr(comment, 'body'):
                    comments_data.append({
                        'comment_id': comment.id,
                        'post_id': post_id,
                        'author': str(comment.author) if comment.author else '[deleted]',
                        'body': comment.body,
                        'score': comment.score,
                        'created_utc': datetime.fromtimestamp(comment.created_utc),
                        'is_submitter': comment.is_submitter,
                        'distinguished': comment.distinguished if comment.distinguished else 'none',
                        'depth': comment.depth,
                        'gilded': comment.gilded
                    })
                    comment_count += 1
        
        except Exception as e:
            print(f"Error fetching comments for post {post_id}: {e}")
        
        return comments_data
    
    def get_user_info(self, username):
        """Get user information"""
        try:
            user = self.reddit.redditor(username)
            return {
                'username': user.name,
                'created_utc': datetime.fromtimestamp(user.created_utc),
                'link_karma': user.link_karma,
                'comment_karma': user.comment_karma,
                'total_karma': user.link_karma + user.comment_karma,
                'is_gold': user.is_gold,
                'is_mod': user.is_mod,
                'has_verified_email': user.has_verified_email
            }
        except Exception as e:
            print(f"Error fetching user info for {username}: {e}")
            return None
    
    def collect_comprehensive_dataset(self, target_subreddits=None, search_queries=None,
                                     posts_per_subreddit=100, time_filter='week'):
        """Collect comprehensive dataset from multiple sources"""
        all_posts = []
        
        # 1. Get trending subreddits if not provided
        if target_subreddits is None:
            print("Fetching trending subreddits...")
            target_subreddits = self.get_trending_subreddits(limit=30)
            print(f"Found {len(target_subreddits)} trending subreddits")
        
        # 2. Collect posts from each subreddit (multiple sorting methods)
        for subreddit in target_subreddits:
            print(f"\nCollecting from r/{subreddit}...")
            
            # Get hot posts
            hot_posts = self.get_subreddit_posts(
                subreddit, 
                sort_by='hot', 
                limit=posts_per_subreddit//3
            )
            for post in hot_posts:
                post['source'] = f'{subreddit}:hot'
            all_posts.extend(hot_posts)
            
            time.sleep(1)
            
            # Get top posts
            top_posts = self.get_subreddit_posts(
                subreddit, 
                sort_by='top', 
                time_filter=time_filter,
                limit=posts_per_subreddit//3
            )
            for post in top_posts:
                post['source'] = f'{subreddit}:top'
            all_posts.extend(top_posts)
            
            time.sleep(1)
            
            # Get rising posts
            rising_posts = self.get_subreddit_posts(
                subreddit, 
                sort_by='rising', 
                limit=posts_per_subreddit//3
            )
            for post in rising_posts:
                post['source'] = f'{subreddit}:rising'
            all_posts.extend(rising_posts)
            
            print(f"  Collected {len(hot_posts) + len(top_posts) + len(rising_posts)} posts")
            time.sleep(2)  # Rate limiting
        
        # 3. Search for specific queries
        if search_queries:
            print("\nSearching for specific queries...")
            for query in search_queries:
                print(f"Searching: {query}")
                search_posts = self.search_posts(
                    query, 
                    time_filter=time_filter,
                    limit=100,
                    sort='top'
                )
                all_posts.extend(search_posts)
                print(f"  Found {len(search_posts)} posts")
                time.sleep(2)
        
        # 4. Create DataFrame and remove duplicates
        df = pd.DataFrame(all_posts)
        if not df.empty:
            df = df.drop_duplicates(subset=['post_id'], keep='first')
        
        print(f"\nTotal posts collected: {len(df)}")
        return df
    
    def enrich_with_comments(self, df, sample_size=50, comments_per_post=50):
        """Enrich dataset with comment data for top posts"""
        print(f"Enriching dataset with comments (sample size: {sample_size})...")
        
        # Sample top posts by engagement
        if len(df) > sample_size:
            sample_df = df.nlargest(sample_size, 'total_engagement')
        else:
            sample_df = df
        
        all_comments = []
        comment_stats = []
        
        for idx, row in sample_df.iterrows():
            try:
                comments = self.get_post_comments(row['post_id'], limit=comments_per_post)
                all_comments.extend(comments)
                
                if comments:
                    comment_stats.append({
                        'post_id': row['post_id'],
                        'actual_comment_count': len(comments),
                        'avg_comment_score': sum(c['score'] for c in comments) / len(comments),
                        'max_comment_depth': max(c['depth'] for c in comments),
                        'submitter_replies': sum(1 for c in comments if c['is_submitter'])
                    })
                
                time.sleep(1)
            except Exception as e:
                print(f"Error getting comments for post {row['post_id']}: {e}")
                continue
        
        # Merge comment stats
        if comment_stats:
            comment_df = pd.DataFrame(comment_stats)
            df = df.merge(comment_df, on='post_id', how='left')
        
        # Save comments separately
        if all_comments:
            comments_df = pd.DataFrame(all_comments)
            comments_df.to_csv('reddit_comments.csv', index=False)
            print(f"Saved {len(comments_df)} comments to reddit_comments.csv")
        
        return df
    
    def enrich_with_user_data(self, df, sample_size=100):
        """Enrich dataset with author information"""
        print(f"Enriching dataset with user data (sample size: {sample_size})...")
        
        # Get unique authors
        unique_authors = df['author'].unique()
        unique_authors = [a for a in unique_authors if a != '[deleted]']
        
        if len(unique_authors) > sample_size:
            # Sample from authors with most posts
            author_counts = df['author'].value_counts()
            unique_authors = author_counts.head(sample_size).index.tolist()
        
        user_data = []
        for author in unique_authors:
            user_info = self.get_user_info(author)
            if user_info:
                user_data.append(user_info)
            time.sleep(1)
        
        if user_data:
            user_df = pd.DataFrame(user_data)
            user_df.to_csv('reddit_users.csv', index=False)
            print(f"Saved {len(user_df)} user profiles to reddit_users.csv")
            
            # Merge with main dataframe
            df = df.merge(user_df, left_on='author', right_on='username', how='left')
        
        return df
    
    def save_dataset(self, df, filename='reddit_data.csv'):
        """Save dataset to CSV"""
        # Convert list columns to JSON strings
        if 'urls_in_text' in df.columns:
            df['urls_in_text'] = df['urls_in_text'].apply(json.dumps)
        
        df.to_csv(filename, index=False)
        print(f"Dataset saved to {filename}")
        return filename

# Example usage
if __name__ == "__main__":
    # Your Reddit API credentials
    REDDIT_CLIENT_ID = "JxbKwdWA6il4CmqD9TUL0w"
    REDDIT_CLIENT_SECRET = "V6e6lOPbKdHbqCQLew1NBtSI1O1ZfQ"
    REDDIT_USER_AGENT = "TrendAnalyzer/1.0"
    
    collector = RedditDataCollector(
        client_id=REDDIT_CLIENT_ID,
        client_secret=REDDIT_CLIENT_SECRET,
        user_agent=REDDIT_USER_AGENT
    )
    
    # Target subreddits (customize based on your interests)
    target_subreddits = [
    # ## General News & Discussion (Broad appeal, SFW)
    'worldnews',          # Global news, generally well-moderated.
    'UpliftingNews',      # Positive and inspiring news stories.
    'todayilearned',      # Interesting facts, consistently SFW and popular.
    'explainlikeimfive',  # Simple explanations of complex topics; great for text analysis.
    'NoStupidQuestions',  # A safer alternative to AskReddit for general queries.

    # ## Technology & Science (Future-focused and informative)
    'technology',         # General tech news and trends.
    'science',            # Broad scientific discussions and breakthroughs.
    'Futurology',         # Discussions about future technology and society.
    'gadgets',            # Consumer electronics and tech product trends.
    
    # ## Entertainment & Media (Pop culture pulse)
    'movies',             # Film discussion, trailers, and news.
    'television',         # TV show discussions, very active.
    'books',              # Literary trends and book discussions.
    'wholesomememes',     # A SFW alternative for tracking positive meme formats.
    
    # ## Hobbies & Lifestyle (Insight into daily life and interests)
    'LifeProTips',        # Popular "hacks" and advice for daily life.
    'personalfinance',    # Financial trends, saving, and investment discussions.
    'food',               # Popular recipes, food trends, and discussions.
    'travel',             # Travel destinations, tips, and trends.
    'mildlyinteresting'   # SFW curiosities that show what captures people's attention.
   ]
    
    # Search queries
    search_queries = [
        'artificial intelligence',
        'machine learning',
        'data science',
        'trending technology',
        'viral',
        'breaking news'
    ]
    
    # Collect comprehensive dataset
    df = collector.collect_comprehensive_dataset(
        target_subreddits=target_subreddits,
        search_queries=search_queries,
        posts_per_subreddit=100,
        time_filter='week'
    )
    
    # Enrich with comments
    df = collector.enrich_with_comments(df, sample_size=50, comments_per_post=50)
    
    # Enrich with user data
    df = collector.enrich_with_user_data(df, sample_size=100)
    
    # Save dataset
    collector.save_dataset(df, 'reddit_trending_data.csv')
    
    # Print summary statistics
    print("\n" + "="*60)
    print("REDDIT DATA COLLECTION SUMMARY")
    print("="*60)
    print(f"Total posts collected: {len(df)}")
    print(f"Date range: {df['created_utc'].min()} to {df['created_utc'].max()}")
    print(f"Unique subreddits: {df['subreddit'].nunique()}")
    print(f"Unique authors: {df['author'].nunique()}")
    print(f"Total score: {df['score'].sum()}")
    print(f"Total comments: {df['num_comments'].sum()}")
    print(f"Average upvote ratio: {df['upvote_ratio'].mean():.2f}")
    print(f"Posts with video: {df['is_video'].sum()}")
    print(f"Posts with awards: {(df['award_count'] > 0).sum()}")
    print(f"Average engagement: {df['total_engagement'].mean():.2f}")