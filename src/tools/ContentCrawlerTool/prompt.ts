export const contentCrawlerPrompt = `
# Content Crawler Tool

Use this tool to fetch and extract text content from web pages. This is useful for:
- Reading documentation from websites
- Extracting article content
- Analyzing HTML structure
- Gathering information from web pages
- Processing web content for analysis

## Usage Examples

1. Basic content extraction:
   \`\`\`
   content_crawler(url="https://example.com/article")
   \`\`\`

2. Without tag counting (faster):
   \`\`\`
   content_crawler(url="https://docs.python.org/3/", extract_tags=false)
   \`\`\`

3. With custom retry settings:
   \`\`\`
   content_crawler(url="https://api-docs.example.com", max_retries=3)
   \`\`\`

## Parameters

- **url** (required): The full URL to crawl (must include http:// or https://)
- **extract_tags** (optional): Whether to count HTML tags like h1, h2, p, div, span (default: true)
- **max_retries** (optional): Number of retry attempts on failure, 0-3 (default: 2)

## Features

- **Smart Retries**: Automatically retries failed requests with delays
- **Content Cleaning**: Removes scripts, styles, and extra whitespace
- **HTML Analysis**: Counts important HTML elements for structure understanding
- **Error Handling**: Gracefully handles network errors and invalid pages
- **User Agent**: Uses a standard browser user agent for better compatibility

## Response Format

The tool returns:
- **content**: Cleaned text content from the page
- **tagCounts**: Object with counts of h1, h2, p, div, span tags (if extract_tags=true)
- **url**: The URL that was crawled
- **statusCode**: HTTP status code
- **contentLength**: Length of extracted text content
- **success**: Whether the crawl was successful

## Important Notes

- The tool respects standard HTTP headers and follows redirects
- Large pages may take longer to process
- JavaScript-rendered content may not be fully captured (static HTML only)
- Retries include a 10-second delay to respect rate limits
- Some websites may block automated crawling

## Use Cases

1. **Documentation Reading**: Extract content from documentation sites
2. **Article Analysis**: Get full text from news articles or blog posts
3. **Research**: Gather information from multiple web sources
4. **Content Verification**: Check if a webpage contains specific information
5. **HTML Structure Analysis**: Understand the organization of a webpage
`