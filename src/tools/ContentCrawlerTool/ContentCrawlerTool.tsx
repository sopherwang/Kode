import React from 'react'
import { Box, Text } from 'ink'
import { z } from 'zod'
import { Tool } from '../../Tool'
import { ToolUseContext } from '../../query'
import { ToolCallEvent } from '../../types/ToolCallEvent'
import { fetch } from 'undici'
import * as cheerio from 'cheerio'

const inputSchema = z.object({
  url: z.string().url().describe('The URL to crawl and extract content from'),
  extract_tags: z.boolean().default(true).describe('Whether to extract and count HTML tags'),
  max_retries: z.number().min(0).max(3).default(2).describe('Maximum number of retry attempts on failure')
})

type ContentCrawlerInput = z.infer<typeof inputSchema>

interface TagCounts {
  h1: number
  h2: number
  span: number
  div: number
  p: number
}

interface CrawlResult {
  content: string
  tagCounts?: TagCounts
  url: string
  statusCode: number
  contentLength: number
  success: boolean
}

export class ContentCrawlerTool extends Tool {
  name = 'content_crawler'
  description = 'Crawl and extract text content and HTML structure from web pages'
  inputSchema = inputSchema

  private userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'

  needsPermissions(input: unknown): boolean {
    // Web crawling needs permission in safe mode
    return true
  }

  private async fetchWithRetry(
    url: string, 
    maxRetries: number,
    signal?: AbortSignal
  ): Promise<{ response: any, html: string }> {
    const headers = {
      'User-Agent': this.userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    }

    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Add delay between retries
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, 10000))
        }

        const response = await fetch(url, {
          headers,
          signal,
          redirect: 'follow'
        })

        if (response.ok) {
          const html = await response.text()
          return { response, html }
        }

        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`)
        
        // Don't retry on 4xx errors (client errors)
        if (response.status >= 400 && response.status < 500) {
          throw lastError
        }
      } catch (error) {
        lastError = error as Error
        
        // If cancelled, throw immediately
        if (signal?.aborted) {
          throw new Error('Crawl cancelled')
        }
        
        // On last attempt, throw the error
        if (attempt === maxRetries) {
          throw lastError
        }
      }
    }

    throw lastError || new Error('Failed to fetch URL')
  }

  private extractContent(html: string, extractTags: boolean): { content: string, tagCounts?: TagCounts } {
    const $ = cheerio.load(html)
    
    // Remove script and style elements
    $('script').remove()
    $('style').remove()
    $('noscript').remove()
    
    // Extract text content
    const textContent = $.text()
    
    // Clean the content (remove extra whitespace)
    const cleanedContent = textContent
      .split(/\s+/)
      .filter(word => word.length > 0)
      .join(' ')
      .trim()
    
    // Count tags if requested
    let tagCounts: TagCounts | undefined
    if (extractTags) {
      tagCounts = {
        h1: $('h1').length,
        h2: $('h2').length,
        span: $('span').length,
        div: $('div').length,
        p: $('p').length
      }
    }
    
    return { content: cleanedContent, tagCounts }
  }

  async *call(
    input: ContentCrawlerInput,
    context: ToolUseContext
  ): AsyncGenerator<ToolCallEvent> {
    const { url, extract_tags, max_retries } = input

    yield {
      type: 'progress',
      message: `Crawling content from: ${url}...`
    }

    try {
      // Fetch the URL with retries
      const { response, html } = await this.fetchWithRetry(
        url,
        max_retries,
        context.abortSignal
      )

      yield {
        type: 'progress',
        message: `Processing HTML content (${html.length} bytes)...`
      }

      // Extract content and tags
      const { content, tagCounts } = this.extractContent(html, extract_tags)

      const result: CrawlResult = {
        content,
        tagCounts,
        url,
        statusCode: response.status,
        contentLength: content.length,
        success: true
      }

      yield {
        type: 'result',
        result
      }
    } catch (error) {
      if (context.abortSignal.aborted) {
        throw new Error('Crawl cancelled')
      }
      
      // Return partial result with error information
      const result: CrawlResult = {
        content: '',
        url,
        statusCode: 0,
        contentLength: 0,
        success: false
      }
      
      yield {
        type: 'result',
        result,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  renderResultForAssistant(input: unknown, result: unknown): string {
    const crawlResult = result as CrawlResult
    
    if (!crawlResult.success) {
      return `Failed to crawl ${crawlResult.url}. The content could not be retrieved.`
    }
    
    let output = `Successfully crawled: ${crawlResult.url}\n`
    output += `Status Code: ${crawlResult.statusCode}\n`
    output += `Content Length: ${crawlResult.contentLength} characters\n\n`
    
    if (crawlResult.tagCounts) {
      output += `HTML Structure:\n`
      output += `- H1 tags: ${crawlResult.tagCounts.h1}\n`
      output += `- H2 tags: ${crawlResult.tagCounts.h2}\n`
      output += `- Paragraphs: ${crawlResult.tagCounts.p}\n`
      output += `- Divs: ${crawlResult.tagCounts.div}\n`
      output += `- Spans: ${crawlResult.tagCounts.span}\n\n`
    }
    
    // Include first 500 characters of content as preview
    const preview = crawlResult.content.substring(0, 500)
    output += `Content Preview:\n${preview}${crawlResult.content.length > 500 ? '...' : ''}\n\n`
    output += `Full Content (${crawlResult.contentLength} characters):\n${crawlResult.content}`
    
    return output
  }

  renderResultForUser(result: unknown): React.ReactElement {
    const crawlResult = result as CrawlResult
    
    if (!crawlResult.success) {
      return (
        <Box flexDirection="column">
          <Text color="red" bold>Failed to crawl URL</Text>
          <Text color="gray">{crawlResult.url}</Text>
        </Box>
      )
    }
    
    return (
      <Box flexDirection="column">
        <Text color="green" bold>Successfully crawled webpage</Text>
        <Text> </Text>
        <Box flexDirection="column">
          <Text><Text color="cyan">URL:</Text> {crawlResult.url}</Text>
          <Text><Text color="cyan">Status:</Text> {crawlResult.statusCode}</Text>
          <Text><Text color="cyan">Content Size:</Text> {crawlResult.contentLength} characters</Text>
        </Box>
        
        {crawlResult.tagCounts && (
          <>
            <Text> </Text>
            <Text color="yellow" bold>HTML Structure:</Text>
            <Box flexDirection="column" marginLeft={2}>
              <Text>H1 tags: {crawlResult.tagCounts.h1}</Text>
              <Text>H2 tags: {crawlResult.tagCounts.h2}</Text>
              <Text>Paragraphs: {crawlResult.tagCounts.p}</Text>
              <Text>Divs: {crawlResult.tagCounts.div}</Text>
              <Text>Spans: {crawlResult.tagCounts.span}</Text>
            </Box>
          </>
        )}
        
        <Text> </Text>
        <Text color="yellow" bold>Content Preview:</Text>
        <Box marginLeft={2}>
          <Text wrap="wrap">
            {crawlResult.content.substring(0, 300)}
            {crawlResult.content.length > 300 && <Text color="gray">...</Text>}
          </Text>
        </Box>
      </Box>
    )
  }
}