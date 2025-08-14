# SEO Content System for AI Call

A comprehensive SEO content generation system built on Kode's tool infrastructure for creating optimized content about AI Call's translation services.

## System Components

### 1. Core Tools
- **GoogleSearchTool**: Searches Google for current SERP data
- **ContentCrawlerTool**: Extracts content from competitor pages
- **SerpAnalyzerTool**: Analyzes search results for SEO insights
- **ContentOutlineGeneratorTool**: Creates SEO-optimized outlines
- **ContentWriterTool**: Generates actual content sections

### 2. Configuration Files
- **system-prompt.md**: Complete prompt for AI to follow
- **ai-call-config.json**: Product information and SEO settings

## Setup Requirements

### Environment Variables
```bash
export SERPER_API_KEY="your-serper-api-key"
```

Get a free API key at https://serper.dev (2,500 searches/month free)

## Usage Workflow

### Step 1: Information Collection
Start by providing:
- **Primary keyword**: Main topic to target
- **Secondary keywords**: Supporting keywords (optional)
- **Brief description**: Article angle and focus
- **Desired word count**: Target length (500-5000 words)

### Step 2: SERP Analysis
```javascript
// Analyze search results
serp_analyzer(
  keyword="phone translation app",
  num_results=10,
  analyze_content=true,
  country="us"
)
```

This provides:
- Search intent analysis
- Common headings and topics
- URL patterns
- Average word counts
- Title formats

### Step 3: Generate Outline
```javascript
// Create content outline
content_outline_generator(
  primary_keyword="phone translation app",
  secondary_keywords=["real-time translation", "multilingual calls"],
  serp_analysis={...}, // From Step 2
  target_word_count=2000,
  content_type="guide",
  tone="professional"
)
```

Generates:
- SEO-optimized title
- Section structure
- Word count distribution
- Keyword placement strategy

### Step 4: Integrate AI Call Content
Enhance outline with product information:
- Add AI Call-specific sections
- Include features naturally
- Maintain 20% product content ratio

### Step 5: Write Content
```javascript
// Write each section
content_writer(
  section={
    title: "Introduction to Phone Translation",
    level: "h2",
    targetWordCount: 200,
    keywords: ["phone translation", "AI Call"],
    contentPoints: [...]
  },
  primary_keyword="phone translation app",
  tone="professional",
  style_guidelines={
    use_active_voice: true,
    include_examples: true
  }
)
```

### Step 6: Generate Metadata
Create SEO elements:
- **Meta Title**: 50-60 characters with keyword
- **Meta Description**: 150-160 characters with CTA
- **URL Slug**: SEO-friendly path

## Content Quality Guidelines

### SEO Best Practices
- **Keyword Density**: 1-2%
- **Readability Score**: 60+ (Flesch)
- **Header Structure**: Proper H1 > H2 > H3 hierarchy
- **Internal Linking**: Note opportunities
- **LSI Keywords**: Include naturally

### Writing Style
- **Tone**: Helpful, practical, straightforward
- **Voice**: Active, solution-focused
- **Structure**: Short paragraphs, clear transitions
- **Examples**: Real-world applications

### AI Call Integration
- **Natural Placement**: Integrate features contextually
- **Value First**: Educational content before promotion
- **Use Cases**: Relevant scenarios
- **Subtle CTAs**: Guide without pushing

## Example Session

```
User: I need an article about "best translation apps for international calls"