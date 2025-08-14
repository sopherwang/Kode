import React from 'react'
import { Box, Text } from 'ink'
import { z } from 'zod'
import { Tool } from '../../Tool'
import { ToolUseContext } from '../../query'
import { ToolCallEvent } from '../../types/ToolCallEvent'

const inputSchema = z.object({
  primary_keyword: z.string().describe('Primary keyword for SEO optimization'),
  secondary_keywords: z.array(z.string()).default([]).describe('Secondary keywords to include'),
  serp_analysis: z.object({
    searchIntent: z.object({
      type: z.enum(['informational', 'transactional', 'navigational', 'commercial']),
      confidence: z.number()
    }).optional(),
    commonHeadings: z.object({
      h1: z.array(z.string()),
      h2: z.array(z.string()),
      h3: z.array(z.string())
    }).optional(),
    contentMetrics: z.object({
      avgWordCount: z.number(),
      minWordCount: z.number(),
      maxWordCount: z.number()
    }).optional(),
    titlePatterns: z.object({
      commonFormats: z.array(z.string())
    }).optional()
  }).optional().describe('SERP analysis data to inform outline creation'),
  target_word_count: z.number().min(500).max(10000).describe('Target word count for the article'),
  content_type: z.enum(['blog', 'guide', 'listicle', 'how-to', 'comparison', 'review'])
    .default('blog').describe('Type of content to create'),
  tone: z.enum(['professional', 'casual', 'technical', 'friendly', 'authoritative'])
    .default('professional').describe('Tone of the content'),
  include_product_section: z.boolean().default(false).describe('Whether to include product/service promotion section')
})

type ContentOutlineInput = z.infer<typeof inputSchema>

interface OutlineSection {
  level: 'h1' | 'h2' | 'h3'
  title: string
  description: string
  targetWordCount: number
  keywords: string[]
  contentPoints: string[]
}

interface ContentOutline {
  title: string
  metaTitle: string
  metaDescription: string
  primaryKeyword: string
  secondaryKeywords: string[]
  targetWordCount: number
  estimatedReadTime: number
  sections: OutlineSection[]
  contentType: string
  tone: string
  serpBasedContent: number // Percentage
  uniqueContent: number // Percentage
}

export class ContentOutlineGeneratorTool extends Tool {
  name = 'content_outline_generator'
  description = 'Generate SEO-optimized content outlines based on SERP analysis and keyword research'
  inputSchema = inputSchema

  needsPermissions(input: unknown): boolean {
    // No permissions needed as this is a generation tool
    return false
  }

  private calculateReadTime(wordCount: number): number {
    // Average reading speed is 200-250 words per minute
    return Math.ceil(wordCount / 225)
  }

  private generateMetaTitle(keyword: string, contentType: string): string {
    const year = new Date().getFullYear()
    const templates = {
      'blog': [
        `${keyword}: Complete Guide for ${year}`,
        `Everything You Need to Know About ${keyword}`,
        `${keyword} - Expert Tips and Strategies`
      ],
      'guide': [
        `Ultimate ${keyword} Guide (${year} Edition)`,
        `Complete ${keyword} Guide: Step-by-Step`,
        `Master ${keyword}: Comprehensive Guide`
      ],
      'listicle': [
        `Top 10 ${keyword} Tips for ${year}`,
        `15 Best ${keyword} Strategies That Work`,
        `${keyword}: 20 Things You Need to Know`
      ],
      'how-to': [
        `How to ${keyword}: Step-by-Step Guide`,
        `${keyword} Tutorial: Complete Walkthrough`,
        `Learn ${keyword} in 10 Easy Steps`
      ],
      'comparison': [
        `${keyword} Comparison: Find the Best Option`,
        `${keyword} vs Alternatives: Complete Analysis`,
        `Best ${keyword} Options Compared (${year})`
      ],
      'review': [
        `${keyword} Review: Honest Analysis ${year}`,
        `Is ${keyword} Worth It? In-Depth Review`,
        `${keyword}: Pros, Cons & Verdict`
      ]
    }
    
    const templates_list = templates[contentType] || templates['blog']
    return templates_list[Math.floor(Math.random() * templates_list.length)]
  }

  private generateMetaDescription(keyword: string, sections: number): string {
    const templates = [
      `Discover everything about ${keyword} in this comprehensive guide. We cover ${sections} key topics to help you master ${keyword} quickly and effectively.`,
      `Learn ${keyword} with our detailed guide covering ${sections} essential sections. Get expert tips, strategies, and actionable insights.`,
      `Complete ${keyword} resource with ${sections} in-depth sections. Find answers to all your questions and become an expert.`
    ]
    
    return templates[Math.floor(Math.random() * templates.length)].substring(0, 160)
  }

  private distributeWordCount(totalWords: number, sectionCount: number): number[] {
    // Introduction gets 10%, conclusion gets 8%, rest distributed
    const introWords = Math.round(totalWords * 0.10)
    const conclusionWords = Math.round(totalWords * 0.08)
    const remainingWords = totalWords - introWords - conclusionWords
    
    // Distribute remaining words among main sections
    const mainSections = sectionCount - 2 // Excluding intro and conclusion
    const wordsPerSection = Math.round(remainingWords / mainSections)
    
    const distribution = [introWords]
    for (let i = 0; i < mainSections; i++) {
      // Add some variation (-10% to +10%)
      const variation = Math.round(wordsPerSection * (Math.random() * 0.2 - 0.1))
      distribution.push(wordsPerSection + variation)
    }
    distribution.push(conclusionWords)
    
    return distribution
  }

  private generateSections(input: ContentOutlineInput): OutlineSection[] {
    const sections: OutlineSection[] = []
    const { primary_keyword, secondary_keywords, serp_analysis, target_word_count } = input
    
    // Determine number of main sections based on word count
    const mainSectionCount = Math.min(Math.max(Math.floor(target_word_count / 400), 3), 8)
    const totalSections = mainSectionCount + 2 // +2 for intro and conclusion
    
    const wordDistribution = this.distributeWordCount(target_word_count, totalSections)
    
    // 1. Introduction Section
    sections.push({
      level: 'h2',
      title: 'Introduction',
      description: `Introduce the topic of ${primary_keyword}, explain its importance, and provide an overview of what the article will cover.`,
      targetWordCount: wordDistribution[0],
      keywords: [primary_keyword, ...secondary_keywords.slice(0, 2)],
      contentPoints: [
        'Hook the reader with a compelling opening',
        'Define the main concept',
        'Explain why this topic matters',
        'Preview what will be covered'
      ]
    })
    
    // 2. Generate main sections based on SERP analysis or defaults
    const sectionTopics = this.generateMainTopics(primary_keyword, mainSectionCount, serp_analysis)
    
    for (let i = 0; i < mainSectionCount; i++) {
      const topic = sectionTopics[i]
      const isProductSection = input.include_product_section && i === mainSectionCount - 1
      
      sections.push({
        level: 'h2',
        title: isProductSection ? `How [Product/Service] Helps with ${primary_keyword}` : topic.title,
        description: isProductSection 
          ? `Explain how your product or service addresses ${primary_keyword} challenges and provides value.`
          : topic.description,
        targetWordCount: wordDistribution[i + 1],
        keywords: topic.keywords,
        contentPoints: isProductSection 
          ? [
              'Introduce the product/service naturally',
              'Explain specific features that help',
              'Provide use cases or examples',
              'Include testimonials or case studies if available'
            ]
          : topic.points
      })
      
      // Add subsections for longer sections
      if (wordDistribution[i + 1] > 600) {
        const subTopics = this.generateSubTopics(topic.title, 2)
        for (const subTopic of subTopics) {
          sections.push({
            level: 'h3',
            title: subTopic.title,
            description: subTopic.description,
            targetWordCount: Math.round(wordDistribution[i + 1] / 3),
            keywords: subTopic.keywords,
            contentPoints: subTopic.points
          })
        }
      }
    }
    
    // 3. Conclusion Section
    sections.push({
      level: 'h2',
      title: 'Conclusion',
      description: `Summarize the key points about ${primary_keyword} and provide actionable next steps for the reader.`,
      targetWordCount: wordDistribution[wordDistribution.length - 1],
      keywords: [primary_keyword],
      contentPoints: [
        'Recap the main points covered',
        'Reinforce the key takeaways',
        'Provide clear action steps',
        'Include a call-to-action if appropriate'
      ]
    })
    
    return sections
  }

  private generateMainTopics(keyword: string, count: number, serpAnalysis?: any): any[] {
    const topics = []
    
    // If we have SERP analysis, use common headings as inspiration
    if (serpAnalysis?.commonHeadings?.h2 && serpAnalysis.commonHeadings.h2.length > 0) {
      const serpHeadings = serpAnalysis.commonHeadings.h2
      
      // Use 70% SERP-based topics
      const serpTopicCount = Math.ceil(count * 0.7)
      for (let i = 0; i < serpTopicCount && i < serpHeadings.length; i++) {
        topics.push({
          title: this.refineHeading(serpHeadings[i], keyword),
          description: `Detailed explanation of ${serpHeadings[i]} in the context of ${keyword}`,
          keywords: [keyword, ...this.extractKeywordsFromHeading(serpHeadings[i])],
          points: this.generateContentPoints(serpHeadings[i], keyword)
        })
      }
    }
    
    // Fill remaining with unique topics (30% unique content)
    const uniqueTopics = this.generateUniqueTopics(keyword, count - topics.length)
    topics.push(...uniqueTopics)
    
    return topics
  }

  private refineHeading(heading: string, keyword: string): string {
    // Clean and improve heading
    let refined = heading.charAt(0).toUpperCase() + heading.slice(1)
    
    // Add keyword if not present
    if (!refined.toLowerCase().includes(keyword.toLowerCase())) {
      refined = `${refined} for ${keyword}`
    }
    
    return refined
  }

  private extractKeywordsFromHeading(heading: string): string[] {
    const words = heading.toLowerCase().split(/\s+/)
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with'])
    
    return words
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 3)
  }

  private generateContentPoints(topic: string, keyword: string): string[] {
    const templates = [
      `Define and explain ${topic}`,
      `Provide examples and use cases`,
      `Share best practices and tips`,
      `Address common challenges or misconceptions`,
      `Include relevant statistics or data`
    ]
    
    return templates.slice(0, 4)
  }

  private generateUniqueTopics(keyword: string, count: number): any[] {
    const uniqueTemplates = [
      {
        title: `Common Mistakes to Avoid with ${keyword}`,
        description: 'Highlight pitfalls and how to avoid them',
        points: ['List common errors', 'Explain why they happen', 'Provide solutions', 'Share prevention tips']
      },
      {
        title: `Advanced ${keyword} Strategies`,
        description: 'Share expert-level techniques and approaches',
        points: ['Introduce advanced concepts', 'Provide step-by-step guidance', 'Include real examples', 'Measure success']
      },
      {
        title: `${keyword} Tools and Resources`,
        description: 'Recommend helpful tools and resources',
        points: ['List essential tools', 'Explain how to use them', 'Compare options', 'Provide links']
      },
      {
        title: `Future of ${keyword}`,
        description: 'Discuss trends and future developments',
        points: ['Current trends', 'Emerging technologies', 'Predictions', 'How to prepare']
      },
      {
        title: `${keyword} Case Studies`,
        description: 'Real-world examples and success stories',
        points: ['Present case studies', 'Analyze what worked', 'Extract lessons', 'Apply to reader context']
      }
    ]
    
    return uniqueTemplates.slice(0, count).map(template => ({
      ...template,
      keywords: [keyword, ...this.extractKeywordsFromHeading(template.title)]
    }))
  }

  private generateSubTopics(parentTopic: string, count: number): any[] {
    const subTopics = []
    
    for (let i = 0; i < count; i++) {
      subTopics.push({
        title: `${parentTopic} - Part ${i + 1}`,
        description: `Detailed exploration of specific aspects`,
        keywords: this.extractKeywordsFromHeading(parentTopic),
        points: ['Specific details', 'Examples', 'Implementation tips']
      })
    }
    
    return subTopics
  }

  async *call(
    input: ContentOutlineInput,
    context: ToolUseContext
  ): AsyncGenerator<ToolCallEvent> {
    yield {
      type: 'progress',
      message: `Generating content outline for "${input.primary_keyword}"...`
    }

    try {
      // Generate sections
      const sections = this.generateSections(input)
      
      // Calculate SERP-based vs unique content ratio
      const serpBasedContent = input.serp_analysis ? 70 : 0
      const uniqueContent = input.serp_analysis ? 30 : 100
      
      // Create the outline
      const outline: ContentOutline = {
        title: this.generateMetaTitle(input.primary_keyword, input.content_type),
        metaTitle: this.generateMetaTitle(input.primary_keyword, input.content_type).substring(0, 60),
        metaDescription: this.generateMetaDescription(input.primary_keyword, sections.filter(s => s.level === 'h2').length),
        primaryKeyword: input.primary_keyword,
        secondaryKeywords: input.secondary_keywords,
        targetWordCount: input.target_word_count,
        estimatedReadTime: this.calculateReadTime(input.target_word_count),
        sections,
        contentType: input.content_type,
        tone: input.tone,
        serpBasedContent,
        uniqueContent
      }
      
      yield {
        type: 'result',
        result: outline
      }
    } catch (error) {
      if (context.abortSignal.aborted) {
        throw new Error('Outline generation cancelled')
      }
      throw error
    }
  }

  renderResultForAssistant(input: unknown, result: unknown): string {
    const outline = result as ContentOutline
    
    let output = `# Content Outline: ${outline.title}\n\n`
    
    // Metadata
    output += `## Metadata\n`
    output += `- **Meta Title**: ${outline.metaTitle}\n`
    output += `- **Meta Description**: ${outline.metaDescription}\n`
    output += `- **Primary Keyword**: ${outline.primaryKeyword}\n`
    if (outline.secondaryKeywords.length > 0) {
      output += `- **Secondary Keywords**: ${outline.secondaryKeywords.join(', ')}\n`
    }
    output += `- **Target Word Count**: ${outline.targetWordCount}\n`
    output += `- **Estimated Read Time**: ${outline.estimatedReadTime} minutes\n`
    output += `- **Content Type**: ${outline.contentType}\n`
    output += `- **Tone**: ${outline.tone}\n`
    output += `- **SERP-Based Content**: ${outline.serpBasedContent}%\n`
    output += `- **Unique Content**: ${outline.uniqueContent}%\n\n`
    
    // Sections
    output += `## Content Structure\n\n`
    
    let totalWords = 0
    for (const section of outline.sections) {
      const indent = section.level === 'h3' ? '  ' : ''
      const marker = section.level === 'h2' ? '##' : '###'
      
      output += `${indent}${marker} ${section.title} (${section.targetWordCount} words)\n`
      output += `${indent}**Description**: ${section.description}\n`
      output += `${indent}**Keywords**: ${section.keywords.join(', ')}\n`
      output += `${indent}**Content Points**:\n`
      for (const point of section.contentPoints) {
        output += `${indent}- ${point}\n`
      }
      output += '\n'
      
      totalWords += section.targetWordCount
    }
    
    output += `## Summary\n`
    output += `- **Total Sections**: ${outline.sections.filter(s => s.level === 'h2').length}\n`
    output += `- **Total Subsections**: ${outline.sections.filter(s => s.level === 'h3').length}\n`
    output += `- **Total Word Count**: ${totalWords}\n`
    
    return output
  }

  renderResultForUser(result: unknown): React.ReactElement {
    const outline = result as ContentOutline
    
    return (
      <Box flexDirection="column">
        <Text color="green" bold>Content Outline Generated</Text>
        <Text> </Text>
        
        <Box flexDirection="column">
          <Text color="yellow" bold>{outline.title}</Text>
          <Text color="gray">{outline.metaDescription}</Text>
        </Box>
        <Text> </Text>
        
        <Box flexDirection="column">
          <Text color="cyan" bold>Structure:</Text>
          <Text>  Target: {outline.targetWordCount} words ({outline.estimatedReadTime} min read)</Text>
          <Text>  Type: {outline.contentType} ({outline.tone} tone)</Text>
          <Text>  Content Mix: {outline.serpBasedContent}% SERP / {outline.uniqueContent}% Unique</Text>
        </Box>
        <Text> </Text>
        
        <Box flexDirection="column">
          <Text color="cyan" bold>Sections:</Text>
          {outline.sections.filter(s => s.level === 'h2').map((section, i) => (
            <Box key={i} flexDirection="column" marginLeft={2}>
              <Text>
                {i + 1}. {section.title} ({section.targetWordCount} words)
              </Text>
            </Box>
          ))}
        </Box>
      </Box>
    )
  }
}