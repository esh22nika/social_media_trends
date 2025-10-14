import pandas as pd
import os

print("=" * 60)
print("CSV DATA INSPECTOR")
print("=" * 60)

files = [
    'reddit_trending_data.csv',
    'youtube_trending_data.csv', 
    'bluesky_trending_authenticated.csv'
]

for filename in files:
    print(f"\n📄 {filename}")
    print("-" * 60)
    
    if not os.path.exists(filename):
        print(f"   ❌ File not found!")
        continue
    
    try:
        df = pd.read_csv(filename)
        print(f"   ✓ Rows: {len(df)}")
        print(f"   ✓ Columns: {list(df.columns)}")
        print(f"\n   First row preview:")
        print(f"   {df.iloc[0].to_dict()}")
        
        # Check for required columns
        required = ['title', 'created_at']
        missing = [col for col in required if col not in df.columns]
        if missing:
            print(f"\n   ⚠️  Missing required columns: {missing}")
        
    except Exception as e:
        print(f"   ❌ Error reading file: {e}")

print("\n" + "=" * 60)