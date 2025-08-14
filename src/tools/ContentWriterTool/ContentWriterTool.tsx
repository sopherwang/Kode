import React from 'react'
import { Box, Text } from 'ink'
import { z } from 'zod'
import { Tool } from '../../Tool'
import { ToolUseContext } from '../../query'
import { ToolCallEvent } from '../../types/ToolCallEvent'

const sectionSchema = z.object({
  level: z.enum(['h1', 'h2', 'h3']),
  title: z.string(),
  description: z.string(),
  targetWordCount: z.number(),
  keywords: z.array(z.string()),
  contentPoints: z.array(z.string())
})

const inputSchema = z.object({
  section: sectionSchema.describe('Section to write content for'),
  primary_keyword: z.string().describe('Primary keyword for SEO'),
  secondary_keywords: z.array(z.string()).default([]).describe('Secondary keywords'),
  tone: z.enum(['professional', 'casual', 'technical', 'friendly', 'authoritative'])
    .default('professional').describe('Writing tone'),
  style_guidelines: z.object({
    use_active_voice: z.boolean().default(true),
    include_examples: z.boolean().default(true),
    use_short_sentences: z.boolean().default(true),
    include_statistics: z.boolean().default(false),
    use_bullet_points: z.boolean().default(true)
  }).default({}).describe('Style preferences for content'),
  previous_sections: z.array(z.string()).default([]).describe('Previously written sections for context'),
  seo_optimization: z.object({
    keyword_density: z.number().min(0.5).max(3).default(1.5),
    use_synonyms: z.boolean().default(true),
    include_lsi_keywords: z.boolean().default(true)
  }).default({}).describe('SEO optimization settings')
})

type ContentWriterInput = z.infer<typeof inputSchema>

interface WrittenContent {
  section: {
    title: string
    level: string
  }
  content: string
  wordCount: number
  keywordOccurrences: Record<string, number>
  readabilityScore: number
  sentenceCount: number
  paragraphCount: number
}

export class ContentWriterTool extends Tool {
  name = 'content_writer'
  description = 'Write SEO-optimized content for specific sections based on outlines'
  inputSchema = inputSchema

  needsPermissions(input: unknown): boolean {
    // No permissions needed as this is a generation tool
    return false
  }

  private calculateReadabilityScore(text: string): number {
    // Simple readability calculation based on sentence and word length
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = text.split(/\s+/).filter(w => w.length > 0)
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0)
    
    if (sentences.length === 0 || words.length === 0) return 0
    
    // Flesch Reading Ease approximation
    const avgWordsPerSentence = words.length / sentences.length
    const avgSyllablesPerWord = syllables / words.length
    
    const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord
    return Math.max(0, Math.min(100, Math.round(score)))
  }

  private countSyllables(word: string): number {
    // Simple syllable counting
    word = word.toLowerCase()
    let count = 0
    let previousWasVowel = false
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = 'aeiou'.includes(word[i])
      if (isVowel && !previousWasVowel) {
        count++
      }
      previousWasVowel = isVowel
    }
    
    // Adjustments
    if (word.endsWith('e')) count--
    if (word.endsWith('le') && word.length > 2) count++
    if (count === 0) count = 1
    
    return count
  }

  private countKeywordOccurrences(content: string, keywords: string[]): Record<string, number> {
    const counts: Record<string, number> = {}
    const lowerContent = content.toLowerCase()
    
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g')
      const matches = lowerContent.match(regex)
      counts[keyword] = matches ? matches.length : 0
    }
    
    return counts
  }

  private generateIntroduction(input: ContentWriterInput): string {
    const { section, primary_keyword, tone } = input
    let content = ''
    
    // Opening hook
    if (tone === 'casual' || tone === 'friendly') {
      content += `Ever wondered about ${primary_keyword}? You're not alone. `
    } else if (tone === 'professional' || tone === 'authoritative') {
      content += `${primary_keyword.charAt(0).toUpperCase() + primary_keyword.slice(1)} plays a crucial role in today's landscape. `
    } else {
      content += `Understanding ${primary_keyword} is essential for success. `
    }
    
    // Main introduction
    content += `In this comprehensive guide, we'll explore everything you need to know about ${primary_keyword}. `
    
    // What to expect
    content += `We'll cover the fundamentals, best practices, and actionable strategies that you can implement right away. `
    
    // Value proposition
    content += `Whether you're a beginner or looking to enhance your existing knowledge, this guide provides valuable insights backed by real-world experience.\n\n`
    
    // Brief overview
    content += `Let's dive into the key aspects of ${primary_keyword} and discover how you can leverage it effectively.`
    
    return content
  }

  private generateConclusion(input: ContentWriterInput): string {
    const { section, primary_keyword, tone } = input
    let content = ''
    
    // Summary opening
    content += `We've covered the essential aspects of ${primary_keyword} in this guide. `
    
    // Key takeaways
    content += `The key takeaways include understanding the fundamentals, implementing best practices, and avoiding common pitfalls. `
    
    // Reinforce value
    if (tone === 'professional' || tone === 'authoritative') {
      content += `By applying these strategies, organizations can significantly improve their outcomes. `
    } else {
      content += `By following these tips, you'll be well-equipped to succeed with ${primary_keyword}. `
    }
    
    // Call to action
    content += `\n\nNow it's time to put this knowledge into practice. Start with the basics and gradually implement more advanced strategies as you gain confidence. `
    
    // Final thought
    content += `Remember, mastering ${primary_keyword} is a journey, not a destination. Keep learning, experimenting, and refining your approach for the best results.`
    
    return content
  }

  private generateBodyContent(input: ContentWriterInput): string {
    const { section, primary_keyword, secondary_keywords, tone, style_guidelines } = input
    let content = ''
    
    // Generate content for each content point
    for (const point of section.contentPoints) {
      content += this.generateParagraph(point, primary_keyword, secondary_keywords, tone, style_guidelines)
      content += '\n\n'
    }
    
    // Add examples if requested
    if (style_guidelines.include_examples) {
      content += this.generateExample(section.title, primary_keyword, tone)
      content += '\n\n'
    }
    
    // Add bullet points if requested
    if (style_guidelines.use_bullet_points && section.contentPoints.length > 2) {
      content += this.generateBulletPoints(section.title, primary_keyword, secondary_keywords)
      content += '\n\n'
    }
    
    return content
  }

  private generateParagraph(
    point: string,
    primary_keyword: string,
    secondary_keywords: string[],
    tone: string,
    style_guidelines: any
  ): string {
    let paragraph = ''
    
    // Opening sentence
    if (style_guidelines.use_active_voice) {
      paragraph += `When implementing ${primary_keyword}, you should focus on ${point.toLowerCase()}. `
    } else {
      paragraph += `${point} should be considered when working with ${primary_keyword}. `
    }
    
    // Elaboration
    paragraph += `This involves understanding the core principles and applying them effectively. `
    
    // Include secondary keywords naturally
    if (secondary_keywords.length > 0) {
      const keyword = secondary_keywords[Math.floor(Math.random() * secondary_keywords.length)]
      paragraph += `Related concepts like ${keyword} also play an important role. `
    }
    
    // Add value statement
    if (tone === 'professional') {
      paragraph += `Organizations that master this aspect typically see improved results and efficiency. `
    } else if (tone === 'friendly' || tone === 'casual') {
      paragraph += `Once you get the hang of this, you'll find it becomes second nature. `
    } else {
      paragraph += `This approach has been proven effective across various scenarios. `
    }
    
    // Closing thought
    if (style_guidelines.use_short_sentences) {
      paragraph += `The key is consistency. Practice makes perfect.`
    } else {
      paragraph += `By maintaining consistency and continuously refining your approach, you'll achieve better outcomes over time.`
    }
    
    return paragraph
  }

  private generateExample(title: string, keyword: string, tone: string): string {
    let example = '### Example\n\n'
    
    if (tone === 'technical') {
      example += `Consider a scenario where ${keyword} is implemented in a production environment. `
      example += `The system processes requests at scale while maintaining optimal performance. `
      example += `Through careful configuration and monitoring, teams can achieve 99.9% uptime.`
    } else if (tone === 'casual' || tone === 'friendly') {
      example += `Let's say you're working on a project that needs ${keyword}. `
      example += `You start small, test things out, and gradually expand. `
      example += `Before you know it, you've built something amazing!`
    } else {
      example += `For instance, when applying ${keyword} in practice, many professionals start with a pilot project. `
      example += `They measure results, gather feedback, and iterate on their approach. `
      example += `This methodical process ensures successful implementation.`
    }
    
    return example
  }

  private generateBulletPoints(title: string, primary_keyword: string, secondary_keywords: string[]): string {
    let bullets = `### Key Points for ${title}\n\n`
    
    const points = [
      `**Understanding the Basics**: Master the fundamental concepts of ${primary_keyword}`,
      `**Best Practices**: Follow industry-standard approaches for optimal results`,
      `**Common Challenges**: Be aware of typical obstacles and how to overcome them`,
      `**Tools and Resources**: Utilize appropriate tools to streamline your workflow`,
      `**Measurement and Optimization**: Track progress and continuously improve`
    ]
    
    // Include secondary keywords in some bullet points
    if (secondary_keywords.length > 0) {
      points[1] = `**Best Practices**: Implement ${secondary_keywords[0]} alongside ${primary_keyword}`
    }
    
    for (const point of points.slice(0, 4)) {
      bullets += `• ${point}\n`
    }
    
    return bullets
  }

  private expandContentToWordCount(content: string, targetWords: number, keyword: string): string {
    const currentWords = content.split(/\s+/).filter(w => w.length > 0).length
    
    if (currentWords >= targetWords) {
      return content
    }
    
    const wordsNeeded = targetWords - currentWords
    const additionalParagraphs = Math.ceil(wordsNeeded / 50) // Assume 50 words per paragraph
    
    let additionalContent = '\n\n### Additional Insights\n\n'
    
    const expansionTopics = [
      `Furthermore, ${keyword} offers several advantages that are worth considering.`,
      `It's also important to note the evolving nature of ${keyword} in the current landscape.`,
      `Many experts in the field emphasize the importance of staying updated with ${keyword} trends.`,
      `The practical applications of ${keyword} extend beyond the obvious use cases.`,
      `When properly implemented, ${keyword} can transform how organizations operate.`
    ]
    
    for (let i = 0; i < additionalParagraphs && i < expansionTopics.length; i++) {
      additionalContent += expansionTopics[i] + ' '
      additionalContent += 'This involves careful planning, execution, and continuous refinement. '
      additionalContent += 'Success comes from understanding both the theory and practical application.\n\n'
    }
    
    return content + additionalContent
  }

  async *call(
    input: ContentWriterInput,
    context: ToolUseContext
  ): AsyncGenerator<ToolCallEvent> {
    const { section, primary_keyword, secondary_keywords } = input
    
    yield {
      type: 'progress',
      message: `Writing content for section: "${section.title}"...`
    }

    try {
      let content = ''
      
      // Add section title
      const headingLevel = section.level === 'h1' ? '#' : section.level === 'h2' ? '##' : '###'
      content += `${headingLevel} ${section.title}\n\n`
      
      // Generate content based on section type
      if (section.title.toLowerCase().includes('introduction')) {
        content += this.generateIntroduction(input)
      } else if (section.title.toLowerCase().includes('conclusion')) {
        content += this.generateConclusion(input)
      } else {
        content += this.generateBodyContent(input)
      }
      
      // Expand content to meet word count
      content = this.expandContentToWordCount(content, section.targetWordCount, primary_keyword)
      
      // Calculate metrics
      const wordCount = content.split(/\s+/).filter(w => w.length > 0).length
      const allKeywords = [primary_keyword, ...secondary_keywords]
      const keywordOccurrences = this.countKeywordOccurrences(content, allKeywords)
      const readabilityScore = this.calculateReadabilityScore(content)
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
      const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0)
      
      const result: WrittenContent = {
        section: {
          title: section.title,
          level: section.level
        },
        content,
        wordCount,
        keywordOccurrences,
        readabilityScore,
        sentenceCount: sentences.length,
        paragraphCount: paragraphs.length
      }
      
      yield {
        type: 'result',
        result
      }
    } catch (error) {
      if (context.abortSignal.aborted) {
        throw new Error('Content writing cancelled')
      }
      throw error
    }
  }

  renderResultForAssistant(input: unknown, result: unknown): string {
    const written = result as WrittenContent
    
    let output = `## Written Content for: ${written.section.title}\n\n`
    
    // Metrics
    output += `### Content Metrics\n`
    output += `- **Word Count**: ${written.wordCount}\n`
    output += `- **Sentences**: ${written.sentenceCount}\n`
    output += `- **Paragraphs**: ${written.paragraphCount}\n`
    output += `- **Readability Score**: ${written.readabilityScore}/100\n\n`
    
    // Keyword usage
    output += `### Keyword Optimization\n`
    for (const [keyword, count] of Object.entries(written.keywordOccurrences)) {
      const density = ((count / written.wordCount) * 100).toFixed(2)
      output += `- **${keyword}**: ${count} occurrences (${density}% density)\n`
    }
    output += '\n'
    
    // Content
    output += `### Generated Content\n\n`
    output += written.content
    
    return output
  }

  renderResultForUser(result: unknown): React.ReactElement {
    const written = result as WrittenContent
    
    return (
      <Box flexDirection="column">
        <Text color="green" bold>Content Written Successfully</Text>
        <Text> </Text>
        
        <Box flexDirection="column">
          <Text color="yellow" bold>Section: {written.section.title}</Text>
          <Text color="gray">Level: {written.section.level.toUpperCase()}</Text>
        </Box>
        <Text> </Text>
        
        <Box flexDirection="column">
          <Text color="cyan" bold>Metrics:</Text>
          <Text>  Words: {written.wordCount}</Text>
          <Text>  Sentences: {written.sentenceCount}</Text>
          <Text>  Paragraphs: {written.paragraphCount}</Text>
          <Text>  Readability: {written.readabilityScore}/100</Text>
        </Box>
        <Text> </Text>
        
        <Box flexDirection="column">
          <Text color="cyan" bold>Keyword Usage:</Text>
          {Object.entries(written.keywordOccurrences).slice(0, 3).map(([keyword, count]) => (
            <Text key={keyword}>  {keyword}: {count}x</Text>
          ))}
        </Box>
        <Text> </Text>
        
        <Text color="gray">Content preview:</Text>
        <Box marginLeft={2}>
          <Text wrap="wrap">
            {written.content.substring(0, 200)}...
          </Text>
        </Box>
      </Box>
    )
  }
}