export const serpAnalyzerPrompt = `
# SERP Analyzer Tool

Analyzes search engine results pages (SERP) to extract SEO insights for content optimization.

## Usage Examples

1. Basic SERP analysis:
   \`\`\`
   serp_analyzer(keyword="content marketing strategies")
   \`\`\`

2. Quick analysis without content crawling:
   \`\`\`
   serp_analyzer(keyword="SEO tools", analyze_content=false)
   \`\`\`

3. Localized search analysis:
   \`\`\`
   serp_analyzer(keyword="digital marketing", country="uk", num_results=10)
   \`\`\`

## Parameters

- **keyword** (required): The primary keyword to analyze
- **num_results** (optional): Number of results to analyze, 3-10 (default: 10)
- **analyze_content** (optional): Whether to crawl and analyze page content (default: true)
- **country** (optional): Country code for localized search (default: "us")

## Analysis Components

### 1. Search Intent Analysis
- Determines whether searches are informational, transactional, navigational, or commercial
- Provides confidence score and indicators

### 2. Title Pattern Analysis
- Common words used in titles
- Average title length
- Common title formats (How-to, Listicles, Guides, etc.)

### 3. URL Structure Analysis
- Common URL paths and patterns
- Average URL depth
- File extensions used

### 4. Content Metrics
- Average word count across top results
- Minimum and maximum word counts
- Content length recommendations

### 5. Heading Analysis
- Common H1, H2, and H3 tags
- Topic patterns and structures
- Content organization insights

### 6. Top Results Overview
- Position, title, and URL of each result
- Word count per page (if content analyzed)
- Key topics covered

## Use Cases

1. **Content Planning**: Understand what content ranks for target keywords
2. **Competitive Analysis**: See what competitors are doing successfully
3. **Content Gap Analysis**: Identify topics competitors cover that you don't
4. **Search Intent Matching**: Ensure content matches user search intent
5. **Content Length Optimization**: Determine optimal word count for ranking

## Important Notes

- Content analysis is limited to top 5 results for performance
- Requires SERPER_API_KEY for Google searches
- Some sites may block crawling, affecting content analysis
- Analysis provides insights but should be combined with other SEO factors
`