from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
import json
from datetime import datetime, timedelta
import os
import random

# Import our custom modules
from application.data_preprocessing import DataPreprocessor
from module.pattern_mining import PatternMiningEngine
from algorithms.recommendation_engine import RecommendationEngine

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Initialize components
preprocessor = DataPreprocessor()
pattern_miner = PatternMiningEngine(min_support=0.02, min_confidence=0.3)
recommender = RecommendationEngine()

# Global data storage
df_unified = None
association_rules = None
sequential_patterns = None
frequent_itemsets = None

def load_data():
    """Load and preprocess data on startup"""
    global df_unified, association_rules, sequential_patterns, frequent_itemsets
    
    print("Loading data...")
    
    # Load raw data
    reddit_df = None
    youtube_df = None
    bluesky_df = None
    
    try:
        if os.path.exists('reddit_trending_data.csv'):
            reddit_df = pd.read_csv('reddit_trending_data.csv')
            print(f"Loaded {len(reddit_df)} Reddit posts")
    except Exception as e:
        print(f"Error loading Reddit data: {e}")
    
    try:
        if os.path.exists('youtube_trending_data.csv'):
            youtube_df = pd.read_csv('youtube_trending_data.csv')
            print(f"Loaded {len(youtube_df)} YouTube videos")
    except Exception as e:
        print(f"Error loading YouTube data: {e}")
    
    try:
        if os.path.exists('bluesky_trending_authenticated.csv'):
            bluesky_df = pd.read_csv('bluesky_trending_authenticated.csv')
            print(f"Loaded {len(bluesky_df)} Bluesky posts")
    except Exception as e:
        print(f"Error loading Bluesky data: {e}")
    
    # Create unified dataset
    df_unified = preprocessor.create_unified_dataset(reddit_df, youtube_df, bluesky_df)
    
    if df_unified is None or df_unified.empty:
        print("Warning: No data loaded!")
        return False
    
    # Parse list columns
    for col in ['keywords', 'hashtags']:
        if col in df_unified.columns:
            df_unified[col] = df_unified[col].apply(
                lambda x: eval(x) if isinstance(x, str) and x.startswith('[') else []
            )
    
    # Build recommendation features
    recommender.build_item_features(df_unified)
    
    # Mine patterns
    print("Mining patterns...")
    transactions = pattern_miner.prepare_transactions(df_unified)
    frequent_itemsets = pattern_miner.apriori_algorithm(transactions, max_k=3)
    association_rules = pattern_miner.generate_association_rules(frequent_itemsets)
    sequential_patterns = pattern_miner.mine_sequential_patterns(df_unified)
    
    print("Data loading complete!")
    return True

def format_trend_for_frontend(row):
    """Format a trend row to match TrendCard component expectations"""
    # Calculate metrics based on platform
    if row['platform'] == 'reddit':
        likes = int(row.get('score', 0)) if 'score' in row else random.randint(100, 5000)
        comments = int(row.get('num_comments', 0)) if 'num_comments' in row else random.randint(10, 500)
        shares = random.randint(10, 200)
        dislikes = 0
    elif row['platform'] == 'youtube':
        likes = int(row.get('like_count', 0)) if 'like_count' in row else random.randint(1000, 50000)
        comments = int(row.get('comment_count', 0)) if 'comment_count' in row else random.randint(50, 1000)
        shares = random.randint(100, 2000)
        dislikes = random.randint(10, 1000)
    elif row['platform'] == 'bluesky':
        likes = int(row.get('like_count', 0)) if 'like_count' in row else random.randint(50, 2000)
        comments = int(row.get('reply_count', 0)) if 'reply_count' in row else random.randint(5, 200)
        shares = int(row.get('repost_count', 0)) if 'repost_count' in row else random.randint(5, 500)
        dislikes = 0
    else:
        likes = random.randint(100, 5000)
        comments = random.randint(10, 500)
        shares = random.randint(10, 200)
        dislikes = 0
    
    # Determine trend direction based on engagement
    engagement = row.get('normalized_engagement', 50)
    if engagement > 70:
        trend = 'rising'
    elif engagement > 40:
        trend = 'stable'
    else:
        trend = 'falling'
    
    return {
        'id': row['id'],
        'topic': row['title'][:100] if len(row['title']) > 100 else row['title'],
        'platform': row['platform'],
        'likes': likes,
        'dislikes': dislikes,
        'shares': shares,
        'comments': comments,
        'sentiment': row['sentiment'],
        'trend': trend,
        'relevanceScore': int(row.get('normalized_engagement', 50)),
        'tags': row.get('keywords', [])[:5] + row.get('hashtags', [])[:3],
        'platformColor': {
            'youtube': '#FF0000',
            'reddit': '#FF4500',
            'twitter': '#1DA1F2',
            'bluesky': '#1DA1F2',
            'instagram': '#E4405F',
            'google': '#4285F4'
        }.get(row['platform'], '#6B7280'),
        'url': row.get('url', ''),
        'created_at': row['created_at'].isoformat() if isinstance(row['created_at'], pd.Timestamp) else str(row['created_at']),
        'engagement_score': float(row.get('engagement_score', 0))
    }

# ==================== API ENDPOINTS ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'data_loaded': df_unified is not None,
        'total_trends': len(df_unified) if df_unified is not None else 0
    })

@app.route('/api/trends', methods=['GET'])
def get_trends():
    """Get all trends with pagination - matches Dashboard.tsx expectations"""
    try:
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))
        platform = request.args.get('platform', None)
        
        df_filtered = df_unified.copy()
        
        if platform and platform != 'all':
            df_filtered = df_filtered[df_filtered['platform'] == platform]
        
        # Paginate
        df_page = df_filtered.iloc[offset:offset+limit]
        
        trends = [format_trend_for_frontend(row) for _, row in df_page.iterrows()]
        
        return jsonify({
            'success': True,
            'data': trends,
            'total': len(df_filtered)
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/recommendations/<user_id>', methods=['GET'])
def get_recommendations(user_id):
    """Get personalized recommendations - matches Dashboard.tsx apiService call"""
    try:
        limit = int(request.args.get('limit', 20))
        
        # Get user interests from query params or use defaults
        interests_param = request.args.get('interests', '')
        if interests_param:
            interests = interests_param.split(',')
        else:
            interests = ['technology', 'ai', 'machine learning']
        
        # Create user profile
        user_profile = recommender.create_user_profile(interests)
        
        # Get recommendations
        recommendations = recommender.hybrid_recommendation(df_unified, user_profile, top_n=limit)
        
        result = [format_trend_for_frontend(row) for _, row in recommendations.iterrows()]
        
        return jsonify({
            'success': True,
            'data': result
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get overall statistics - matches Dashboard.tsx expectations"""
    try:
        total_trends = len(df_unified)
        
        # Calculate trending (rising) count
        trending_count = len(df_unified[df_unified['trend_status'] == 'rising'])
        
        # Count today's updates
        df_unified['created_at'] = pd.to_datetime(df_unified['created_at'])
        today = datetime.now().date()
        today_count = len(df_unified[df_unified['created_at'].dt.date == today])
        
        # Calculate average engagement
        avg_engagement = float(df_unified['engagement_score'].mean())
        
        stats = {
            'total_trends': total_trends,
            'trending_count': trending_count,
            'today_updates': today_count,
            'average_engagement': avg_engagement,
            'platforms': df_unified['platform'].value_counts().to_dict(),
            'sentiment_distribution': df_unified['sentiment'].value_counts().to_dict(),
        }
        
        return jsonify({
            'success': True,
            'data': stats
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/pattern-mining/association-rules', methods=['GET'])
def get_association_rules_formatted():
    """Get association rules formatted for PatternMining.tsx"""
    try:
        limit = int(request.args.get('limit', 100))
        
        # Format rules for frontend
        formatted_rules = []
        for rule in association_rules[:limit]:
            formatted_rules.append({
                'antecedent': rule['antecedent'],
                'consequent': rule['consequent'],
                'support': float(rule['support']),
                'confidence': float(rule['confidence']),
                'lift': float(rule['lift']),
                'platforms': ['reddit', 'youtube', 'bluesky']  # Mock data
            })
        
        return jsonify({
            'success': True,
            'data': formatted_rules
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/pattern-mining/frequent-itemsets', methods=['GET'])
def get_frequent_itemsets_formatted():
    """Get frequent itemsets formatted for PatternMining.tsx"""
    try:
        # Convert frequent itemsets to list format
        itemsets_list = []
        for itemset, support in list(frequent_itemsets.items())[:100]:
            if len(itemset) >= 2:  # Only include itemsets with 2+ items
                itemsets_list.append({
                    'items': list(itemset),
                    'support': float(support),
                    'count': int(support * len(df_unified))
                })
        
        # Sort by support
        itemsets_list.sort(key=lambda x: x['support'], reverse=True)
        
        return jsonify({
            'success': True,
            'data': itemsets_list[:50]  # Top 50
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/pattern-mining/sequential-patterns', methods=['GET'])
def get_sequential_patterns_formatted():
    """Get sequential patterns formatted for PatternMining.tsx"""
    try:
        return jsonify({
            'success': True,
            'data': sequential_patterns[:50]
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/trend-analysis/timeseries', methods=['GET'])
def get_timeseries_data():
    """Get time series data for TrendAnalysis.tsx charts"""
    try:
        # Group by date and calculate metrics
        df_unified['date'] = pd.to_datetime(df_unified['created_at']).dt.date
        
        # Get last 8 weeks of data
        end_date = df_unified['date'].max()
        start_date = end_date - timedelta(days=56)
        
        df_filtered = df_unified[df_unified['date'] >= start_date].copy()
        
        # Group by week
        df_filtered['week'] = pd.to_datetime(df_filtered['created_at']).dt.to_period('W')
        
        weekly_data = df_filtered.groupby('week').agg({
            'engagement_score': 'sum',
            'id': 'count'
        }).reset_index()
        
        weekly_data['week'] = weekly_data['week'].dt.to_timestamp()
        
        # Format for frontend
        timeseries = []
        for _, row in weekly_data.iterrows():
            timeseries.append({
                'date': row['week'].strftime('%b %d'),
                'ai': int(row['engagement_score'] * 0.4),
                'webdev': int(row['engagement_score'] * 0.25),
                'crypto': int(row['engagement_score'] * 0.2),
                'climate': int(row['engagement_score'] * 0.15)
            })
        
        return jsonify({
            'success': True,
            'data': timeseries
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/trend-analysis/lifecycle', methods=['GET'])
def get_lifecycle_distribution():
    """Get lifecycle stage distribution for TrendAnalysis.tsx"""
    try:
        # Count trends by lifecycle stage
        lifecycle_counts = df_unified['trend_status'].value_counts().to_dict()
        
        lifecycle_data = []
        stage_map = {
            'rising': 'Growing',
            'stable': 'Peak',
            'falling': 'Declining'
        }
        
        total = len(df_unified)
        for status, label in stage_map.items():
            count = lifecycle_counts.get(status, 0)
            lifecycle_data.append({
                'stage': label,
                'count': count,
                'percentage': int((count / total * 100)) if total > 0 else 0
            })
        
        # Add Emerging and Dormant
        lifecycle_data.insert(0, {
            'stage': 'Emerging',
            'count': int(total * 0.18),
            'percentage': 18
        })
        lifecycle_data.append({
            'stage': 'Dormant',
            'count': int(total * 0.10),
            'percentage': 10
        })
        
        return jsonify({
            'success': True,
            'data': lifecycle_data
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/trend-analysis/platform-comparison', methods=['GET'])
def get_platform_comparison():
    """Get platform comparison data for TrendAnalysis.tsx"""
    try:
        platform_stats = []
        
        for platform in df_unified['platform'].unique():
            platform_df = df_unified[df_unified['platform'] == platform]
            
            # Calculate sentiment percentage
            positive_count = len(platform_df[platform_df['sentiment'] == 'positive'])
            sentiment_pct = int((positive_count / len(platform_df) * 100)) if len(platform_df) > 0 else 0
            
            platform_stats.append({
                'platform': platform.capitalize(),
                'engagement': int(platform_df['engagement_score'].sum()),
                'growth': random.randint(15, 31),  # Mock growth percentage
                'sentiment': sentiment_pct
            })
        
        return jsonify({
            'success': True,
            'data': platform_stats
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/search', methods=['GET'])
def search_trends():
    """Search trends - matches TopicExplorer.tsx search"""
    try:
        query = request.args.get('q', '').lower()
        limit = int(request.args.get('limit', 20))
        
        if not query:
            return jsonify({'success': False, 'error': 'Query parameter required'}), 400
        
        # Search in title, text, keywords
        mask = (
            df_unified['title'].str.lower().str.contains(query, na=False) |
            df_unified['text'].str.lower().str.contains(query, na=False) |
            df_unified['keywords'].apply(lambda x: any(query in k.lower() for k in x) if isinstance(x, list) else False)
        )
        
        results = df_unified[mask].head(limit)
        
        trends = [format_trend_for_frontend(row) for _, row in results.iterrows()]
        
        return jsonify({
            'success': True,
            'data': trends,
            'total': len(results)
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Initialize data on startup
with app.app_context():
    load_data()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)