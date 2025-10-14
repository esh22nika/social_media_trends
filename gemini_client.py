import google.generativeai as genai
import pandas as pd
from tqdm import tqdm

class GeminiClient:
    def __init__(self, api_key):
        """Initializes the Gemini client with the provided API key."""
        if not api_key:
            raise ValueError("Google Gemini API key is required.")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro')
        self.topic_list = [
            "AI & Machine Learning", "Web Development", "Climate & Environment", 
            "Space & Science", "Cryptocurrency & Finance", "Technology & Gadgets", 
            "World News & Politics", "Entertainment & Pop Culture", "Health & Wellness",
            "Gaming", "Lifestyle & Hobbies", "General Discussion"
        ]
        print("🤖 Gemini Client initialized successfully.")

    def get_topic_from_text(self, text_content):
        """Categorizes a single piece of text content into a predefined topic."""
        if not text_content or pd.isna(text_content):
            return "General Discussion"
            
        prompt = f"""
        Analyze the following social media post title/text and categorize it into the single most fitting topic from this list.
        Only return the topic name and nothing else.

        Topic List: {', '.join(self.topic_list)}

        Post Content: "{text_content[:1000]}"

        Category:
        """
        try:
            response = self.model.generate_content(prompt)
            topic = response.text.strip()
            # Ensure the response is one of the valid topics
            if topic in self.topic_list:
                return topic
            return "General Discussion"
        except Exception:
            return "General Discussion"

    def bulk_categorize_topics(self, df, text_column='title'):
        """Categorizes topics for an entire DataFrame column with a progress bar."""
        print(f"🤖 Starting bulk topic categorization for {len(df)} items with Gemini...")
        print("⏳ This is a one-time process and may take several minutes.")
        
        tqdm.pandas(desc="Categorizing Topics")
        topics = df[text_column].progress_apply(self.get_topic_from_text)
        
        print("✅ Bulk topic categorization complete.")
        return topics