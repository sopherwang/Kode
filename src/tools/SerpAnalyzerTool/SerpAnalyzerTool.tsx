import React from 'react'
import { Box, Text } from 'ink'
import { z } from 'zod'
import { Tool } from '../../Tool'
import { ToolUseContext } from '../../query'
import { ToolCallEvent } from '../../types/ToolCallEvent'
import * as cheerio from 'cheerio'
import { GoogleSearchTool } from '../GoogleSearchTool/GoogleSearchTool'
import { ContentCrawlerTool } from '../ContentCrawlerTool/ContentCrawlerTool'

const inputSchema = z.object({
  keyword: z.string().describe('The primary keyword to analyze SERP results for'),
  num_results: z.number().min(3).max(10).default(10).describe('Number of SERP results to analyze'),
  analyze_content: z.boolean().default(true).describe('Whether to crawl and analyze page content'),
  country: z.string().default('us').describe('Country code for localized search')
})

type SerpAnalyzerInput = z.infer<typeof inputSchema>

interface HeadingStructure {
  h1: string[]
  h2: string[]
  h3: string[]
}

interface SerpResult {
  position: number
  title: string
  url: string
  snippet?: string
  headings?: HeadingStructure
  wordCount?: number
  contentPreview?: string
}

interface SearchIntent {
  type: 'informational' | 'transactional' | 'navigational' | 'commercial'
  confidence: number
  indicators: string[]
}

interface SerpAnalysis {
  keyword: string
  topResults: SerpResult[]
  searchIntent: SearchIntent
  peopleAlsoAsk: string[]
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

export class SerpAnalyzerTool extends Tool {
  name = 'serp_analyzer'
  description = 'Analyze SERP results to extract SEO insights including headings, search intent, FAQs, and content patterns'
  inputSchema = inputSchema

  private googleSearchTool = new GoogleSearchTool()
  private contentCrawlerTool = new ContentCrawlerTool()

  needsPermissions(input: unknown): boolean {
    // Requires permission as it performs web searches and crawling
    return true
  }

  private analyzeSearchIntent(results: any[], keyword: string): SearchIntent {
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

  private extractHeadings(html: string): HeadingStructure {
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

  private analyzeUrls(urls: string[]): any {
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

  private analyzeTitles(titles: string[]): any {
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

  private findCommonHeadings(allHeadings: HeadingStructure[]): any {
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

  async *call(
    input: SerpAnalyzerInput,
    context: ToolUseContext
  ): AsyncGenerator<ToolCallEvent> {
    const { keyword, num_results, analyze_content, country } = input

    yield {
      type: 'progress',
      message: `Analyzing SERP for keyword: "${keyword}"...`
    }

    try {
      // Step 1: Get search results
      const searchResults = []
      for await (const event of this.googleSearchTool.call(
        { query: keyword, search_country: country, num_results },
        context
      )) {
        if (event.type === 'result') {
          searchResults.push(...(event.result as any[]))
        }
      }

      if (searchResults.length === 0) {
        throw new Error('No search results found')
      }

      yield {
        type: 'progress',
        message: `Found ${searchResults.length} results. Analyzing...`
      }

      // Step 2: Analyze each result
      const topResults: SerpResult[] = []
      const allHeadings: HeadingStructure[] = []
      const wordCounts: number[] = []
      
      for (const [index, result] of searchResults.entries()) {
        const serpResult: SerpResult = {
          position: result.position || index + 1,
          title: result.title,
          url: result.link,
          snippet: result.snippet
        }

        if (analyze_content && index < 5) { // Limit content analysis to top 5 for performance
          yield {
            type: 'progress',
            message: `Crawling content from result ${index + 1}...`
          }

          try {
            const crawlResults = []
            for await (const event of this.contentCrawlerTool.call(
              { url: result.link, extract_tags: true, max_retries: 1 },
              context
            )) {
              if (event.type === 'result') {
                crawlResults.push(event.result)
              }
            }

            if (crawlResults.length > 0 && crawlResults[0].success) {
              const crawlResult = crawlResults[0]
              
              // Extract headings from HTML
              const headings = this.extractHeadings(crawlResult.content)
              serpResult.headings = headings
              allHeadings.push(headings)
              
              // Calculate word count
              const wordCount = crawlResult.content.split(/\s+/).filter(w => w.length > 0).length
              serpResult.wordCount = wordCount
              wordCounts.push(wordCount)
              
              // Get content preview
              serpResult.contentPreview = crawlResult.content.substring(0, 200)
            }
          } catch (error) {
            // Skip if crawling fails for this URL
            console.error(`Failed to crawl ${result.link}:`, error)
          }
        }

        topResults.push(serpResult)
      }

      // Step 3: Extract People Also Ask (from search metadata if available)
      // Note: This would need to be extracted from the actual Google SERP page
      // For now, we'll use an empty array
      const peopleAlsoAsk: string[] = []

      // Step 4: Analyze patterns
      const searchIntent = this.analyzeSearchIntent(searchResults, keyword)
      const urlPatterns = this.analyzeUrls(searchResults.map(r => r.link))
      const titlePatterns = this.analyzeTitles(searchResults.map(r => r.title))
      const commonHeadings = this.findCommonHeadings(allHeadings)
      
      // Calculate content metrics
      const contentMetrics = wordCounts.length > 0 ? {
        avgWordCount: Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length),
        minWordCount: Math.min(...wordCounts),
        maxWordCount: Math.max(...wordCounts)
      } : {
        avgWordCount: 0,
        minWordCount: 0,
        maxWordCount: 0
      }

      const analysis: SerpAnalysis = {
        keyword,
        topResults,
        searchIntent,
        peopleAlsoAsk,
        commonHeadings,
        urlPatterns,
        contentMetrics,
        titlePatterns
      }

      yield {
        type: 'result',
        result: analysis
      }
    } catch (error) {
      if (context.abortSignal.aborted) {
        throw new Error('Analysis cancelled')
      }
      throw error
    }
  }

  renderResultForAssistant(input: unknown, result: unknown): string {
    const analysis = result as SerpAnalysis
    
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
    
    // Top Results
    output += `### Top ${analysis.topResults.length} Results\n\n`
    for (const result of analysis.topResults) {
      output += `**${result.position}. ${result.title}**\n`
      output += `- URL: ${result.url}\n`
      if (result.wordCount) {
        output += `- Word Count: ${result.wordCount}\n`
      }
      if (result.headings && result.headings.h2.length > 0) {
        output += `- Key Topics: ${result.headings.h2.slice(0, 3).join(', ')}\n`
      }
      output += '\n'
    }
    
    return output
  }

  renderResultForUser(result: unknown): React.ReactElement {
    const analysis = result as SerpAnalysis
    
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
        <Text> </Text>
        
        <Box flexDirection="column">
          <Text color="cyan" bold>Top Results Analyzed: {analysis.topResults.length}</Text>
          {analysis.topResults.slice(0, 3).map((r, i) => (
            <Box key={i} flexDirection="column" marginLeft={2}>
              <Text>{r.position}. {r.title}</Text>
            </Box>
          ))}
        </Box>
      </Box>
    )
  }
}