"""
Quick test script to verify data preprocessing works correctly
"""
import pandas as pd
from data_preprocessing import DataPreprocessor

print("="*60)
print("TESTING DATA PREPROCESSING")
print("="*60)

# Initialize preprocessor
preprocessor = DataPreprocessor()

# Load data
print("\n1. Loading CSV files...")
try:
    reddit_df = pd.read_csv('reddit_trending_data.csv')
    print(f"   ✓ Reddit: {len(reddit_df)} rows")
    print(f"     Columns: {reddit_df.columns.tolist()[:5]}...")
except Exception as e:
    print(f"   ✗ Reddit error: {e}")
    reddit_df = None

try:
    youtube_df = pd.read_csv('youtube_trending_data.csv')
    print(f"   ✓ YouTube: {len(youtube_df)} rows")
    print(f"     Columns: {youtube_df.columns.tolist()[:5]}...")
except Exception as e:
    print(f"   ✗ YouTube error: {e}")
    youtube_df = None

try:
    bluesky_df = pd.read_csv('bluesky_trending_authenticated.csv')
    print(f"   ✓ Bluesky: {len(bluesky_df)} rows")
    print(f"     Columns: {bluesky_df.columns.tolist()[:5]}...")
except Exception as e:
    print(f"   ✗ Bluesky error: {e}")
    bluesky_df = None

# Process data
print("\n2. Processing data...")
unified_df = preprocessor.create_unified_dataset(reddit_df, youtube_df, bluesky_df)

if unified_df is None or unified_df.empty:
    print("   ✗ FAILED: No unified data created!")
    exit(1)

print(f"\n3. Unified dataset created: {len(unified_df)} rows")

# Check critical fields
print("\n4. Checking critical fields...")
critical_fields = ['id', 'title', 'platform', 'created_at', 'like_count', 'engagement_score']
for field in critical_fields:
    if field in unified_df.columns:
        non_null = unified_df[field].notna().sum()
        print(f"   ✓ {field}: {non_null}/{len(unified_df)} non-null")
        if field in ['like_count', 'engagement_score']:
            print(f"     Range: {unified_df[field].min()} to {unified_df[field].max()}")
    else:
        print(f"   ✗ {field}: MISSING!")

# Show sample data
print("\n5. Sample of processed data:")
print(unified_df[['platform', 'title', 'like_count', 'engagement_score']].head(10).to_string())

# Check for issues
print("\n6. Data quality checks:")
null_titles = unified_df['title'].isna().sum()
zero_likes = (unified_df['like_count'] == 0).sum()
zero_engagement = (unified_df['engagement_score'] == 0).sum()

print(f"   - Null titles: {null_titles}")
print(f"   - Zero likes: {zero_likes}/{len(unified_df)} ({zero_likes/len(unified_df)*100:.1f}%)")
print(f"   - Zero engagement: {zero_engagement}/{len(unified_df)} ({zero_engagement/len(unified_df)*100:.1f}%)")

# Check ID format
print("\n7. Checking ID field:")
print(f"   Sample IDs: {unified_df['id'].head(3).tolist()}")
print(f"   ID types: {unified_df['id'].dtype}")
print(f"   Null IDs: {unified_df['id'].isna().sum()}")

# Save
print("\n8. Saving to processed_unified_data.csv...")
unified_df.to_csv('processed_unified_data.csv', index=False)
print("   ✓ Saved!")

# Verify save
print("\n9. Verifying saved file...")
test_load = pd.read_csv('processed_unified_data.csv', nrows=5)
print(f"   ✓ Can read back: {len(test_load)} rows")
print(f"   ✓ ID column: {test_load['id'].tolist()}")

print("\n" + "="*60)
print("✅ PREPROCESSING TEST COMPLETE!")
print("="*60)
print("\nNext steps:")
print("1. Check processed_unified_data.csv exists")
print("2. Run: python app.py")
print("="*60)