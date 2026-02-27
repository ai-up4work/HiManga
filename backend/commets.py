"""
Reddit Manga Chapter Scraper - Python Backend
Usage: python reddit_scraper.py "One Piece" 1095
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, List, Optional
import time


class RedditMangaScraper:
    def __init__(self):
        self.base_url = "https://www.reddit.com"
        self.headers = {
            'User-Agent': 'MangaSiteBot/1.0 (Chapter Discussion Scraper)'
        }
    
    def scrape_chapter(self, manga_name: str, chapter_num: str) -> Dict:
        """
        Scrape Reddit for manga chapter discussion
        
        Args:
            manga_name: Name of the manga (e.g., "One Piece")
            chapter_num: Chapter number (e.g., "1095")
        
        Returns:
            Dictionary containing discussion data and context
        """
        try:
            # Step 1: Search r/manga for chapter discussion
            search_query = f"{manga_name} chapter {chapter_num}"
            search_url = f"{self.base_url}/r/manga/search.json"
            params = {
                'q': search_query,
                'restrict_sr': '1',
                'sort': 'relevance',
                'limit': '5'
            }
            
            print(f"Searching for: {search_query}")
            response = requests.get(search_url, headers=self.headers, params=params)
            response.raise_for_status()
            
            search_data = response.json()
            posts = search_data['data']['children']
            
            if not posts:
                return {
                    'success': False,
                    'message': 'No discussion threads found',
                    'suggestions': [
                        'Try different manga name variations',
                        'Verify the chapter number is correct',
                        'Some chapters may not have Reddit discussions'
                    ]
                }
            
            # Step 2: Get the top post (most relevant)
            top_post = posts[0]['data']
            print(f"Found post: {top_post['title']}")
            
            # Step 3: Fetch comments from the top post
            permalink = top_post['permalink']
            comments_url = f"{self.base_url}{permalink}.json?limit=50"
            
            print("Fetching comments...")
            comments_response = requests.get(comments_url, headers=self.headers)
            comments_response.raise_for_status()
            
            comments_data = comments_response.json()
            
            # Step 4: Extract and process comments
            top_comments = []
            if len(comments_data) > 1 and 'children' in comments_data[1]['data']:
                for comment in comments_data[1]['data']['children']:
                    if comment['kind'] != 't1':  # Skip non-comment items
                        continue
                    
                    comment_data = comment['data']
                    body = comment_data.get('body', '')
                    
                    # Filter out deleted/removed/short comments
                    if (body and 
                        body not in ['[deleted]', '[removed]'] and 
                        len(body) > 20):
                        
                        top_comments.append({
                            'author': comment_data.get('author', 'Unknown'),
                            'body': body,
                            'score': comment_data.get('score', 0),
                            'awards': comment_data.get('total_awards_received', 0),
                            'created_at': datetime.fromtimestamp(
                                comment_data.get('created_utc', 0)
                            ).isoformat(),
                            'is_op': comment_data.get('is_submitter', False)
                        })
                
                # Limit to top 20 comments
                top_comments = top_comments[:20]
            
            # Step 5: Process all matching posts
            all_discussions = []
            for post in posts:
                post_data = post['data']
                all_discussions.append({
                    'title': post_data.get('title', ''),
                    'description': post_data.get('selftext', ''),
                    'author': post_data.get('author', ''),
                    'upvotes': post_data.get('ups', 0),
                    'comment_count': post_data.get('num_comments', 0),
                    'url': f"{self.base_url}{post_data.get('permalink', '')}",
                    'created_at': datetime.fromtimestamp(
                        post_data.get('created_utc', 0)
                    ).isoformat(),
                    'flair': post_data.get('link_flair_text'),
                    'score': post_data.get('score', 0),
                    'awards': post_data.get('total_awards_received', 0)
                })
            
            # Step 6: Generate context summary for AI
            context_summary = self.generate_context_summary(
                all_discussions[0], 
                top_comments
            )
            
            # Step 7: Return comprehensive data
            return {
                'success': True,
                'manga': manga_name,
                'chapter': chapter_num,
                'main_discussion': all_discussions[0],
                'top_comments': top_comments,
                'all_discussions': all_discussions,
                'context_summary': context_summary,
                'scraped_at': datetime.now().isoformat()
            }
            
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': f'Request failed: {str(e)}'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Scraping failed: {str(e)}'
            }
    
    def generate_context_summary(self, main_post: Dict, comments: List[Dict]) -> str:
        """Generate AI-ready context summary"""
        summary = f"Chapter Discussion: {main_post['title']}\n\n"
        
        if main_post.get('description'):
            summary += f"Official Description:\n{main_post['description']}\n\n"
        
        summary += "Community Engagement:\n"
        summary += f"- {main_post['upvotes']} upvotes\n"
        summary += f"- {main_post['comment_count']} comments\n"
        summary += f"- Posted by u/{main_post['author']}\n\n"
        
        if comments:
            summary += "Top Community Reactions:\n"
            for i, comment in enumerate(comments[:10], 1):
                body = comment['body']
                preview = body[:200] + '...' if len(body) > 200 else body
                summary += f"\n{i}. [{comment['score']} points] u/{comment['author']}:\n{preview}\n"
        
        return summary
    
    def scrape_bulk(self, chapters: List[Dict], delay: float = 2.0) -> List[Dict]:
        """
        Scrape multiple chapters with rate limiting
        
        Args:
            chapters: List of dicts with 'manga' and 'chapter' keys
            delay: Delay between requests in seconds
        
        Returns:
            List of scraping results
        """
        results = []
        total = len(chapters)
        
        for i, chapter_info in enumerate(chapters, 1):
            manga = chapter_info.get('manga')
            chapter = chapter_info.get('chapter')
            
            print(f"\nProcessing {i}/{total}: {manga} Ch.{chapter}")
            
            if not manga or not chapter:
                results.append({
                    'manga': manga,
                    'chapter': chapter,
                    'success': False,
                    'error': 'Missing manga or chapter'
                })
                continue
            
            result = self.scrape_chapter(manga, str(chapter))
            results.append(result)
            
            # Rate limiting
            if i < total:
                print(f"Waiting {delay}s before next request...")
                time.sleep(delay)
        
        return results
    
    def save_to_file(self, data: Dict, filename: str):
        """Save scraped data to JSON file"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"\nSaved to: {filename}")


# CLI Usage
if __name__ == "__main__":
    scraper = RedditMangaScraper()
    
    # Single chapter scraping
    if len(sys.argv) == 3:
        manga_name = sys.argv[1]
        chapter_num = sys.argv[2]
        
        print(f"=== Reddit Manga Scraper ===\n")
        result = scraper.scrape_chapter(manga_name, chapter_num)
        
        if result['success']:
            print(f"\n✓ Successfully scraped!")
            print(f"  Title: {result['main_discussion']['title']}")
            print(f"  Upvotes: {result['main_discussion']['upvotes']}")
            print(f"  Comments: {result['main_discussion']['comment_count']}")
            print(f"  Top comments found: {len(result['top_comments'])}")
            
            # Save to file
            filename = f"{manga_name.replace(' ', '_')}_ch{chapter_num}.json"
            scraper.save_to_file(result, filename)
            
            # Print context summary
            print("\n=== Context Summary for AI ===")
            print(result['context_summary'])
        else:
            print(f"\n✗ Failed: {result.get('message', result.get('error'))}")
    
    # Bulk scraping example
    elif len(sys.argv) == 2 and sys.argv[1] == '--bulk':
        chapters = [
            {'manga': 'One Piece', 'chapter': '1095'},
            {'manga': 'Jujutsu Kaisen', 'chapter': '236'},
            {'manga': 'Chainsaw Man', 'chapter': '150'}
        ]
        
        print("=== Bulk Reddit Scraping ===\n")
        results = scraper.scrape_bulk(chapters)
        
        scraper.save_to_file({
            'total_processed': len(results),
            'results': results
        }, 'bulk_scrape_results.json')
    
    else:
        print("Usage:")
        print("  Single: python reddit_scraper.py 'Manga Name' 123")
        print("  Bulk:   python reddit_scraper.py --bulk")
        print("\nExamples:")
        print("  python reddit_scraper.py 'One Piece' 1095")
        print("  python reddit_scraper.py 'Jujutsu Kaisen' 236")