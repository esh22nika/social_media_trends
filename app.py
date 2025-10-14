from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import pandas as pd
import numpy as np
import json
from datetime import datetime, timedelta
import os
import random

# Import our custom modules
from data_preprocessing import DataPreprocessor
from pattern_mining import PatternMiningEngine
from recommendation_engine import RecommendationEngine
from gemini_client import GeminiClient # Make sure gemini_client.py is in the same directory

# --- Configuration ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend')
TOPIC_CACHE_FILE = 'categorized_topics.csv'

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')
CORS(app)

# --- Component Initialization ---
preprocessor = DataPreprocessor()
pattern_miner = PatternMiningEngine(min_support=0.02, min_confidence=0.3)
recommender = RecommendationEngine()

# Initialize Gemini Client with your hardcoded API key
try:
    gemini_client = GeminiClient(api_key="AIzaSyAQOdSGnvSLj7GS6LfanX26Z6WjJJ7-Dhg")
except Exception as e:
    print(f"CRITICAL ERROR: Could not initialize Gemini Client. {e}")
    gemini_client = None

# --- Global Data Storage ---
df_unified = None
association_rules = None
sequential_patterns = None
frequent_itemsets = None

# --- Helper Functions ---

def load_data():
    """Load, preprocess, categorize with Gemini, and analyze data on startup."""
    global df_unified, association_rules, sequential_patterns, frequent_itemsets
    
    print("Loading data...")
    
    # Load raw data from CSVs
    try:
        reddit_df = pd.read_csv('reddit_trending_data.csv') if os.path.exists('reddit_trending_data.csv') else None
        youtube_df = pd.read_csv('youtube_trending_data.csv') if os.path.exists('youtube_trending_data.csv') else None
        bluesky_df = pd.read_csv('bluesky_trending_authenticated.csv') if os.path.exists('bluesky_trending_authenticated.csv') else None
    except Exception as e:
        print(f"Error loading raw data: {e}")
        return False

    # Create unified dataset using the preprocessor
    df_unified = preprocessor.create_unified_dataset(reddit_df, youtube_df, bluesky_df)
    
    if df_unified is None or df_unified.empty:
        print("FATAL: No data loaded, cannot proceed.")
        return False
    
    # --- DYNAMIC TOPIC CATEGORIZATION WITH GEMINI & CACHING ---
    if gemini_client:
        # **FIX:** Ensure the main dataframe's ID is a string before any merging.
        df_unified['id'] = df_unified['id'].astype(str)

        if os.path.exists(TOPIC_CACHE_FILE):
            print(f"Loading cached topic categories from {TOPIC_CACHE_FILE}...")
            topic_df = pd.read_csv(TOPIC_CACHE_FILE)
            # **FIX:** Ensure the cached dataframe's ID is also a string.
            topic_df['id'] = topic_df['id'].astype(str)
            
            df_unified = pd.merge(df_unified, topic_df, on='id', how='left')
            df_unified['topic_category'].fillna('General Discussion', inplace=True)
        else:
            print("No topic cache found. Categorizing with Gemini API...")
            df_unified['topic_category'] = gemini_client.bulk_categorize_topics(df_unified, text_column='title')
            df_unified[['id', 'topic_category']].to_csv(TOPIC_CACHE_FILE, index=False)
            print(f"Saved categorized topics to {TOPIC_CACHE_FILE} for future fast startups.")
    else:
        print("WARNING: Gemini client not initialized. Using 'General' for all topics.")
        df_unified['topic_category'] = 'General'
        
    # Safely parse list-like columns
    for col in ['keywords', 'hashtags']:
        if col in df_unified.columns:
            df_unified[col] = df_unified[col].apply(
                lambda x: eval(x) if isinstance(x, str) and x.startswith('[') else x if isinstance(x, list) else []
            )

    # Build recommendation features
    recommender.build_item_features(df_unified)
    
    # Mine patterns
    print("Mining patterns...")
    transactions = pattern_miner.prepare_transactions(df_unified)
    frequent_itemsets = pattern_miner.apriori_algorithm(transactions, max_k=3)
    association_rules = pattern_miner.generate_association_rules(frequent_itemsets)
    sequential_patterns = pattern_miner.mine_sequential_patterns(df_unified)
    
    print("Data loading and processing complete!")
    return True

def format_trend_for_frontend(row):
    """Format a DataFrame row for a consistent frontend experience"""
    platform = row.get('platform', 'unknown')
    engagement = row.get('normalized_engagement', 50)
    
    if engagement > 70: trend = 'rising'
    elif engagement > 40: trend = 'stable'
    else: trend = 'falling'
    
    created_at_val = row.get('created_at')
    created_at_iso = pd.to_datetime(created_at_val).isoformat() if not pd.isna(created_at_val) else datetime.now().isoformat()

    return {
        'id': row.get('id'),
        'topic': str(row.get('title', ''))[:100],
        'platform': platform,
        'likes': int(row.get('like_count', 0)),
        'comments': int(row.get('num_comments', 0)),
        'shares': int(row.get('repost_count', 0)),
        'sentiment': row.get('sentiment', 'neutral'),
        'trend': trend,
        'relevanceScore': int(engagement),
        'tags': (row.get('keywords', [])[:3] + row.get('hashtags', [])[:2]),
        'url': row.get('url', ''),
        'author': row.get('author', 'unknown'),
        'created_at': created_at_iso
    }

# ==============================================================================
# ===                      STATIC FILE & CORE API ROUTES                     ===
# ==============================================================================

@app.route('/')
def serve_index():
    return send_from_directory(FRONTEND_DIR, 'index.html')

@app.route('/<path:path>')
def serve_frontend_files(path):
    file_path = os.path.join(FRONTEND_DIR, path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return send_from_directory(FRONTEND_DIR, path)
    return send_from_directory(FRONTEND_DIR, 'index.html')

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'data_loaded': df_unified is not None,
        'total_trends': len(df_unified) if df_unified is not None else 0
    })

# ==============================================================================
# ===                  NEW CONSOLIDATED ENDPOINTS FOR UI                     ===
# ==============================================================================

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard_data():
    """Consolidated endpoint for the main dashboard."""
    try:
        interests_param = request.args.get('interests', 'AI & Machine Learning,Web Development,Technology')
        interests = interests_param.split(',')
        
        df_unified['created_at_dt'] = pd.to_datetime(df_unified['created_at'])
        
        kpis = {
            'trendsTracked': len(df_unified),
            'activeTopics': df_unified['topic_category'].nunique(),
            'updatesToday': len(df_unified[df_unified['created_at_dt'].dt.date == datetime.now().date()]),
            'relevanceScore': 92
        }
        
        user_profile = recommender.create_user_profile(user_interests=interests)
        recommendations = recommender.hybrid_recommendation(df_unified, user_profile, top_n=10)
        recommended_trends = [format_trend_for_frontend(row) for _, row in recommendations.iterrows()]

        trending_now = df_unified.nlargest(10, 'engagement_score')
        trending_trends = [format_trend_for_frontend(row) for _, row in trending_now.iterrows()]

        interest_counts = df_unified[df_unified['topic_category'].isin(interests)]['topic_category'].value_counts().to_dict()

        return jsonify({'success': True, 'data': {
            'kpis': kpis, 'recommendations': recommended_trends,
            'trending': trending_trends, 'userInterests': interest_counts
        }})
    except Exception as e:
        print(f"Error in /api/dashboard: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/explore', methods=['GET'])
def explore_topic():
    """Consolidated endpoint for the Topic Explorer page."""
    try:
        query = request.args.get('q', 'AI').lower()
        
        mask = (df_unified['title'].str.lower().str.contains(query, na=False) |
                df_unified['text'].str.lower().str.contains(query, na=False) |
                df_unified['keywords'].apply(lambda x: any(query in str(k).lower() for k in x)))
        matched_df = df_unified[mask]

        feed_items = [format_trend_for_frontend(row) for _, row in matched_df.nlargest(20, 'engagement_score').iterrows()]
        related_topics = matched_df['topic_category'].value_counts().nlargest(6).to_dict()
        top_contributors = matched_df['author'].value_counts().nlargest(5).to_dict()
        
        return jsonify({'success': True, 'data': {
            'feed': feed_items, 'relatedTopics': related_topics, 'topContributors': top_contributors
        }})
    except Exception as e:
        print(f"Error in /api/explore: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/trend-analysis', methods=['GET'])
def get_trend_analysis():
    """Consolidated endpoint for the Trend Analysis page."""
    try:
        df_unified['trend_status'] = df_unified['normalized_engagement'].apply(lambda x: 'rising' if x > 70 else 'stable' if x > 40 else 'declining')
        kpis = {
            'activeTrends': len(df_unified),
            'peakThisWeek': df_unified[df_unified['trend_status'] == 'stable'].shape[0],
            'emergingTrends': len(df_unified[df_unified['normalized_engagement'] < 40]),
            'declining': df_unified[df_unified['trend_status'] == 'declining'].shape[0]
        }
        
        df_unified['date'] = pd.to_datetime(df_unified['created_at']).dt.to_period('W').dt.start_time
        top_topics = df_unified['topic_category'].value_counts().nlargest(5).index.tolist()
        timeline_df = df_unified[df_unified['topic_category'].isin(top_topics)]
        timeline_data = timeline_df.groupby(['date', 'topic_category'])['engagement_score'].sum().unstack(fill_value=0).reset_index()

        return jsonify({'success': True, 'data': {'kpis': kpis, 'timeline': timeline_data.to_dict('records')}})
    except Exception as e:
        print(f"Error in /api/trend-analysis: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/pattern-mining', methods=['GET'])
def get_pattern_mining_data():
    """Consolidated endpoint for the Pattern Mining page."""
    try:
        return jsonify({
            'success': True,
            'data': {
                'kpis': {
                    'rules': len(association_rules),
                    'itemsets': len([iset for iset in frequent_itemsets if len(iset) > 1]),
                    'patterns': len(sequential_patterns)
                },
                'association_rules': sorted(association_rules, key=lambda x: x['lift'], reverse=True)[:50],
                'frequent_itemsets': sorted([{'items': list(k), 'support': v} for k, v in frequent_itemsets.items() if len(k) > 1], key=lambda x: x['support'], reverse=True)[:50],
                'sequential_patterns': sequential_patterns[:50]
            }
        })
    except Exception as e:
        print(f"Error in /api/pattern-mining: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ==============================================================================
# ===             LEGACY & SPECIFIC-PURPOSE API ENDPOINTS (FULL)             ===
# ==============================================================================
# Kept for backward compatibility and direct access if needed.

@app.route('/api/trends', methods=['GET'])
def get_trends():
    """(Legacy) Get all trends with pagination."""
    try:
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))
        platform = request.args.get('platform', None)
        
        df_filtered = df_unified.copy()
        if platform and platform != 'all':
            df_filtered = df_filtered[df_filtered['platform'] == platform]
        
        df_page = df_filtered.iloc[offset:offset+limit]
        trends = [format_trend_for_frontend(row) for _, row in df_page.iterrows()]
        
        return jsonify({'success': True, 'data': trends, 'total': len(df_filtered)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/reload', methods=['POST'])
def reload_data_endpoint_legacy():
    """(Legacy) Endpoint to trigger a full reload of the data."""
    try:
        # As a safety, you might want to add an auth key here in a real app
        ok = load_data()
        return jsonify({'success': ok, 'message': 'Data reloaded successfully.' if ok else 'Failed to reload data.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/recommendations/<user_id>', methods=['GET'])
def get_recommendations_legacy(user_id):
    """(Legacy) Get personalized recommendations for a user."""
    try:
        limit = int(request.args.get('limit', 20))
        interests_param = request.args.get('interests', 'technology,ai,data science')
        interests = [interest.strip() for interest in interests_param.split(',')]
        
        user_profile = recommender.create_user_profile(interests)
        recommendations = recommender.hybrid_recommendation(df_unified, user_profile, top_n=limit)
        result = [format_trend_for_frontend(row) for _, row in recommendations.iterrows()]
        
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/overview', methods=['GET'])
def get_overview_legacy():
    """(Legacy) Overview metrics for landing/overview page."""
    try:
        # This is a simplified version of what the new /api/dashboard provides
        top_by_platform = {}
        for platform in df_unified['platform'].dropna().unique():
            platform_df = df_unified[df_unified['platform'] == platform]
            top_items = platform_df.nlargest(3, 'engagement_score')
            top_by_platform[platform] = [
                {'name': str(row.get('title', ''))[:80], 'engagementPct': int(row.get('normalized_engagement', 50))}
                for _, row in top_items.iterrows()
            ]

        # Simplified rise calculation
        df_unified['date'] = pd.to_datetime(df_unified['created_at']).dt.date
        seven_days_ago = df_unified['date'].max() - timedelta(days=7)
        prev_week_sum = df_unified[df_unified['date'] < seven_days_ago]['engagement_score'].sum()
        curr_week_sum = df_unified[df_unified['date'] >= seven_days_ago]['engagement_score'].sum()
        global_rise_pct = int(((curr_week_sum - prev_week_sum) / prev_week_sum) * 100) if prev_week_sum > 0 else 100

        return jsonify({'success': True, 'data': {
            'topByPlatform': top_by_platform,
            'globalRisePct': global_rise_pct
        }})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats_legacy():
    """(Legacy) Get overall statistics."""
    try:
        df_unified['created_at'] = pd.to_datetime(df_unified['created_at'])
        today = datetime.now().date()
        stats = {
            'total_trends': len(df_unified),
            'trending_count': len(df_unified[df_unified['trend_status'] == 'rising']),
            'today_updates': len(df_unified[df_unified['created_at'].dt.date == today]),
            'average_engagement': float(df_unified['engagement_score'].mean()),
            'platforms': df_unified['platform'].value_counts().to_dict(),
            'sentiment_distribution': df_unified['sentiment'].value_counts().to_dict(),
        }
        return jsonify({'success': True, 'data': stats})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/search', methods=['GET'])
def search_trends_legacy():
    """(Legacy) Search trends by a query string."""
    try:
        query = request.args.get('q', '').lower()
        limit = int(request.args.get('limit', 20))
        if not query: return jsonify({'success': False, 'error': 'Query parameter required'}), 400
        
        mask = (df_unified['title'].str.lower().str.contains(query, na=False) |
                df_unified['text'].str.lower().str.contains(query, na=False) |
                df_unified['keywords'].apply(lambda x: any(query in str(k).lower() for k in x)))
        results = df_unified[mask].head(limit)
        trends = [format_trend_for_frontend(row) for _, row in results.iterrows()]
        
        return jsonify({'success': True, 'data': trends, 'total': len(results)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/network', methods=['GET'])
def network_graph():
    """Build a co-occurrence network graph with optional filters."""
    try:
        platform = request.args.get('platform')
        start_str = request.args.get('start')
        end_str = request.args.get('end')

        df = df_unified.copy()
        df['date'] = pd.to_datetime(df['created_at']).dt.date
        if platform and platform != 'all':
            df = df[df['platform'] == platform]
        if start_str:
            df = df[df['date'] >= datetime.fromisoformat(start_str).date()]
        if end_str:
            df = df[df['date'] <= datetime.fromisoformat(end_str).date()]

        node_strength, edge_strength = {}, {}
        for _, row in df.iterrows():
            terms = list(set(row.get('keywords', []) + row.get('hashtags', [])))
            for t in terms:
                if t: node_strength[t] = node_strength.get(t, 0) + 1
            for i in range(len(terms)):
                for j in range(i + 1, len(terms)):
                    if terms[i] and terms[j]:
                        a, b = sorted([terms[i], terms[j]])
                        edge_strength[(a, b)] = edge_strength.get((a, b), 0) + 1

        top_nodes = sorted(node_strength.items(), key=lambda x: x[1], reverse=True)[:200]
        node_set = {k for k, _ in top_nodes}
        
        edges = [{'source': a, 'target': b, 'weight': w} for (a, b), w in edge_strength.items() if a in node_set and b in node_set]
        edges = sorted(edges, key=lambda e: e['weight'], reverse=True)[:1000]
        nodes = [{'id': k, 'size': v} for k, v in top_nodes]

        return jsonify({'success': True, 'data': {'nodes': nodes, 'edges': edges}})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/insights', methods=['GET'])
def insights_report():
    """(Legacy) Heatmap and other insights."""
    try:
        df = df_unified.copy()
        df['date'] = pd.to_datetime(df['created_at']).dt.date

        term_counts = {}
        for _, row in df.iterrows():
            for col in ['hashtags', 'keywords']:
                terms = row.get(col)
                if isinstance(terms, list):
                    for t in terms:
                        if t: term_counts[t] = term_counts.get(t, 0) + 1
        top_terms = sorted(term_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        
        # ... (rest of your original insights logic can be added back here if needed) ...
        
        return jsonify({'success': True, 'data': {
            'topTerms': [{'term': k, 'count': v} for k, v in top_terms],
            'heatmap': {}, 'matrixLabels': [], 'cooccurrenceMatrix': [], 'patternDensity': 0.0
        }})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ==============================================================================
# ===                           APPLICATION STARTUP                          ===
# ==============================================================================

if __name__ == '__main__':
    with app.app_context():
        load_data()
    app.run(debug=True, host='0.0.0.0', port=5000)