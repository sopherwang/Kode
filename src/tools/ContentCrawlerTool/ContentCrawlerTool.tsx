import React from 'react'
import { Box, Text } from 'ink'
import { z } from 'zod'
import { Tool } from '../../Tool'
import { ToolUseContext } from '../../Tool'
import { fetch } from 'undici'
import * as cheerio from 'cheerio'
import { contentCrawlerPrompt } from './prompt'

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

const DESCRIPTION = 'Crawl and extract text content and HTML structure from web pages'
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'

async function fetchWithRetry(
  url: string, 
  maxRetries: number,
  signal?: AbortSignal
): Promise<{ response: any, html: string }> {
  const headers = {
    'User-Agent': USER_AGENT,
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
        await new Promise(resolve => setTimeout(resolve, 1000))
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

function extractContent(html: string, extractTags: boolean): { content: string, tagCounts?: TagCounts } {
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

export const ContentCrawlerTool: Tool<typeof inputSchema, CrawlResult> = {
  name: 'content_crawler',
  
  async description() {
    return DESCRIPTION
  },
  
  inputSchema,
  
  async prompt() {
    return contentCrawlerPrompt
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
  
  needsPermissions(input?: ContentCrawlerInput): boolean {
    // Web crawling needs permission in safe mode
    return true
  },
  
  renderResultForAssistant(result: CrawlResult): string {
    if (!result.success) {
      return `Failed to crawl ${result.url}. The content could not be retrieved.`
    }
    
    let output = `Successfully crawled: ${result.url}\n`
    output += `Status Code: ${result.statusCode}\n`
    output += `Content Length: ${result.contentLength} characters\n\n`
    
    if (result.tagCounts) {
      output += `HTML Structure:\n`
      output += `- H1 tags: ${result.tagCounts.h1}\n`
      output += `- H2 tags: ${result.tagCounts.h2}\n`
      output += `- Paragraphs: ${result.tagCounts.p}\n`
      output += `- Divs: ${result.tagCounts.div}\n`
      output += `- Spans: ${result.tagCounts.span}\n\n`
    }
    
    // Include first 500 characters of content as preview
    const preview = result.content.substring(0, 500)
    output += `Content Preview:\n${preview}${result.content.length > 500 ? '...' : ''}\n\n`
    output += `Full Content (${result.contentLength} characters):\n${result.content}`
    
    return output
  },
  
  renderToolUseMessage(input: ContentCrawlerInput, options: { verbose: boolean }): string {
    return `Crawling content from: ${input.url}`
  },
  
  renderToolUseRejectedMessage(): React.ReactElement {
    return <Text color="red">Content crawl was rejected by the user</Text>
  },
  
  renderToolResultMessage(result: CrawlResult): React.ReactElement {
    if (!result.success) {
      return (
        <Box flexDirection="column">
          <Text color="red" bold>Failed to crawl URL</Text>
          <Text color="gray">{result.url}</Text>
        </Box>
      )
    }
    
    return (
      <Box flexDirection="column">
        <Text color="green" bold>Successfully crawled webpage</Text>
        <Text> </Text>
        <Box flexDirection="column">
          <Text><Text color="cyan">URL:</Text> {result.url}</Text>
          <Text><Text color="cyan">Status:</Text> {result.statusCode}</Text>
          <Text><Text color="cyan">Content Size:</Text> {result.contentLength} characters</Text>
        </Box>
        
        {result.tagCounts && (
          <>
            <Text> </Text>
            <Text color="yellow" bold>HTML Structure:</Text>
            <Box flexDirection="column" marginLeft={2}>
              <Text>H1 tags: {result.tagCounts.h1}</Text>
              <Text>H2 tags: {result.tagCounts.h2}</Text>
              <Text>Paragraphs: {result.tagCounts.p}</Text>
              <Text>Divs: {result.tagCounts.div}</Text>
              <Text>Spans: {result.tagCounts.span}</Text>
            </Box>
          </>
        )}
        
        <Text> </Text>
        <Text color="yellow" bold>Content Preview:</Text>
        <Box marginLeft={2}>
          <Text wrap="wrap">
            {result.content.substring(0, 300)}
            {result.content.length > 300 && <Text color="gray">...</Text>}
          </Text>
        </Box>
      </Box>
    )
  },
  
  async *call(
    input: ContentCrawlerInput,
    context: ToolUseContext
  ): AsyncGenerator<{ type: 'result'; data: CrawlResult; resultForAssistant?: string }> {
    const { url, extract_tags, max_retries } = input

    try {
      // Fetch the URL with retries
      const { response, html } = await fetchWithRetry(
        url,
        max_retries
      )

      // Extract content and tags
      const { content, tagCounts } = extractContent(html, extract_tags)

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
        data: result,
        resultForAssistant: ContentCrawlerTool.renderResultForAssistant(result)
      }
    } catch (error) {
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
        data: result,
        resultForAssistant: ContentCrawlerTool.renderResultForAssistant(result)
      }
    }
  }
}