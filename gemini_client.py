import google.generativeai as genai
import pandas as pd
from tqdm import tqdm
import json
import time

class GeminiClient:
    def __init__(self, api_key):
        """Initializes the Gemini client with the provided API key."""
        if not api_key:
            raise ValueError("Google Gemini API key is required.")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro')
        print("🤖 Gemini Client initialized successfully for Keyword Extraction and Title Summarization.")

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
            cleaned_text = response.text.strip().replace('```json', '').replace('```', '').strip()
            keywords = json.loads(cleaned_text)
            if isinstance(keywords, list):
                return keywords
            return []
        except (json.JSONDecodeError, Exception) as e:
            # Fallback to simple keyword extraction
            words = text_content.split()
            return [word for word in words if len(word) > 5 and word.isalnum()][:2]

    def summarize_topic_from_text(self, text_content):
        """Summarizes a social media post title into a concise, clear topic."""
        if not text_content or pd.isna(text_content):
            return "General Discussion"

        prompt = f"""
        Analyze the following social media post title and rephrase it as a short, clear, and descriptive topic headline.
        
        Rules:
        - Make clickbait or absurd titles understandable and professional
        - Keep it concise (under 60 characters)
        - Focus on the main topic, not sensationalism
        - Remove unnecessary punctuation and emojis
        - If it's a question, rephrase as a statement about the topic
        - Don't add quotes around your response
        
        Examples:
        Input: "My eggs were iridescent this morning"
        Output: Discussion on Unusual Egg Appearance
        
        Input: "You won't BELIEVE what happened next!!!"
        Output: Unexpected Event Discussion
        
        Input: "One red sticker remaining on abuse sheet at clinic"
        Output: Healthcare Clinic Experience
        
        Input: "AITA for telling my sister she's being dramatic?"
        Output: Family Conflict Resolution Discussion
        
        Input: "Why is everyone talking about this AI feature?"
        Output: Trending AI Feature Discussion

        Original Title: "{text_content[:500]}"

        Summarized Topic (short and clear):
        """
        try:
            response = self.model.generate_content(prompt)
            summary = response.text.strip()
            # Remove quotes if Gemini added them
            summary = summary.strip('"\'').strip()
            
            # Validate the response
            if summary and len(summary) < 150 and summary.lower() != text_content.lower()[:150]:
                return summary
            
            # Fallback to truncated original if Gemini failed
            return text_content[:60]
        except Exception as e:
            print(f"Error summarizing title: {e}")
            return text_content[:60]

    def bulk_extract_keywords(self, df, text_column='title'):
        """Extracts keywords for an entire DataFrame column with a progress bar."""
        print(f"🤖 Starting bulk keyword extraction for {len(df)} items with Gemini...")
        print("⏳ This may take a few minutes depending on the amount of data.")
        
        keywords = []
        for idx, text in enumerate(tqdm(df[text_column], desc="Extracting Keywords")):
            try:
                result = self.get_keywords_from_text(text)
                keywords.append(result)
                
                # Rate limiting: Sleep every 10 requests to avoid API limits
                if (idx + 1) % 10 == 0:
                    time.sleep(1)
            except Exception as e:
                print(f"Error processing row {idx}: {e}")
                keywords.append([])
        
        print("✅ Bulk keyword extraction complete.")
        return keywords

    def bulk_summarize_titles(self, df, text_column='title'):
        """Summarizes titles for an entire DataFrame column with a progress bar."""
        print(f"📝 Starting bulk title summarization for {len(df)} items with Gemini...")
        print("⏳ This will take several minutes. Consider caching results.")
        
        summaries = []
        for idx, text in enumerate(tqdm(df[text_column], desc="Summarizing Titles")):
            try:
                result = self.summarize_topic_from_text(text)
                summaries.append(result)
                
                # Rate limiting: Sleep every 10 requests to avoid hitting API limits
                if (idx + 1) % 10 == 0:
                    time.sleep(1)
                    
                # Extra safety: sleep longer every 50 requests
                if (idx + 1) % 50 == 0:
                    print(f"\n⏸️  Processed {idx + 1} titles. Taking a brief pause...")
                    time.sleep(3)
                    
            except Exception as e:
                print(f"Error summarizing row {idx}: {e}")
                summaries.append(str(text)[:60])  # Fallback to truncated original
        
        print("✅ Bulk title summarization complete.")
        return summaries