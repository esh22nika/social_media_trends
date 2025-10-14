import google.generativeai as genai
import pandas as pd
from tqdm import tqdm
import json

class GeminiClient:
    def __init__(self, api_key):
        """Initializes the Gemini client with the provided API key."""
        if not api_key:
            raise ValueError("Google Gemini API key is required.")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro')
        print("🤖 Gemini Client initialized successfully for Keyword Extraction.")

    def get_keywords_from_text(self, text_content):
        """Extracts the main keywords/entities from a single piece of text."""
        if not text_content or pd.isna(text_content):
            return []

        prompt = f"""
        Analyze the following social media post title/text and identify the main subject, people, or concepts.
        Extract 1 to 3 of the most important keywords or entities.
        Return the result as a JSON list of strings. For example: ["Taylor Swift", "Eras Tour"].
        Do not return anything else but the JSON list.

        Post Content: "{text_content[:1000]}"

        Keywords (JSON List):
        """
        try:
            response = self.model.generate_content(prompt)
            # Clean the response to find the JSON list
            cleaned_text = response.text.strip().replace('```json', '').replace('```', '').strip()
            keywords = json.loads(cleaned_text)
            if isinstance(keywords, list):
                return keywords
            return []
        except (json.JSONDecodeError, Exception):
            # If JSON parsing fails, fallback to a simple keyword extraction
            return [word for word in text_content.split() if len(word) > 5 and word.isalnum()][:2]

    def summarize_topic_from_text(self, text_content):
        """Summarizes a social media post title into a concise, clear topic."""
        if not text_content or pd.isna(text_content):
            return "General Discussion Topic"

        prompt = f"""
        Analyze the following social media post title and rephrase it as a short, clear, and descriptive topic headline.
        The goal is to make absurd or clickbait titles understandable. For example, 'My eggs were iridescent this morning' could become 'Discussion on Iridescent Eggs'.
        'One red sticker remaining on abuse sheet at a women's health clinic' could become 'Discussion on Women's Health Clinic Experiences'.
        Keep it concise and under 10 words. Do not add any preamble, just return the rephrased topic.

        Original Title: "{text_content[:500]}"

        Rephrased Topic:
        """
        try:
            response = self.model.generate_content(prompt)
            summary = response.text.strip()
            if summary and len(summary) < 100:
                return summary
            return text_content
        except Exception:
            return text_content

    def bulk_extract_keywords(self, df, text_column='title'):
        """Extracts keywords for an entire DataFrame column with a progress bar."""
        print(f"🤖 Starting bulk keyword extraction for {len(df)} items with Gemini...")
        print("⏳ This may take a few minutes depending on the amount of data.")
        
        tqdm.pandas(desc="Extracting Keywords")
        keywords = df[text_column].progress_apply(self.get_keywords_from_text)
        
        print("✅ Bulk keyword extraction complete.")
        return keywords