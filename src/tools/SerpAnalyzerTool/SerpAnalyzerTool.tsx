import React from 'react'
import { Box, Text } from 'ink'
import { z } from 'zod'
import { Tool } from '../../Tool'
import { ToolUseContext } from '../../Tool'
import * as cheerio from 'cheerio'
import { serpAnalyzerPrompt } from './prompt'

const inputSchema = z.object({
  keyword: z.string().describe('The primary keyword to analyze SERP results for'),
  search_results: z.array(z.object({
    title: z.string(),
    link: z.string(),
    snippet: z.string().optional(),
    position: z.number()
  })).describe('Array of search results to analyze'),
  crawled_content: z.array(z.object({
    url: z.string(),
    content: z.string(),
    success: z.boolean()
  })).optional().describe('Optional array of crawled content from the search results')
})

type SerpAnalyzerInput = z.infer<typeof inputSchema>

interface HeadingStructure {
  h1: string[]
  h2: string[]
  h3: string[]
}

interface SearchIntent {
  type: 'informational' | 'transactional' | 'navigational' | 'commercial'
  confidence: number
  indicators: string[]
}

interface SerpAnalysis {
  keyword: string
  searchIntent: SearchIntent
  commonHeadings: {
    h1: string[]
    h2: string[]
    h3: string[]
  }
  urlPatterns: {
    commonPaths: string[]
    avgPathDepth: number
    commonExtensions: string[]
  }
  contentMetrics: {
    avgWordCount: number
    minWordCount: number
    maxWordCount: number
  }
  titlePatterns: {
    commonWords: string[]
    avgLength: number
    commonFormats: string[]
  }
}

const DESCRIPTION = 'Analyze SERP results to extract SEO insights including headings, search intent, and content patterns'

function analyzeSearchIntent(results: any[], keyword: string): SearchIntent {
  const indicators: string[] = []
  let intentType: 'informational' | 'transactional' | 'navigational' | 'commercial' = 'informational'
  
  // Analyze titles and snippets for intent signals
  const combinedText = results.map(r => `${r.title} ${r.snippet || ''}`).join(' ').toLowerCase()
  
  // Check for transactional intent
  const transactionalKeywords = ['buy', 'purchase', 'order', 'shop', 'price', 'cost', 'deal', 'discount', 'sale']
  const transactionalCount = transactionalKeywords.filter(k => combinedText.includes(k)).length
  if (transactionalCount >= 2) {
    intentType = 'transactional'
    indicators.push('Contains transactional keywords')
  }
  
  // Check for navigational intent
  const navigationalPatterns = ['official', 'login', 'sign in', 'homepage']
  const navigationalCount = navigationalPatterns.filter(p => combinedText.includes(p)).length
  if (navigationalCount >= 2 || keyword.includes('.com') || keyword.includes('www')) {
    intentType = 'navigational'
    indicators.push('User searching for specific website')
  }
  
  // Check for commercial investigation
  const commercialKeywords = ['best', 'top', 'review', 'compare', 'vs', 'comparison', 'alternative']
  const commercialCount = commercialKeywords.filter(k => combinedText.includes(k)).length
  if (commercialCount >= 2) {
    intentType = 'commercial'
    indicators.push('User comparing products/services')
  }
  
  // Check for informational intent
  const informationalKeywords = ['what', 'how', 'why', 'when', 'guide', 'tutorial', 'learn', 'understand']
  const informationalCount = informationalKeywords.filter(k => combinedText.includes(k)).length
  if (informationalCount >= 2) {
    intentType = 'informational'
    indicators.push('User seeking information')
  }
  
  const confidence = Math.min(
    (transactionalCount + navigationalCount + commercialCount + informationalCount) * 10,
    90
  )
  
  return {
    type: intentType,
    confidence,
    indicators
  }
}

function extractHeadings(html: string): HeadingStructure {
  const $ = cheerio.load(html)
  
  const h1s: string[] = []
  const h2s: string[] = []
  const h3s: string[] = []
  
  $('h1').each((_, el) => {
    const text = $(el).text().trim()
    if (text) h1s.push(text)
  })
  
  $('h2').each((_, el) => {
    const text = $(el).text().trim()
    if (text) h2s.push(text)
  })
  
  $('h3').each((_, el) => {
    const text = $(el).text().trim()
    if (text) h3s.push(text)
  })
  
  return { h1: h1s, h2: h2s, h3: h3s }
}

function analyzeUrls(urls: string[]): any {
  const paths = urls.map(url => {
    try {
      const u = new URL(url)
      return u.pathname
    } catch {
      return '/'
    }
  })
  
  // Analyze path depth
  const depths = paths.map(p => p.split('/').filter(s => s).length)
  const avgDepth = depths.reduce((a, b) => a + b, 0) / depths.length
  
  // Find common path segments
  const allSegments = paths.flatMap(p => p.split('/').filter(s => s))
  const segmentCounts: Record<string, number> = {}
  allSegments.forEach(s => {
    segmentCounts[s] = (segmentCounts[s] || 0) + 1
  })
  
  const commonPaths = Object.entries(segmentCounts)
    .filter(([_, count]) => count >= urls.length / 3)
    .map(([path]) => path)
    .slice(0, 5)
  
  // Analyze extensions
  const extensions = paths.map(p => {
    const match = p.match(/\.([a-z]+)$/i)
    return match ? match[1] : 'none'
  })
  
  const extensionCounts: Record<string, number> = {}
  extensions.forEach(e => {
    extensionCounts[e] = (extensionCounts[e] || 0) + 1
  })
  
  return {
    commonPaths,
    avgPathDepth: Math.round(avgDepth * 10) / 10,
    commonExtensions: Object.keys(extensionCounts).slice(0, 3)
  }
}

function analyzeTitles(titles: string[]): any {
  // Find common words
  const allWords = titles.join(' ').toLowerCase().split(/\s+/)
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were'])
  
  const wordCounts: Record<string, number> = {}
  allWords.forEach(word => {
    if (word.length > 2 && !stopWords.has(word)) {
      wordCounts[word] = (wordCounts[word] || 0) + 1
    }
  })
  
  const commonWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word)
  
  // Analyze title lengths
  const lengths = titles.map(t => t.length)
  const avgLength = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)
  
  // Identify common formats
  const formats: string[] = []
  if (titles.some(t => t.includes('How to'))) formats.push('How to...')
  if (titles.some(t => t.includes('Best'))) formats.push('Best X...')
  if (titles.some(t => t.includes('Guide'))) formats.push('Ultimate/Complete Guide')
  if (titles.some(t => /\d+/.test(t))) formats.push('Numbered lists (X Ways/Tips)')
  if (titles.some(t => t.includes('?'))) formats.push('Questions')
  
  return {
    commonWords,
    avgLength,
    commonFormats: formats
  }
}

function findCommonHeadings(allHeadings: HeadingStructure[]): any {
  const h1Counts: Record<string, number> = {}
  const h2Counts: Record<string, number> = {}
  const h3Counts: Record<string, number> = {}
  
  allHeadings.forEach(headings => {
    headings.h1.forEach(h => {
      const normalized = h.toLowerCase().trim()
      h1Counts[normalized] = (h1Counts[normalized] || 0) + 1
    })
    
    headings.h2.forEach(h => {
      const normalized = h.toLowerCase().trim()
      h2Counts[normalized] = (h2Counts[normalized] || 0) + 1
    })
    
    headings.h3.forEach(h => {
      const normalized = h.toLowerCase().trim()
      h3Counts[normalized] = (h3Counts[normalized] || 0) + 1
    })
  })
  
  const getTop = (counts: Record<string, number>, limit = 5) => {
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([heading]) => heading)
  }
  
  return {
    h1: getTop(h1Counts),
    h2: getTop(h2Counts, 10),
    h3: getTop(h3Counts, 10)
  }
}

export const SerpAnalyzerTool: Tool<typeof inputSchema, SerpAnalysis> = {
  name: 'serp_analyzer',
  
  async description() {
    return DESCRIPTION
  },
  
  inputSchema,
  
  async prompt() {
    return serpAnalyzerPrompt
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
  
  needsPermissions(input?: SerpAnalyzerInput): boolean {
    return false // No external calls, just analysis
  },
  
  renderResultForAssistant(analysis: SerpAnalysis): string {
    let output = `## SERP Analysis for "${analysis.keyword}"\n\n`
    
    // Search Intent
    output += `### Search Intent\n`
    output += `- **Type**: ${analysis.searchIntent.type}\n`
    output += `- **Confidence**: ${analysis.searchIntent.confidence}%\n`
    if (analysis.searchIntent.indicators.length > 0) {
      output += `- **Indicators**: ${analysis.searchIntent.indicators.join(', ')}\n`
    }
    output += '\n'
    
    // Title Patterns
    output += `### Title Patterns\n`
    output += `- **Average Length**: ${analysis.titlePatterns.avgLength} characters\n`
    output += `- **Common Words**: ${analysis.titlePatterns.commonWords.join(', ')}\n`
    if (analysis.titlePatterns.commonFormats.length > 0) {
      output += `- **Common Formats**: ${analysis.titlePatterns.commonFormats.join(', ')}\n`
    }
    output += '\n'
    
    // URL Structure
    output += `### URL Patterns\n`
    output += `- **Average Path Depth**: ${analysis.urlPatterns.avgPathDepth}\n`
    if (analysis.urlPatterns.commonPaths.length > 0) {
      output += `- **Common Paths**: ${analysis.urlPatterns.commonPaths.join(', ')}\n`
    }
    output += `- **Extensions**: ${analysis.urlPatterns.commonExtensions.join(', ')}\n\n`
    
    // Content Metrics
    if (analysis.contentMetrics.avgWordCount > 0) {
      output += `### Content Metrics\n`
      output += `- **Average Word Count**: ${analysis.contentMetrics.avgWordCount}\n`
      output += `- **Range**: ${analysis.contentMetrics.minWordCount} - ${analysis.contentMetrics.maxWordCount} words\n\n`
    }
    
    // Common Headings
    if (analysis.commonHeadings.h2.length > 0) {
      output += `### Common Headings\n`
      if (analysis.commonHeadings.h1.length > 0) {
        output += `**H1 Tags**:\n${analysis.commonHeadings.h1.map(h => `- ${h}`).join('\n')}\n\n`
      }
      output += `**H2 Tags**:\n${analysis.commonHeadings.h2.map(h => `- ${h}`).join('\n')}\n\n`
      if (analysis.commonHeadings.h3.length > 0) {
        output += `**H3 Tags**:\n${analysis.commonHeadings.h3.slice(0, 5).map(h => `- ${h}`).join('\n')}\n\n`
      }
    }
    
    return output
  },
  
  renderToolUseMessage(input: SerpAnalyzerInput, options: { verbose: boolean }): string {
    return `Analyzing SERP results for: "${input.keyword}"`
  },
  
  renderToolUseRejectedMessage(): React.ReactElement {
    return <Text color="red">SERP analysis was rejected by the user</Text>
  },
  
  renderToolResultMessage(analysis: SerpAnalysis): React.ReactElement {
    return (
      <Box flexDirection="column">
        <Text color="green" bold>SERP Analysis Complete</Text>
        <Text> </Text>
        
        <Text color="yellow" bold>Keyword: {analysis.keyword}</Text>
        <Text> </Text>
        
        <Box flexDirection="column">
          <Text color="cyan" bold>Search Intent:</Text>
          <Text>  Type: {analysis.searchIntent.type}</Text>
          <Text>  Confidence: {analysis.searchIntent.confidence}%</Text>
        </Box>
        <Text> </Text>
        
        <Box flexDirection="column">
          <Text color="cyan" bold>Content Metrics:</Text>
          <Text>  Avg Word Count: {analysis.contentMetrics.avgWordCount}</Text>
          <Text>  Range: {analysis.contentMetrics.minWordCount}-{analysis.contentMetrics.maxWordCount} words</Text>
        </Box>
      </Box>
    )
  },
  
  async *call(
    input: SerpAnalyzerInput,
    context: ToolUseContext
  ): AsyncGenerator<{ type: 'result'; data: SerpAnalysis; resultForAssistant?: string }> {
    const { keyword, search_results, crawled_content } = input

    // Analyze search intent
    const searchIntent = analyzeSearchIntent(search_results, keyword)
    
    // Analyze URLs
    const urlPatterns = analyzeUrls(search_results.map(r => r.link))
    
    // Analyze titles
    const titlePatterns = analyzeTitles(search_results.map(r => r.title))
    
    // Process crawled content if available
    let commonHeadings = { h1: [], h2: [], h3: [] }
    let contentMetrics = { avgWordCount: 0, minWordCount: 0, maxWordCount: 0 }
    
    if (crawled_content && crawled_content.length > 0) {
      const allHeadings: HeadingStructure[] = []
      const wordCounts: number[] = []
      
      for (const crawled of crawled_content) {
        if (crawled.success && crawled.content) {
          // Extract headings
          const headings = extractHeadings(crawled.content)
          allHeadings.push(headings)
          
          // Calculate word count
          const wordCount = crawled.content.split(/\s+/).filter(w => w.length > 0).length
          wordCounts.push(wordCount)
        }
      }
      
      if (allHeadings.length > 0) {
        commonHeadings = findCommonHeadings(allHeadings)
      }
      
      if (wordCounts.length > 0) {
        contentMetrics = {
          avgWordCount: Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length),
          minWordCount: Math.min(...wordCounts),
          maxWordCount: Math.max(...wordCounts)
        }
      }
    }
    
    const analysis: SerpAnalysis = {
      keyword,
      searchIntent,
      commonHeadings,
      urlPatterns,
      contentMetrics,
      titlePatterns
    }

    yield {
      type: 'result',
      data: analysis,
      resultForAssistant: SerpAnalyzerTool.renderResultForAssistant(analysis)
    }
  }
}