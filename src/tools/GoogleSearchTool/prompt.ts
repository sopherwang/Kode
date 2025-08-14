export const googleSearchPrompt = `
# Google Search Tool

Use this tool to search Google for current information from the web. This is useful when you need:
- Recent news or events
- Current documentation or tutorials
- Product information or reviews
- General web research
- Finding official websites or resources

## Usage Examples

1. Basic search:
   \`\`\`
   google_search(query="TypeScript best practices 2024")
   \`\`\`

2. Localized search:
   \`\`\`
   google_search(query="weather forecast", search_country="uk")
   \`\`\`

3. More results:
   \`\`\`
   google_search(query="React hooks tutorial", num_results=5)
   \`\`\`

## Parameters

- **query** (required): The search query string
- **search_country** (optional): Country code for localized results (default: "us")
  - Examples: "us" (United States), "uk" (United Kingdom), "fr" (France), "de" (Germany), "jp" (Japan)
- **num_results** (optional): Number of results to return, between 1-10 (default: 3)

## Important Notes

- This tool requires a SERPER_API_KEY environment variable to be set
- Free API keys are available at https://serper.dev
- The tool returns organic search results with title, link, and snippet
- Results are ranked by relevance according to Google's algorithm
- Use this when you need current information that may not be in your training data

## Response Format

The tool returns an array of search results, each containing:
- **title**: The page title
- **link**: The URL of the page
- **snippet**: A brief description or excerpt from the page
- **position**: The ranking position in search results

Always cite sources when using information from search results by including the URL.
`