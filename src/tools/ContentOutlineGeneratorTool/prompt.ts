export const contentOutlinePrompt = `
# Content Outline Generator Tool

Generates SEO-optimized content outlines based on keyword research and SERP analysis.

## Usage Examples

1. Basic outline generation:
   \`\`\`
   content_outline_generator(
     primary_keyword="content marketing",
     target_word_count=2000,
     content_type="guide"
   )
   \`\`\`

2. With SERP analysis data:
   \`\`\`
   content_outline_generator(
     primary_keyword="SEO tools",
     secondary_keywords=["SEO software", "SEO platforms"],
     serp_analysis={...}, // From SERP Analyzer Tool
     target_word_count=3000,
     content_type="comparison"
   )
   \`\`\`

3. Product-focused content:
   \`\`\`
   content_outline_generator(
     primary_keyword="project management",
     target_word_count=2500,
     content_type="blog",
     tone="professional",
     include_product_section=true
   )
   \`\`\`

## Parameters

- **primary_keyword** (required): Main keyword for SEO optimization
- **secondary_keywords** (optional): Additional keywords to include
- **serp_analysis** (optional): Data from SERP Analyzer Tool to inform outline
- **target_word_count** (required): Target length (500-10000 words)
- **content_type** (optional): Type of content - blog, guide, listicle, how-to, comparison, review (default: "blog")
- **tone** (optional): Writing tone - professional, casual, technical, friendly, authoritative (default: "professional")
- **include_product_section** (optional): Add product/service promotion section (default: false)

## Outline Components

### 1. Metadata
- SEO-optimized title
- Meta title (60 characters)
- Meta description (160 characters)
- Keywords mapping

### 2. Content Structure
- Introduction section
- Main content sections (3-8 based on word count)
- Subsections for longer articles
- Conclusion with CTAs

### 3. Section Details
Each section includes:
- Title and heading level (H2/H3)
- Description of content
- Target word count
- Keywords to include
- Content points to cover

### 4. Content Balance
- 70% SERP-based content (when analysis provided)
- 30% unique/differentiated content
- Product content ~20% (when requested)

## Content Types

### Blog
Standard blog post format with introduction, body sections, and conclusion.

### Guide
Comprehensive guide with detailed sections and step-by-step instructions.

### Listicle
Numbered list format with consistent item structure.

### How-To
Tutorial format with clear steps and instructions.

### Comparison
Side-by-side analysis of options with pros/cons.

### Review
In-depth analysis with ratings and recommendations.

## Best Practices

1. **Keyword Distribution**: Primary keyword in title, H2s, and throughout content
2. **Word Count Allocation**: 10% intro, 82% body, 8% conclusion
3. **Heading Hierarchy**: Clear H2 > H3 structure
4. **Content Points**: 3-5 specific points per section
5. **Read Time**: Calculated at 225 words per minute

## Output Format

The tool generates a complete outline with:
- Title and meta information
- Section breakdown with word counts
- Keywords for each section
- Content points to cover
- Total word count verification
- Estimated reading time

This outline serves as a blueprint for the Content Writer Tool to generate the actual article.
`