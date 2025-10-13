from pytrends.request import TrendReq
import pandas as pd
import time
from datetime import datetime
import json

class GoogleTrendsCollector:
    def __init__(self, hl='en-US', tz=360):
        """
        Initialize Google Trends API client
        hl: language (en-US, en-GB, etc.)
        tz: timezone offset in minutes from UTC
        """
        # retries and backoff to reduce 429 errors
        self.pytrends = TrendReq(hl=hl, tz=tz)
        print("Google Trends API initialized")

    def get_trending_searches(self, pn='united_states'):
        """Get current daily trending searches"""
        try:
            trending = self.pytrends.trending_searches(pn=pn)
            return trending[0].tolist()
        except Exception as e:
            print(f"Error fetching trending searches for {pn}: {e}")
            return []

    def get_realtime_trends(self):
        """Get real-time trending searches (US only)"""
        try:
            trending = self.pytrends.realtime_trending_searches()
            return trending
        except Exception as e:
            print(f"Error fetching realtime trends: {e}")
            return pd.DataFrame()

    def get_interest_over_time(self, keywords, timeframe='today 3-m', geo=None):
        """Get interest over time for keywords"""
        try:
            if len(keywords) > 5:
                keywords = keywords[:5]
            self.pytrends.build_payload(keywords, timeframe=timeframe, geo=geo)
            df = self.pytrends.interest_over_time()
            if not df.empty:
                df = df.drop('isPartial', axis=1, errors='ignore')
            return df
        except Exception as e:
            print(f"Error fetching interest over time: {e}")
            return pd.DataFrame()

    def get_interest_by_region(self, keywords, timeframe='today 3-m', geo=None, resolution='COUNTRY'):
        """Get interest by geographical region"""
        try:
            if len(keywords) > 5:
                keywords = keywords[:5]
            self.pytrends.build_payload(keywords, timeframe=timeframe, geo=geo)
            df = self.pytrends.interest_by_region(resolution=resolution, inc_low_vol=True)
            return df
        except Exception as e:
            print(f"Error fetching interest by region: {e}")
            return pd.DataFrame()

    def get_related_queries(self, keyword, timeframe='today 3-m', geo=None):
        """Get related queries (top and rising)"""
        try:
            self.pytrends.build_payload([keyword], timeframe=timeframe, geo=geo)
            related = self.pytrends.related_queries()
            return related.get(keyword, {})
        except Exception as e:
            print(f"Error fetching related queries for '{keyword}': {e}")
            return {}

    def get_related_topics(self, keyword, timeframe='today 3-m', geo=None):
        """Get related topics (top and rising)"""
        try:
            self.pytrends.build_payload([keyword], timeframe=timeframe, geo=geo)
            topics = self.pytrends.related_topics()
            return topics.get(keyword, {})
        except Exception as e:
            print(f"Error fetching related topics for '{keyword}': {e}")
            return {}

    def get_suggestions(self, keyword):
        """Get keyword suggestions"""
        try:
            suggestions = self.pytrends.suggestions(keyword=keyword)
            return pd.DataFrame(suggestions)
        except Exception as e:
            print(f"Error fetching suggestions for '{keyword}': {e}")
            return pd.DataFrame()

    def compare_keywords(self, keywords, timeframe='today 3-m', geo=None):
        """Compare multiple keywords"""
        try:
            if len(keywords) > 5:
                keywords = keywords[:5]
            self.pytrends.build_payload(keywords, timeframe=timeframe, geo=geo)
            df = self.pytrends.interest_over_time()
            if df.empty:
                return pd.DataFrame(), pd.DataFrame()
            df = df.drop('isPartial', axis=1, errors='ignore')

            stats = {
                'keyword': keywords,
                'avg_interest': [df[kw].mean() for kw in keywords],
                'max_interest': [df[kw].max() for kw in keywords],
                'min_interest': [df[kw].min() for kw in keywords],
                'std_interest': [df[kw].std() for kw in keywords],
                'trend_direction': [self._calculate_trend(df[kw]) for kw in keywords]
            }

            return pd.DataFrame(stats), df
        except Exception as e:
            print(f"Error comparing keywords: {e}")
            return pd.DataFrame(), pd.DataFrame()

    def _calculate_trend(self, series):
        """Calculate trend direction (rising, falling, stable)"""
        if len(series) < 2:
            return 'unknown'
        first_half = series[:len(series)//2].mean()
        second_half = series[len(series)//2:].mean()
        if second_half > first_half * 1.1:
            return 'rising'
        elif second_half < first_half * 0.9:
            return 'falling'
        else:
            return 'stable'

    def collect_comprehensive_dataset(self, seed_keywords=None, geos=['US', 'IN', 'GB'], timeframe='today 3-m'):
        """Collect comprehensive Google Trends dataset"""
        all_data = {
            'trending_searches': [],
            'realtime_trends': [],
            'keyword_interest': [],
            'regional_interest': [],
            'related_queries': [],
            'related_topics': [],
            'keyword_comparisons': []
        }

        # 1. Get trending searches
        print("Fetching trending searches...")
        country_map = {'US': 'united_states', 'IN': 'india', 'GB': 'united_kingdom'}
        for geo in geos:
            country = country_map.get(geo, 'united_states')
            trending = self.get_trending_searches(pn=country)
            for term in trending:
                all_data['trending_searches'].append({
                    'keyword': term,
                    'geo': geo,
                    'source': 'daily_trending',
                    'timestamp': datetime.now()
                })
            print(f"  Found {len(trending)} trending searches in {geo}")
            time.sleep(3)

        # 2. Realtime trends (US only)
        print("\nFetching realtime trends...")
        realtime = self.get_realtime_trends()
        if not realtime.empty:
            for idx, row in realtime.iterrows():
                all_data['realtime_trends'].append({
                    'title': row.get('title', ''),
                    'entityNames': row.get('entityNames', []),
                    'traffic': row.get('approx_traffic', ''),
                    'geo': 'US',
                    'timestamp': datetime.now()
                })
        print(f"  Found {len(realtime)} realtime trends")

        # 3. Combine seed + trending keywords
        all_keywords = set([item['keyword'] for item in all_data['trending_searches']])
        if seed_keywords:
            all_keywords.update(seed_keywords)
        all_keywords = list(all_keywords)[:50]
        print(f"\nAnalyzing {len(all_keywords)} unique keywords...")

        # 4. Interest over time
        print("\nFetching interest over time...")
        for keyword in all_keywords:
            df = self.get_interest_over_time([keyword], timeframe=timeframe)
            if not df.empty:
                for date, row in df.iterrows():
                    all_data['keyword_interest'].append({
                        'keyword': keyword,
                        'date': date,
                        'interest': row[keyword],
                        'timeframe': timeframe
                    })
            time.sleep(5)

        # 5. Regional interest (top 20)
        print("\nFetching regional interest...")
        top_keywords = all_keywords[:20]
        for keyword in top_keywords:
            df = self.get_interest_by_region([keyword], timeframe=timeframe)
            if not df.empty:
                for region, row in df.iterrows():
                    all_data['regional_interest'].append({
                        'keyword': keyword,
                        'region': region,
                        'interest': row[keyword]
                    })
            time.sleep(5)

        # 6. Related queries & topics (top 15)
        print("\nFetching related queries and topics...")
        for keyword in top_keywords[:15]:
            related_queries = self.get_related_queries(keyword, timeframe=timeframe)
            for typ in ['top', 'rising']:
                if typ in related_queries and related_queries[typ] is not None:
                    for idx, row in related_queries[typ].iterrows():
                        all_data['related_queries'].append({
                            'keyword': keyword,
                            'related_query': row['query'],
                            'value': row['value'],
                            'type': typ
                        })

            related_topics = self.get_related_topics(keyword, timeframe=timeframe)
            for typ in ['top', 'rising']:
                if typ in related_topics and related_topics[typ] is not None:
                    for idx, row in related_topics[typ].iterrows():
                        all_data['related_topics'].append({
                            'keyword': keyword,
                            'topic_title': row.get('topic_title', ''),
                            'topic_type': row.get('topic_type', ''),
                            'value': row['value'],
                            'type': typ
                        })
            time.sleep(5)

        # 7. Compare keywords in batches of 5
        print("\nComparing keywords...")
        for i in range(0, len(top_keywords), 5):
            batch = top_keywords[i:i+5]
            stats, _ = self.compare_keywords(batch, timeframe=timeframe)
            if not stats.empty:
                for idx, row in stats.iterrows():
                    all_data['keyword_comparisons'].append(row.to_dict())
            time.sleep(5)

        # Convert to DataFrames
        dfs = {key: pd.DataFrame(data) if data else pd.DataFrame() for key, data in all_data.items()}
        return dfs

    def save_datasets(self, dfs, prefix='google_trends'):
        """Save all datasets to CSV files"""
        for name, df in dfs.items():
            if not df.empty:
                filename = f'{prefix}_{name}.csv'
                df.to_csv(filename, index=False)
                print(f"Saved {filename} ({len(df)} rows)")

# Example usage
if __name__ == "__main__":
    collector = GoogleTrendsCollector()
    seed_keywords = ['artificial intelligence', 'machine learning', 'cryptocurrency', 'climate change', 'technology news']
    print("Starting comprehensive Google Trends data collection...")
    dfs = collector.collect_comprehensive_dataset(seed_keywords=seed_keywords, geos=['US', 'IN', 'GB'])
    collector.save_datasets(dfs)
    print("\nCollection complete!")


