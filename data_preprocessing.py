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
        if pd.isna(text) or text == '': return ''
        text = str(text)
        text = re.sub(r'http\S+|www.\S+', '', text)
        text = re.sub(r'[@#]', '', text)
        text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
        text = ' '.join(text.split())
        return text.lower()
    
    def extract_hashtags(self, text):
        if pd.isna(text) or text == '': return []
        return list(set(re.findall(r'#(\w+)', str(text))))
    
    def extract_keywords(self, text, max_keywords=10):
        if pd.isna(text) or text == '': return []
        words = re.findall(r'\b[a-zA-Z]{4,}\b', str(text).lower())
        common_words = {'that', 'this', 'with', 'from', 'have', 'will', 'your', 'more', 'about', 'been', 'their', 'what', 'when', 'where', 'which', 'would'}
        keywords = [w for w in words if w not in self.stop_words and w not in common_words]
        from collections import Counter
        return [word for word, _ in Counter(keywords).most_common(max_keywords)]
    
    def analyze_sentiment(self, text):
        if pd.isna(text) or text == '': return 'neutral'
        try:
            polarity = TextBlob(str(text)).sentiment.polarity
            if polarity > 0.1: return 'positive'
            elif polarity < -0.1: return 'negative'
            else: return 'neutral'
        except:
            return 'neutral'

    def preprocess_reddit(self, df):
        """FIXED: Preprocess Reddit with correct field mapping"""
        if df is None or df.empty: return pd.DataFrame()
        print(f"Preprocessing {len(df)} Reddit posts...")
        
        unified = pd.DataFrame()
        unified['id'] = df['post_id'].astype(str)
        unified['title'] = df['title'].fillna('')
        unified['text'] = df['selftext'].fillna('')
        unified['author'] = df['author'].fillna('unknown')
        
        # FIXED: Use created_utc_x, not created_at
        unified['created_at'] = pd.to_datetime(df['created_utc_x'], errors='coerce')
        unified['created_at'] = unified['created_at'].fillna(pd.Timestamp.now())
        
        # FIXED: Get metrics properly
        unified['like_count'] = pd.to_numeric(df['score'], errors='coerce').fillna(0).astype(int)
        unified['num_comments'] = pd.to_numeric(df['num_comments'], errors='coerce').fillna(0).astype(int)
        unified['score'] = unified['like_count']  # For compatibility
        
        unified['engagement_score'] = unified['like_count'] + (unified['num_comments'] * 2)
        unified['platform'] = 'reddit'
        unified['url'] = 'https://reddit.com' + df['permalink'].fillna('')
        unified['keywords'] = unified.apply(lambda row: self.extract_keywords(row['title'] + ' ' + row['text']), axis=1)
        unified['hashtags'] = unified['text'].apply(self.extract_hashtags)
        unified['sentiment'] = (unified['title'] + ' ' + unified['text']).apply(self.analyze_sentiment)
        
        if unified['engagement_score'].max() > 0:
            unified['normalized_engagement'] = (unified['engagement_score'] / unified['engagement_score'].max()) * 100
        else:
            unified['normalized_engagement'] = 0
            
        print(f"  ✓ Processed {len(unified)} Reddit posts (max likes: {unified['like_count'].max()})")
        return unified

    def preprocess_reddit_data(self, df):
        """Backward compatible wrapper"""
        return self.preprocess_reddit(df)
    
    def preprocess_youtube(self, df):
        """FIXED: Preprocess YouTube with correct field mapping"""
        if df is None or df.empty: return pd.DataFrame()
        print(f"Preprocessing {len(df)} YouTube videos...")
        
        unified = pd.DataFrame()
        unified['id'] = df['video_id'].astype(str)
        unified['title'] = df['title'].fillna('')
        unified['text'] = df['description'].fillna('')
        unified['author'] = df['channel_title'].fillna('unknown')
        
        # FIXED: Use published_at, not created_at
        unified['created_at'] = pd.to_datetime(df['published_at'], errors='coerce')
        unified['created_at'] = unified['created_at'].fillna(pd.Timestamp.now())
        
        # FIXED: Get metrics properly
        unified['like_count'] = pd.to_numeric(df['like_count'], errors='coerce').fillna(0).astype(int)
        unified['comment_count'] = pd.to_numeric(df['comment_count'], errors='coerce').fillna(0).astype(int)
        unified['view_count'] = pd.to_numeric(df['view_count'], errors='coerce').fillna(0).astype(int)
        unified['num_comments'] = unified['comment_count']  # Alias for compatibility
        unified['repost_count'] = 0  # YouTube doesn't have this
        
        unified['engagement_score'] = (
            unified['like_count'] * 2 + 
            unified['comment_count'] * 3 + 
            (unified['view_count'] * 0.01)
        )
        
        unified['platform'] = 'youtube'
        unified['url'] = 'https://youtube.com/watch?v=' + df['video_id'].fillna('')
        
        # Parse tags
        def parse_tags(tags_str):
            if pd.isna(tags_str) or tags_str == '': return []
            try:
                if isinstance(tags_str, str):
                    if tags_str.startswith('['):
                        return eval(tags_str)
                    return [t.strip().strip("'\"") for t in tags_str.split(',') if t.strip()]
                return []
            except:
                return []
        
        unified['keywords'] = df['tags'].apply(parse_tags)
        unified['hashtags'] = unified['text'].apply(self.extract_hashtags)
        unified['sentiment'] = unified['text'].apply(self.analyze_sentiment)
        
        if unified['engagement_score'].max() > 0:
            unified['normalized_engagement'] = (unified['engagement_score'] / unified['engagement_score'].max()) * 100
        else:
            unified['normalized_engagement'] = 0
        
        unified['trend_status'] = unified['normalized_engagement'].apply(
            lambda x: 'rising' if x > 70 else ('stable' if x > 40 else 'falling')
        )
        
        print(f"  ✓ Processed {len(unified)} YouTube videos (max likes: {unified['like_count'].max()})")
        return unified

    def preprocess_youtube_data(self, df):
        """Backward compatible wrapper"""
        return self.preprocess_youtube(df)
    
    def preprocess_bluesky(self, df):
        """FIXED: Preprocess Bluesky with correct field mapping"""
        if df is None or df.empty: return pd.DataFrame()
        print(f"Preprocessing {len(df)} Bluesky posts...")
        
        unified = pd.DataFrame()
        unified['id'] = df['uri'].astype(str)
        unified['title'] = df['text'].fillna('').str[:100]
        unified['text'] = df['text'].fillna('')
        unified['author'] = df['author_handle'].fillna('unknown')
        
        # FIXED: Handle NaN created_at
        unified['created_at'] = pd.to_datetime(df['created_at'], errors='coerce')
        unified['created_at'] = unified['created_at'].fillna(pd.Timestamp.now())
        
        # FIXED: Get metrics properly
        unified['like_count'] = pd.to_numeric(df['like_count'], errors='coerce').fillna(0).astype(int)
        unified['reply_count'] = pd.to_numeric(df['reply_count'], errors='coerce').fillna(0).astype(int)
        unified['repost_count'] = pd.to_numeric(df['repost_count'], errors='coerce').fillna(0).astype(int)
        unified['num_comments'] = unified['reply_count']  # Alias for compatibility
        
        unified['engagement_score'] = (
            unified['like_count'] + 
            (unified['reply_count'] * 2) + 
            (unified['repost_count'] * 1.5)
        )
        
        unified['platform'] = 'bluesky'
        unified['url'] = df['uri'].fillna('')
        
        # Parse hashtags
        def parse_list_str(list_str):
            if pd.isna(list_str) or list_str == '' or list_str == '[]': return []
            try:
                if isinstance(list_str, str):
                    return eval(list_str)
                return []
            except:
                return []
        
        unified['hashtags'] = df['hashtags'].apply(parse_list_str)
        unified['keywords'] = unified['text'].apply(self.extract_keywords)
        unified['sentiment'] = unified['text'].apply(self.analyze_sentiment)
        
        if unified['engagement_score'].max() > 0:
            unified['normalized_engagement'] = (unified['engagement_score'] / unified['engagement_score'].max()) * 100
        else:
            unified['normalized_engagement'] = 0
        
        unified['trend_status'] = unified['normalized_engagement'].apply(
            lambda x: 'rising' if x > 70 else ('stable' if x > 40 else 'falling')
        )
        
        print(f"  ✓ Processed {len(unified)} Bluesky posts (max likes: {unified['like_count'].max()})")
        return unified

    def preprocess_bluesky_data(self, df):
        """Backward compatible wrapper"""
        return self.preprocess_bluesky(df)
    
    def normalize_scores(self, series):
        """Normalize scores to 0-100 range"""
        if series.max() == series.min():
            return pd.Series([50] * len(series))
        return ((series - series.min()) / (series.max() - series.min()) * 100).fillna(0)
    
    def create_unified_dataset(self, reddit_df=None, youtube_df=None, bluesky_df=None):
        """FIXED: Create unified dataset - just concatenate processed DataFrames"""
        print("\n" + "="*60)
        print("CREATING UNIFIED DATASET")
        print("="*60)
        
        all_data = []
        
        # Process each platform
        if reddit_df is not None and not reddit_df.empty:
            reddit_processed = self.preprocess_reddit(reddit_df)
            all_data.append(reddit_processed)
        else:
            print("⚠️  No Reddit data available")
        
        if youtube_df is not None and not youtube_df.empty:
            youtube_processed = self.preprocess_youtube(youtube_df)
            all_data.append(youtube_processed)
        else:
            print("⚠️  No YouTube data available")
        
        if bluesky_df is not None and not bluesky_df.empty:
            bluesky_processed = self.preprocess_bluesky(bluesky_df)
            all_data.append(bluesky_processed)
        else:
            print("⚠️  No Bluesky data available")
        
        if not all_data:
            print("❌ FATAL: No data from any platform!")
            return pd.DataFrame()
        
        # FIXED: Just concatenate the DataFrames directly
        unified_df = pd.concat(all_data, ignore_index=True)
        
        # Sort by engagement
        unified_df = unified_df.sort_values('engagement_score', ascending=False)
        
        # Add trend indicators
        unified_df['trend_status'] = unified_df['normalized_engagement'].apply(
            lambda x: 'rising' if x > 70 else 'stable' if x > 40 else 'falling'
        )
        
        print(f"\n✅ UNIFIED DATASET CREATED: {len(unified_df)} total records")
        print(f"   - Reddit: {len(unified_df[unified_df['platform']=='reddit'])}")
        print(f"   - YouTube: {len(unified_df[unified_df['platform']=='youtube'])}")
        print(f"   - Bluesky: {len(unified_df[unified_df['platform']=='bluesky'])}")
        print(f"   - Total likes: {unified_df['like_count'].sum():,}")
        print(f"   - Max likes: {unified_df['like_count'].max():,}")
        print("="*60 + "\n")
        
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
        
        # Show sample
        print("\nSample of processed data:")
        print(unified_df[['id', 'platform', 'title', 'like_count', 'num_comments', 'engagement_score']].head(10))
    else:
        print("⚠️  No unified data to save.")