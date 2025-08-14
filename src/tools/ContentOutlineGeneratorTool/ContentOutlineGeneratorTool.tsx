import React from 'react'
import { Box, Text } from 'ink'
import { z } from 'zod'
import { Tool } from '../../Tool'
import { ToolUseContext } from '../../Tool'
import { contentOutlinePrompt } from './prompt'

const inputSchema = z.object({
  primary_keyword: z.string().describe('Primary keyword for SEO optimization'),
  secondary_keywords: z.array(z.string()).default([]).describe('Secondary keywords to include'),
  target_word_count: z.number().min(500).max(10000).describe('Target word count for the article'),
  content_type: z.enum(['blog', 'guide', 'listicle', 'how-to', 'comparison', 'review'])
    .default('blog').describe('Type of content to create'),
  tone: z.enum(['professional', 'casual', 'technical', 'friendly', 'authoritative'])
    .default('professional').describe('Tone of the content')
})

type ContentOutlineInput = z.infer<typeof inputSchema>

interface OutlineSection {
  level: 'h1' | 'h2' | 'h3'
  title: string
  description: string
  targetWordCount: number
  keywords: string[]
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
}

const DESCRIPTION = 'Generate SEO-optimized content outlines based on keywords and target parameters'

function calculateReadTime(wordCount: number): number {
  return Math.ceil(wordCount / 225)
}

function generateMetaTitle(keyword: string, contentType: string): string {
  const year = new Date().getFullYear()
  const templates: Record<string, string[]> = {
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
      `${keyword} Comparison: Complete Analysis`,
      `${keyword} vs Alternatives: Which is Best?`,
      `Comparing ${keyword} Options: Full Guide`
    ],
    'review': [
      `${keyword} Review: Honest Assessment`,
      `Is ${keyword} Worth It? Complete Review`,
      `${keyword} Review ${year}: Pros and Cons`
    ]
  }
  
  const typeTemplates = templates[contentType] || templates['blog']
  return typeTemplates[0]
}

function generateMetaDescription(keyword: string, contentType: string): string {
  return `Discover everything about ${keyword} in this comprehensive ${contentType}. Expert insights, practical tips, and actionable strategies to help you succeed.`
}

function generateSections(keyword: string, targetWordCount: number, secondaryKeywords: string[]): OutlineSection[] {
  const sections: OutlineSection[] = []
  const sectionCount = Math.max(3, Math.min(8, Math.floor(targetWordCount / 300)))
  const wordsPerSection = Math.floor(targetWordCount / (sectionCount + 2)) // +2 for intro and conclusion
  
  // Introduction
  sections.push({
    level: 'h2',
    title: 'Introduction',
    description: `Introduce ${keyword} and set expectations for the article`,
    targetWordCount: wordsPerSection,
    keywords: [keyword]
  })
  
  // Main sections
  const sectionTopics = [
    `What is ${keyword}?`,
    `Benefits of ${keyword}`,
    `How ${keyword} Works`,
    `Best Practices for ${keyword}`,
    `Common Mistakes with ${keyword}`,
    `${keyword} Tools and Resources`,
    `Advanced ${keyword} Strategies`,
    `${keyword} Case Studies`
  ]
  
  for (let i = 0; i < sectionCount && i < sectionTopics.length; i++) {
    sections.push({
      level: 'h2',
      title: sectionTopics[i],
      description: `Detailed coverage of ${sectionTopics[i].toLowerCase()}`,
      targetWordCount: wordsPerSection,
      keywords: [keyword, ...(secondaryKeywords[i] ? [secondaryKeywords[i]] : [])]
    })
  }
  
  // Conclusion
  sections.push({
    level: 'h2',
    title: 'Conclusion',
    description: `Summarize key points about ${keyword} and provide next steps`,
    targetWordCount: wordsPerSection,
    keywords: [keyword]
  })
  
  return sections
}

export const ContentOutlineGeneratorTool: Tool<typeof inputSchema, ContentOutline> = {
  name: 'content_outline_generator',
  
  async description() {
    return DESCRIPTION
  },
  
  inputSchema,
  
  async prompt() {
    return contentOutlinePrompt
  },
  
  async isEnabled() {
    return true
  },
  
  isReadOnly() {
    return true
  },
  
  isConcurrencySafe() {
    return true
  },
  
  needsPermissions(input?: ContentOutlineInput): boolean {
    return false
  },
  
  renderResultForAssistant(outline: ContentOutline): string {
    let output = `# Content Outline: ${outline.title}\n\n`
    output += `**Meta Title:** ${outline.metaTitle}\n`
    output += `**Meta Description:** ${outline.metaDescription}\n\n`
    output += `**Primary Keyword:** ${outline.primaryKeyword}\n`
    output += `**Secondary Keywords:** ${outline.secondaryKeywords.join(', ')}\n`
    output += `**Target Word Count:** ${outline.targetWordCount}\n`
    output += `**Estimated Read Time:** ${outline.estimatedReadTime} minutes\n`
    output += `**Content Type:** ${outline.contentType}\n`
    output += `**Tone:** ${outline.tone}\n\n`
    
    output += `## Article Structure\n\n`
    for (const section of outline.sections) {
      const indent = section.level === 'h3' ? '  ' : ''
      output += `${indent}### ${section.title} (${section.targetWordCount} words)\n`
      output += `${indent}${section.description}\n`
      output += `${indent}Keywords: ${section.keywords.join(', ')}\n\n`
    }
    
    return output
  },
  
  renderToolUseMessage(input: ContentOutlineInput, options: { verbose: boolean }): string {
    return `Generating content outline for: "${input.primary_keyword}"`
  },
  
  renderToolUseRejectedMessage(): React.ReactElement {
    return <Text color="red">Content outline generation was rejected by the user</Text>
  },
  
  renderToolResultMessage(outline: ContentOutline): React.ReactElement {
    return (
      <Box flexDirection="column">
        <Text color="green" bold>Content Outline Generated</Text>
        <Text> </Text>
        <Text color="yellow" bold>{outline.title}</Text>
        <Text> </Text>
        <Box flexDirection="column">
          <Text><Text color="cyan">Type:</Text> {outline.contentType}</Text>
          <Text><Text color="cyan">Word Count:</Text> {outline.targetWordCount}</Text>
          <Text><Text color="cyan">Read Time:</Text> {outline.estimatedReadTime} min</Text>
          <Text><Text color="cyan">Sections:</Text> {outline.sections.length}</Text>
        </Box>
      </Box>
    )
  },
  
  async *call(
    input: ContentOutlineInput,
    context: ToolUseContext
  ): AsyncGenerator<{ type: 'result'; data: ContentOutline; resultForAssistant?: string }> {
    const { 
      primary_keyword, 
      secondary_keywords, 
      target_word_count,
      content_type,
      tone
    } = input

    const title = generateMetaTitle(primary_keyword, content_type).replace(/:.+/, '')
    const metaTitle = generateMetaTitle(primary_keyword, content_type)
    const metaDescription = generateMetaDescription(primary_keyword, content_type)
    const sections = generateSections(primary_keyword, target_word_count, secondary_keywords)
    
    const outline: ContentOutline = {
      title,
      metaTitle,
      metaDescription,
      primaryKeyword: primary_keyword,
      secondaryKeywords: secondary_keywords,
      targetWordCount: target_word_count,
      estimatedReadTime: calculateReadTime(target_word_count),
      sections,
      contentType: content_type,
      tone
    }

    yield {
      type: 'result',
      data: outline,
      resultForAssistant: ContentOutlineGeneratorTool.renderResultForAssistant(outline)
    }
  }
}