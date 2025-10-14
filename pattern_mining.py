import pandas as pd
import numpy as np
from collections import Counter, defaultdict
from itertools import combinations, chain
import json

class PatternMiningEngine:
    def __init__(self, min_support=0.02, min_confidence=0.3):
        self.min_support = min_support
        self.min_confidence = min_confidence
        
    def prepare_transactions(self, df):
        """Convert data to transaction format"""
        transactions = []
        
        for _, row in df.iterrows():
            transaction = set()
            
            # Add keywords
            if 'keywords' in row and isinstance(row['keywords'], list):
                transaction.update([k.lower() for k in row['keywords'] if k])
            
            # Add hashtags
            if 'hashtags' in row and isinstance(row['hashtags'], list):
                transaction.update([h.lower() for h in row['hashtags'] if h])
            
            # Add platform
            if 'platform' in row:
                transaction.add(f"platform:{row['platform']}")
            
            # Add sentiment
            if 'sentiment' in row:
                transaction.add(f"sentiment:{row['sentiment']}")
            
            if transaction:
                transactions.append(list(transaction))
        
        return transactions
    
    def calculate_support(self, itemset, transactions):
        """Calculate support for an itemset"""
        count = sum(1 for t in transactions if itemset.issubset(set(t)))
        return count / len(transactions) if transactions else 0
    
    def get_frequent_1_itemsets(self, transactions):
        """Get frequent 1-itemsets"""
        item_counts = Counter(chain.from_iterable(transactions))
        n_transactions = len(transactions)
        
        frequent_items = {}
        for item, count in item_counts.items():
            support = count / n_transactions
            if support >= self.min_support:
                frequent_items[frozenset([item])] = support
        
        return frequent_items
    
    def apriori_gen(self, frequent_itemsets_prev, k):
        """Generate candidate k-itemsets"""
        candidates = set()
        itemsets = list(frequent_itemsets_prev.keys())
        
        for i in range(len(itemsets)):
            for j in range(i + 1, len(itemsets)):
                union = itemsets[i] | itemsets[j]
                if len(union) == k:
                    candidates.add(union)
        
        return candidates
    
    def apriori_algorithm(self, transactions, max_k=4):
        """Apriori algorithm for frequent itemset mining"""
        print("Running Apriori algorithm...")
        
        # Get frequent 1-itemsets
        frequent_itemsets = self.get_frequent_1_itemsets(transactions)
        all_frequent = dict(frequent_itemsets)
        
        k = 2
        while k <= max_k and frequent_itemsets:
            # Generate candidates
            candidates = self.apriori_gen(frequent_itemsets, k)
            
            # Calculate support for candidates
            frequent_itemsets = {}
            for candidate in candidates:
                support = self.calculate_support(candidate, transactions)
                if support >= self.min_support:
                    frequent_itemsets[candidate] = support
            
            all_frequent.update(frequent_itemsets)
            k += 1
        
        print(f"Found {len(all_frequent)} frequent itemsets")
        return all_frequent
    
    def generate_association_rules(self, frequent_itemsets):
        """Generate association rules from frequent itemsets"""
        print("Generating association rules...")
        rules = []
        
        for itemset, support in frequent_itemsets.items():
            if len(itemset) < 2:
                continue
            
            # Generate all possible rules from this itemset
            for i in range(1, len(itemset)):
                for antecedent in combinations(itemset, i):
                    antecedent = frozenset(antecedent)
                    consequent = itemset - antecedent
                    
                    if not consequent:
                        continue
                    
                    # Calculate confidence
                    antecedent_support = frequent_itemsets.get(antecedent, 0)
                    if antecedent_support > 0:
                        confidence = support / antecedent_support
                        
                        if confidence >= self.min_confidence:
                            # Calculate lift
                            consequent_support = frequent_itemsets.get(consequent, 0)
                            lift = confidence / consequent_support if consequent_support > 0 else 0
                            
                            rules.append({
                                'antecedent': list(antecedent),
                                'consequent': list(consequent),
                                'support': support,
                                'confidence': confidence,
                                'lift': lift
                            })
        
        # Sort by lift
        rules.sort(key=lambda x: x['lift'], reverse=True)
        print(f"Generated {len(rules)} association rules")
        return rules
    
    def fp_growth_algorithm(self, transactions, max_patterns=1000):
        """Simplified FP-Growth implementation"""
        print("Running FP-Growth algorithm...")
        
        # Count item frequencies
        item_counts = Counter(chain.from_iterable(transactions))
        n_transactions = len(transactions)
        
        # Filter items by min support
        frequent_items = {
            item: count for item, count in item_counts.items()
            if count / n_transactions >= self.min_support
        }
        
        if not frequent_items:
            return {}
        
        # Sort transactions by frequency
        sorted_transactions = []
        for transaction in transactions:
            sorted_trans = sorted(
                [item for item in transaction if item in frequent_items],
                key=lambda x: frequent_items[x],
                reverse=True
            )
            if sorted_trans:
                sorted_transactions.append(sorted_trans)
        
        # Build FP-tree and mine patterns (simplified)
        patterns = {}
        
        # Add single items
        for item, count in frequent_items.items():
            support = count / n_transactions
            patterns[frozenset([item])] = support
        
        # Find frequent pairs
        pair_counts = Counter()
        for transaction in sorted_transactions:
            for pair in combinations(transaction, 2):
                pair_counts[frozenset(pair)] += 1
        
        for pair, count in pair_counts.items():
            support = count / n_transactions
            if support >= self.min_support:
                patterns[pair] = support
        
        # Find frequent triplets
        triplet_counts = Counter()
        for transaction in sorted_transactions:
            if len(transaction) >= 3:
                for triplet in combinations(transaction, 3):
                    triplet_counts[frozenset(triplet)] += 1
        
        for triplet, count in triplet_counts.items():
            support = count / n_transactions
            if support >= self.min_support:
                patterns[triplet] = support
        
        print(f"Found {len(patterns)} patterns using FP-Growth")
        return patterns
    
    def mine_sequential_patterns(self, df, time_column='created_at', max_gap_days=7):
        """Mine sequential patterns in temporal data"""
        print("Mining sequential patterns...")
        # Ensure all datetimes are timezone-naive for safe sorting
        df[time_column] = pd.to_datetime(df[time_column], errors='coerce').dt.tz_localize(None)

        # Sort by time
        df_sorted = df.sort_values(time_column)
        
        # Group by author/source
        sequences = defaultdict(list)
        
        for _, row in df_sorted.iterrows():
            author = row.get('author', 'unknown')
            
            # Get items
            items = set()
            if 'keywords' in row and isinstance(row['keywords'], list):
                items.update([k.lower() for k in row['keywords'][:3] if k])
            
            if items:
                sequences[author].append({
                    'items': list(items),
                    'time': row[time_column]
                })
        
        # Find common sequences
        sequential_patterns = []
        
        for author, events in sequences.items():
            if len(events) < 2:
                continue
            
            # Look for consecutive patterns
            for i in range(len(events) - 1):
                time_diff = (events[i + 1]['time'] - events[i]['time']).days
                
                if 0 < time_diff <= max_gap_days:
                    pattern = {
                        'sequence': [events[i]['items'][0] if events[i]['items'] else '',
                                   events[i + 1]['items'][0] if events[i + 1]['items'] else ''],
                        'time_gap_days': time_diff
                    }
                    sequential_patterns.append(pattern)
        
        # Count pattern frequencies
        pattern_counts = Counter()
        for p in sequential_patterns:
            seq_tuple = tuple(p['sequence'])
            pattern_counts[seq_tuple] += 1
        
        # Convert to list with support
        result = []
        total_patterns = len(sequential_patterns)
        for pattern, count in pattern_counts.most_common(50):
            if count > 2:  # Minimum frequency
                result.append({
                    'sequence': list(pattern),
                    'support': count / total_patterns if total_patterns > 0 else 0,
                    'count': count,
                    'avg_duration': f"{max_gap_days} days"
                })
        
        print(f"Found {len(result)} sequential patterns")
        return result
    
    def get_trend_lifecycle(self, df, keyword, time_column='created_at'):
        """Analyze lifecycle of a trend"""
        # Filter for keyword
        keyword_lower = keyword.lower()
        filtered = df[df['keywords'].apply(
            lambda x: keyword_lower in [k.lower() for k in x] if isinstance(x, list) else False
        )].copy()
        
        if filtered.empty:
            return None
        
        # Group by date
        filtered['date'] = pd.to_datetime(filtered[time_column]).dt.date
        daily_stats = filtered.groupby('date').agg({
            'engagement_score': ['mean', 'sum', 'count']
        }).reset_index()
        
        daily_stats.columns = ['date', 'avg_engagement', 'total_engagement', 'count']
        
        # Determine lifecycle stage
        engagement_trend = daily_stats['avg_engagement'].values
        if len(engagement_trend) > 2:
            recent_avg = np.mean(engagement_trend[-3:])
            earlier_avg = np.mean(engagement_trend[:-3]) if len(engagement_trend) > 3 else engagement_trend[0]
            
            if recent_avg > earlier_avg * 1.5:
                stage = 'growing'
            elif recent_avg < earlier_avg * 0.7:
                stage = 'declining'
            else:
                stage = 'stable'
        else:
            stage = 'emerging'
        
        return {
            'keyword': keyword,
            'stage': stage,
            'total_mentions': len(filtered),
            'avg_engagement': filtered['engagement_score'].mean(),
            'peak_date': daily_stats.loc[daily_stats['total_engagement'].idxmax(), 'date'].isoformat(),
            'daily_stats': daily_stats.to_dict('records')
        }

# Example usage
if __name__ == "__main__":
    # Load processed data
    df = pd.read_csv('processed_unified_data.csv')
    
    # Parse list columns
    for col in ['keywords', 'hashtags']:
        if col in df.columns:
            df[col] = df[col].apply(lambda x: eval(x) if isinstance(x, str) and x.startswith('[') else [])
    
    # Initialize pattern mining
    miner = PatternMiningEngine(min_support=0.02, min_confidence=0.3)
    
    # Prepare transactions
    transactions = miner.prepare_transactions(df)
    
    # Run Apriori
    frequent_itemsets = miner.apriori_algorithm(transactions, max_k=3)
    
    # Generate association rules
    rules = miner.generate_association_rules(frequent_itemsets)
    
    # Save results
    with open('association_rules.json', 'w') as f:
        json.dump(rules[:100], f, indent=2)  # Top 100 rules
    
    print(f"\nTop 5 Association Rules:")
    for i, rule in enumerate(rules[:5], 1):
        print(f"{i}. {rule['antecedent']} => {rule['consequent']}")
        print(f"   Support: {rule['support']:.3f}, Confidence: {rule['confidence']:.3f}, Lift: {rule['lift']:.3f}\n")
    
    # Run FP-Growth
    fp_patterns = miner.fp_growth_algorithm(transactions)
    
    # Mine sequential patterns
    sequential = miner.mine_sequential_patterns(df)
    
    with open('sequential_patterns.json', 'w') as f:
        json.dump(sequential, f, indent=2)
    
    print(f"\nFound {len(sequential)} sequential patterns")