# Content Crawler Tool

A tool that fetches and extracts text content from web pages, with HTML structure analysis capabilities.

## Features

- **Text Extraction**: Extracts clean text content from HTML pages
- **HTML Analysis**: Counts important HTML tags (h1, h2, p, div, span)
- **Smart Retries**: Automatically retries failed requests with delays
- **Content Cleaning**: Removes scripts, styles, and extra whitespace
- **Error Handling**: Gracefully handles network errors and invalid pages

## Usage

The tool is automatically available in Kode conversations:

```
User: Crawl the content from https://docs.python.org/3/tutorial/
```

The AI can then use the extracted content to answer questions about the page.

## Parameters

- **url** (required): The full URL to crawl
- **extract_tags** (optional): Whether to count HTML tags (default: true)
- **max_retries** (optional): Number of retry attempts (0-3, default: 2)

## Technical Details

### HTML Parsing
Uses Cheerio for efficient server-side HTML parsing and manipulation.

### Content Cleaning
1. Removes `<script>`, `<style>`, and `<noscript>` elements
2. Extracts text content
3. Normalizes whitespace
4. Returns clean, readable text

### Retry Logic
- Waits 10 seconds between retry attempts
- Won't retry on 4xx client errors
- Maximum of 3 retry attempts

### User Agent
Uses a standard Chrome user agent for better compatibility with websites.

## Limitations

- **Static HTML Only**: Doesn't execute JavaScript, so dynamic content may not be captured
- **Rate Limiting**: Some websites may block or rate-limit automated requests
- **Large Pages**: Very large pages may take longer to process
- **Authentication**: Cannot access pages requiring login

## Use Cases

1. **Documentation Reading**: Extract content from documentation sites
2. **Article Analysis**: Get full text from news articles or blog posts
3. **Research**: Gather information from multiple web sources
4. **Content Verification**: Check if a webpage contains specific information
5. **SEO Analysis**: Analyze HTML structure and content organization

## Example Output

```
Successfully crawled: https://example.com
Status Code: 200
Content Length: 5432 characters

HTML Structure:
- H1 tags: 1
- H2 tags: 3
- Paragraphs: 12
- Divs: 45
- Spans: 23

Content Preview:
Welcome to Example.com. This is a sample webpage...

Full Content (5432 characters):
[Full extracted text content]
```

## Error Handling

The tool handles various error scenarios:
- Network timeouts
- Invalid URLs
- 404 and other HTTP errors
- Malformed HTML
- Connection failures

Failed crawls return an error status with details about what went wrong.