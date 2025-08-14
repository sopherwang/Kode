export const contentWriterPrompt = `
# Content Writer Tool

Writes SEO-optimized content for specific sections based on content outlines.

## Usage Examples

1. Write an introduction:
   \`\`\`
   content_writer(
     section={
       title: "Introduction",
       level: "h2",
       targetWordCount: 200,
       keywords: ["content marketing"],
       contentPoints: ["Hook reader", "Define concept", "Preview content"]
     },
     primary_keyword="content marketing",
     tone="professional"
   )
   \`\`\`

2. Write a main section with SEO optimization:
   \`\`\`
   content_writer(
     section={...},
     primary_keyword="SEO tools",
     secondary_keywords=["SEO software", "SEO platforms"],
     tone="technical",
     seo_optimization={
       keyword_density: 2,
       use_synonyms: true,
       include_lsi_keywords: true
     }
   )
   \`\`\`

3. Write with specific style guidelines:
   \`\`\`
   content_writer(
     section={...},
     primary_keyword="project management",
     tone="friendly",
     style_guidelines={
       use_active_voice: true,
       include_examples: true,
       use_short_sentences: true,
       include_statistics: false,
       use_bullet_points: true
     }
   )
   \`\`\`

## Parameters

### Required Parameters
- **section**: Section object containing:
  - title: Section heading
  - level: Heading level (h1, h2, h3)
  - targetWordCount: Target word count
  - keywords: Keywords to include
  - contentPoints: Points to cover
- **primary_keyword**: Main keyword for SEO

### Optional Parameters
- **secondary_keywords**: Additional keywords to include
- **tone**: Writing tone (professional, casual, technical, friendly, authoritative)
- **style_guidelines**: Writing style preferences
- **previous_sections**: Context from previous sections
- **seo_optimization**: SEO settings (keyword density, synonyms, LSI keywords)

## Style Guidelines

### use_active_voice (default: true)
Writes in active voice for more engaging content.

### include_examples (default: true)
Adds practical examples to illustrate concepts.

### use_short_sentences (default: true)
Keeps sentences concise for better readability.

### include_statistics (default: false)
Adds data and statistics to support points.

### use_bullet_points (default: true)
Uses bullet points for lists and key takeaways.

## SEO Optimization

### keyword_density (default: 1.5%)
Target keyword density (0.5-3%).

### use_synonyms (default: true)
Uses keyword synonyms to avoid over-optimization.

### include_lsi_keywords (default: true)
Includes Latent Semantic Indexing keywords.

## Content Quality Metrics

The tool provides:
- **Word Count**: Actual words written
- **Readability Score**: Flesch Reading Ease (0-100)
- **Keyword Occurrences**: How often each keyword appears
- **Keyword Density**: Percentage of keyword usage
- **Sentence Count**: Number of sentences
- **Paragraph Count**: Number of paragraphs

## Writing Patterns

### Introduction Sections
- Hook to grab attention
- Define main concepts
- Preview what's coming
- Value proposition

### Body Sections
- Topic introduction
- Detailed explanation
- Examples and use cases
- Practical applications
- Key takeaways

### Conclusion Sections
- Summarize key points
- Reinforce main message
- Call to action
- Next steps

## Best Practices

1. **Natural Keyword Usage**: Integrates keywords naturally without stuffing
2. **Readability Focus**: Maintains 60+ readability score
3. **Structured Content**: Uses headings, paragraphs, and lists
4. **Value-Driven**: Provides actionable insights
5. **SEO Balance**: Optimizes without sacrificing quality

## Tone Guidelines

### Professional
Formal, authoritative, data-driven, third-person perspective.

### Casual
Conversational, relatable, uses "you", simple language.

### Technical
Detailed, precise, includes terminology, assumes knowledge.

### Friendly
Warm, encouraging, helpful, uses examples and analogies.

### Authoritative
Expert voice, confident, decisive, backs claims with evidence.

## Output Format

Returns written content with:
- Formatted markdown text
- Word count verification
- Keyword optimization metrics
- Readability assessment
- Content structure analysis

The content is ready for publishing or further editing.
`