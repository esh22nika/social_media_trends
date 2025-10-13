import os
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import time

class YouTubeTrendAnalyzer:
    def __init__(self, api_key):
        self.api_key = api_key
        self.youtube = build('youtube', 'v3', developerKey=api_key)
        
    def fetch_trending_videos(self, region_code='US', max_results=50):
        """Fetch trending videos from YouTube"""
        try:
            request = self.youtube.videos().list(
                part='snippet,statistics,contentDetails',
                chart='mostPopular',
                regionCode=region_code,
                maxResults=max_results
            )
            response = request.execute()
            return response['items']
        except HttpError as e:
            print(f"Error fetching trending videos: {e}")
            return []
    
    def fetch_video_comments(self, video_id, max_results=100):
        """Fetch comments for a specific video"""
        comments = []
        try:
            request = self.youtube.commentThreads().list(
                part='snippet',
                videoId=video_id,
                maxResults=max_results,
                textFormat='plainText'
            )
            response = request.execute()
            
            for item in response['items']:
                comment = item['snippet']['topLevelComment']['snippet']
                comments.append({
                    'comment_id': item['id'],
                    'author': comment['authorDisplayName'],
                    'text': comment['textDisplay'],
                    'likes': comment['likeCount'],
                    'published_at': comment['publishedAt']
                })
        except HttpError as e:
            print(f"Error fetching comments for video {video_id}: {e}")
        
        return comments
    
    def search_videos_by_keyword(self, keyword, max_results=50, order='relevance'):
        """Search videos by keyword"""
        try:
            request = self.youtube.search().list(
                part='snippet',
                q=keyword,
                type='video',
                maxResults=max_results,
                order=order  # relevance, date, rating, viewCount
            )
            response = request.execute()
            
            video_ids = [item['id']['videoId'] for item in response['items']]
            return self.fetch_video_details(video_ids)
        except HttpError as e:
            print(f"Error searching videos: {e}")
            return []
    
    def fetch_video_details(self, video_ids):
        """Fetch detailed information for multiple videos"""
        try:
            request = self.youtube.videos().list(
                part='snippet,statistics,contentDetails',
                id=','.join(video_ids)
            )
            response = request.execute()
            return response['items']
        except HttpError as e:
            print(f"Error fetching video details: {e}")
            return []
    
    def fetch_channel_info(self, channel_id):
        """Fetch channel information"""
        try:
            request = self.youtube.channels().list(
                part='snippet,statistics',
                id=channel_id
            )
            response = request.execute()
            return response['items'][0] if response['items'] else None
        except HttpError as e:
            print(f"Error fetching channel info: {e}")
            return None
    
    def parse_video_data(self, video_items):
        """Parse video data into structured format"""
        videos_data = []
        
        for item in video_items:
            snippet = item['snippet']
            statistics = item.get('statistics', {})
            content_details = item.get('contentDetails', {})
            
            video_data = {
                'video_id': item['id'],
                'title': snippet['title'],
                'description': snippet['description'],
                'channel_id': snippet['channelId'],
                'channel_title': snippet['channelTitle'],
                'published_at': snippet['publishedAt'],
                'tags': snippet.get('tags', []),
                'category_id': snippet.get('categoryId', ''),
                'view_count': int(statistics.get('viewCount', 0)),
                'like_count': int(statistics.get('likeCount', 0)),
                'comment_count': int(statistics.get('commentCount', 0)),
                'duration': content_details.get('duration', ''),
                'thumbnail': snippet['thumbnails']['high']['url']
            }
            videos_data.append(video_data)
        
        return pd.DataFrame(videos_data)
    
    def collect_comprehensive_dataset(self, keywords, region_codes=['US', 'IN', 'GB']):
        """Collect comprehensive dataset from multiple sources"""
        all_videos = []
        
        # 1. Fetch trending videos from multiple regions
        print("Fetching trending videos...")
        for region in region_codes:
            trending = self.fetch_trending_videos(region_code=region, max_results=50)
            all_videos.extend(trending)
            time.sleep(1)  # Rate limiting
        
        # 2. Search for videos by keywords
        print("Searching videos by keywords...")
        for keyword in keywords:
            search_results = self.search_videos_by_keyword(keyword, max_results=50)
            all_videos.extend(search_results)
            time.sleep(1)
        
        # Remove duplicates
        unique_videos = {v['id']: v for v in all_videos}.values()
        
        # Parse into DataFrame
        df = self.parse_video_data(list(unique_videos))
        
        return df
    
    def save_dataset(self, df, filename='youtube_data.csv'):
        """Save dataset to CSV"""
        df.to_csv(filename, index=False)
        print(f"Dataset saved to {filename}")
        return filename

# Example usage
if __name__ == "__main__":
    API_KEY = "AIzaSyCQoWDTrre_kL255YDEVN0SmCiyqJbf9mY"
    
    analyzer = YouTubeTrendAnalyzer(API_KEY)
    
    # Define keywords for your domain (adjust as needed)
    keywords = [
        'artificial intelligence', 'machine learning', 'data science',
        'technology trends', 'programming', 'web development',
        'gaming', 'entertainment', 'music', 'education'
    ]
    
    # Collect data
    print("Starting data collection...")
    df = analyzer.collect_comprehensive_dataset(keywords, region_codes=['US', 'IN'])
    
    # Save dataset
    analyzer.save_dataset(df, 'youtube_trending_data.csv')
    
    print(f"\nCollected {len(df)} videos")
    print(f"Date range: {df['published_at'].min()} to {df['published_at'].max()}")
    print(f"\nSample data:")
    print(df.head())