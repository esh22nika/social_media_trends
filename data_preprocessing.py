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
        if pd.isna(text):
            return []
        return re.findall(r'#(\w+)', str(text))
    
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
    
    def extract_keywords(self, text, top_n=5):
        """Extract top keywords from text safely"""
        try:
            if not text or pd.isna(text):
                return []
            
            # Tokenize safely
            tokens = word_tokenize(str(text).lower())
            
            # Remove stopwords and short words
            keywords = [w for w in tokens if w not in self.stop_words and len(w) > 3 and w.isalpha()]
            
            if not keywords:
                return []
            
            # Get frequency safely
            freq = pd.Series(keywords).value_counts()
            return freq.head(top_n).index.tolist()
        
        except Exception as e:
            print(f"[Keyword Extraction Error] {e}")
            return []

    
    def analyze_sentiment(self, text):
        """Analyze sentiment safely using TextBlob"""
        if not text or pd.isna(text):
            return 'neutral', 0.0

        try:
            analysis = TextBlob(str(text))
            polarity = float(analysis.sentiment.polarity)
            if polarity > 0.1:
                sentiment = 'positive'
            elif polarity < -0.1:
                sentiment = 'negative'
            else:
                sentiment = 'neutral'
            return sentiment, polarity
        except Exception as e:
            print(f"[Sentiment Error] {e}")
            return 'neutral', 0.0

    
    def preprocess_reddit_data(self, df):
        """Preprocess Reddit data"""
        print("Preprocessing Reddit data...")
        
        # Combine title and selftext
        df['full_text'] = df['title'].fillna('') + ' ' + df['selftext'].fillna('')
        
        # Clean text
        df['cleaned_text'] = df['full_text'].apply(self.clean_text)
        
        # Extract hashtags (from URLs and text)
        df['hashtags'] = df['full_text'].apply(self.extract_hashtags)
        
        # Calculate engagement
        df['engagement_score'] = df.apply(lambda x: self.calculate_engagement(x, 'reddit'), axis=1)
        
        # Extract keywords
        df['keywords'] = df['cleaned_text'].apply(lambda x: self.extract_keywords(x, 5))
        
        # Sentiment analysis
        sentiments = df['cleaned_text'].apply(self.analyze_sentiment)
        df['sentiment'] = sentiments.apply(lambda x: x[0])
        df['sentiment_score'] = sentiments.apply(lambda x: x[1])
        
        # Convert timestamps
        if 'created_utc' in df.columns:
            df['created_utc'] = pd.to_datetime(df['created_utc'])
        
        # Normalize data
        df['normalized_engagement'] = self.normalize_scores(df['engagement_score'])
        
        return df
    
    def preprocess_youtube_data(self, df):
        """Preprocess YouTube data"""
        print("Preprocessing YouTube data...")
        
        # Combine title and description
        df['full_text'] = df['title'].fillna('') + ' ' + df['description'].fillna('')
        
        # Clean text
        df['cleaned_text'] = df['full_text'].apply(self.clean_text)
        
        # Parse tags
        if 'tags' in df.columns:
            df['tags'] = df['tags'].apply(lambda x: eval(x) if isinstance(x, str) and x.startswith('[') else [])
        
        # Calculate engagement
        df['engagement_score'] = df.apply(lambda x: self.calculate_engagement(x, 'youtube'), axis=1)
        
        # Extract keywords
        df['keywords'] = df['cleaned_text'].apply(lambda x: self.extract_keywords(x, 5))
        
        # Sentiment analysis
        sentiments = df['cleaned_text'].apply(self.analyze_sentiment)
        df['sentiment'] = sentiments.apply(lambda x: x[0])
        df['sentiment_score'] = sentiments.apply(lambda x: x[1])
        
        # Convert timestamps
        if 'published_at' in df.columns:
            df['published_at'] = pd.to_datetime(df['published_at'])
        
        # Normalize data
        df['normalized_engagement'] = self.normalize_scores(df['engagement_score'])
        
        return df
    
    def preprocess_bluesky_data(self, df):
        """Preprocess Bluesky data"""
        print("Preprocessing Bluesky data...")
        
        # Clean text
        df['cleaned_text'] = df['text'].fillna('').apply(self.clean_text)
        
        # Parse hashtags if stored as JSON string
        if 'hashtags' in df.columns:
            df['hashtags'] = df['hashtags'].apply(
                lambda x: json.loads(x) if isinstance(x, str) and x.startswith('[') else []
            )
        
        # Calculate engagement
        df['engagement_score'] = df.apply(lambda x: self.calculate_engagement(x, 'bluesky'), axis=1)
        
        # Extract keywords
        df['keywords'] = df['cleaned_text'].apply(lambda x: self.extract_keywords(x, 5))
        
        # Sentiment analysis
        sentiments = df['cleaned_text'].apply(self.analyze_sentiment)
        df['sentiment'] = sentiments.apply(lambda x: x[0])
        df['sentiment_score'] = sentiments.apply(lambda x: x[1])
        
        # Convert timestamps
        if 'created_at' in df.columns:
            df['created_at'] = pd.to_datetime(df['created_at'])
        
        # Normalize data
        df['normalized_engagement'] = self.normalize_scores(df['engagement_score'])
        
        return df
    
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
