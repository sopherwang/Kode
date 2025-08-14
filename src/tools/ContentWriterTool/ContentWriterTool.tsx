import React from 'react'
import { Box, Text } from 'ink'
import { z } from 'zod'
import { Tool } from '../../Tool'
import { ToolUseContext } from '../../Tool'
import { contentWriterPrompt } from './prompt'

const sectionSchema = z.object({
  level: z.enum(['h1', 'h2', 'h3']),
  title: z.string(),
  description: z.string(),
  targetWordCount: z.number(),
  keywords: z.array(z.string())
})

const inputSchema = z.object({
  section: sectionSchema.describe('Section to write content for'),
  primary_keyword: z.string().describe('Primary keyword for SEO'),
  secondary_keywords: z.array(z.string()).default([]).describe('Secondary keywords'),
  tone: z.enum(['professional', 'casual', 'technical', 'friendly', 'authoritative'])
    .default('professional').describe('Writing tone'),
  include_examples: z.boolean().default(true).describe('Whether to include examples')
})

type ContentWriterInput = z.infer<typeof inputSchema>

interface WrittenContent {
  section: {
    title: string
    level: string
  }
  content: string
  wordCount: number
  keywordCount: number
}

const DESCRIPTION = 'Generate SEO-optimized content for a specific section based on outline and keywords'

function generateContent(
  section: any,
  primaryKeyword: string,
  secondaryKeywords: string[],
  tone: string,
  includeExamples: boolean
): string {
  const allKeywords = [primaryKeyword, ...secondaryKeywords]
  let content = ''
  
  // Generate introduction paragraph
  content += `When it comes to ${primaryKeyword}, understanding ${section.title.toLowerCase()} is crucial. `
  content += `This section explores the essential aspects that every professional should know. `
  
  // Generate main content based on target word count
  const paragraphs = Math.max(2, Math.floor(section.targetWordCount / 100))
  
  for (let i = 0; i < paragraphs; i++) {
    content += '\n\n'
    
    // Add variety to paragraph starters
    const starters = [
      `One of the key aspects of ${primaryKeyword} is`,
      `It's important to understand that`,
      `When implementing ${primaryKeyword},`,
      `Research shows that`,
      `Experts in ${primaryKeyword} recommend`,
      `A common approach to ${section.title.toLowerCase()} involves`
    ]
    
    content += starters[i % starters.length] + ' '
    
    // Add main paragraph content
    content += generateParagraphContent(primaryKeyword, secondaryKeywords, tone)
    
    // Occasionally add examples
    if (includeExamples && i % 2 === 1) {
      content += ` For example, when working with ${primaryKeyword}, you might encounter situations where ${section.title.toLowerCase()} becomes particularly relevant.`
    }
    
    // Add secondary keywords naturally
    if (i < secondaryKeywords.length) {
      content += ` This is especially true when considering ${secondaryKeywords[i]}.`
    }
  }
  
  // Add a concluding statement
  content += `\n\nIn summary, ${section.title.toLowerCase()} plays a vital role in ${primaryKeyword} success.`
  
  return content
}

function generateParagraphContent(primaryKeyword: string, secondaryKeywords: string[], tone: string): string {
  const templates = {
    professional: [
      `the implementation requires careful consideration of various factors. Organizations that successfully leverage ${primaryKeyword} typically see significant improvements in their outcomes`,
      `best practices dictate a structured approach to maximize effectiveness. The strategic application of these principles ensures optimal results`,
      `industry standards have evolved to accommodate modern requirements. Staying current with these developments is essential for maintaining competitive advantage`
    ],
    casual: [
      `it's actually pretty straightforward once you get the hang of it. Most people find that ${primaryKeyword} becomes second nature after some practice`,
      `you'll want to keep things simple and focus on what works. There's no need to overcomplicate the process`,
      `the basics are easy to master, and you'll see results quickly. Just remember to stay consistent with your approach`
    ],
    technical: [
      `the technical specifications require precise implementation. System architecture must account for scalability and performance considerations`,
      `algorithmic efficiency becomes paramount at scale. Optimization techniques can significantly reduce computational overhead`,
      `data structures play a crucial role in performance optimization. Careful selection of appropriate structures ensures optimal time complexity`
    ],
    friendly: [
      `we're here to help you succeed every step of the way. Think of ${primaryKeyword} as your trusted companion in achieving your goals`,
      `you've got this! With the right approach and a bit of practice, mastering these concepts becomes much easier`,
      `let's work together to make this as smooth as possible. Remember, everyone starts somewhere, and you're on the right track`
    ],
    authoritative: [
      `extensive research confirms the effectiveness of this approach. Leading institutions worldwide have validated these methodologies`,
      `data-driven analysis reveals consistent patterns of success. The evidence overwhelmingly supports these established principles`,
      `decades of experience have refined these practices to their current state. Industry leaders unanimously endorse these methods`
    ]
  }
  
  const toneTemplates = templates[tone as keyof typeof templates] || templates.professional
  return toneTemplates[Math.floor(Math.random() * toneTemplates.length)]
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length
}

function countKeywords(text: string, keyword: string): number {
  const regex = new RegExp(keyword, 'gi')
  const matches = text.match(regex)
  return matches ? matches.length : 0
}

export const ContentWriterTool: Tool<typeof inputSchema, WrittenContent> = {
  name: 'content_writer',
  
  async description() {
    return DESCRIPTION
  },
  
  inputSchema,
  
  async prompt() {
    return contentWriterPrompt
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
  
  needsPermissions(input?: ContentWriterInput): boolean {
    return false
  },
  
  renderResultForAssistant(result: WrittenContent): string {
    let output = `## ${result.section.title}\n\n`
    output += result.content
    output += `\n\n---\n`
    output += `**Word Count:** ${result.wordCount}\n`
    output += `**Keyword Occurrences:** ${result.keywordCount}\n`
    
    return output
  },
  
  renderToolUseMessage(input: ContentWriterInput, options: { verbose: boolean }): string {
    return `Writing content for section: "${input.section.title}"`
  },
  
  renderToolUseRejectedMessage(): React.ReactElement {
    return <Text color="red">Content writing was rejected by the user</Text>
  },
  
  renderToolResultMessage(result: WrittenContent): React.ReactElement {
    return (
      <Box flexDirection="column">
        <Text color="green" bold>Content Written Successfully</Text>
        <Text> </Text>
        <Text color="yellow" bold>{result.section.title}</Text>
        <Text> </Text>
        <Box flexDirection="column">
          <Text><Text color="cyan">Word Count:</Text> {result.wordCount}</Text>
          <Text><Text color="cyan">Keyword Uses:</Text> {result.keywordCount}</Text>
        </Box>
      </Box>
    )
  },
  
  async *call(
    input: ContentWriterInput,
    context: ToolUseContext
  ): AsyncGenerator<{ type: 'result'; data: WrittenContent; resultForAssistant?: string }> {
    const { 
      section,
      primary_keyword,
      secondary_keywords,
      tone,
      include_examples
    } = input

    const content = generateContent(
      section,
      primary_keyword,
      secondary_keywords,
      tone,
      include_examples
    )
    
    const result: WrittenContent = {
      section: {
        title: section.title,
        level: section.level
      },
      content,
      wordCount: countWords(content),
      keywordCount: countKeywords(content, primary_keyword)
    }

    yield {
      type: 'result',
      data: result,
      resultForAssistant: ContentWriterTool.renderResultForAssistant(result)
    }
  }
}