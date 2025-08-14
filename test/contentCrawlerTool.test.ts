import { describe, it, expect, beforeEach } from 'bun:test'
import { ContentCrawlerTool } from '../src/tools/ContentCrawlerTool/ContentCrawlerTool'
import { z } from 'zod'

describe('ContentCrawlerTool', () => {
  let tool: ContentCrawlerTool

  beforeEach(() => {
    tool = new ContentCrawlerTool()
  })

  it('should have correct name and description', () => {
    expect(tool.name).toBe('content_crawler')
    expect(tool.description).toContain('Crawl and extract')
  })

  it('should have valid input schema', () => {
    const validInput = {
      url: 'https://example.com',
      extract_tags: true,
      max_retries: 2
    }

    const result = tool.inputSchema.parse(validInput)
    expect(result.url).toBe('https://example.com')
    expect(result.extract_tags).toBe(true)
    expect(result.max_retries).toBe(2)
  })

  it('should use default values for optional parameters', () => {
    const minimalInput = {
      url: 'https://example.com'
    }

    const result = tool.inputSchema.parse(minimalInput)
    expect(result.url).toBe('https://example.com')
    expect(result.extract_tags).toBe(true)
    expect(result.max_retries).toBe(2)
  })

  it('should validate URL format', () => {
    expect(() => {
      tool.inputSchema.parse({
        url: 'not-a-url'
      })
    }).toThrow()

    expect(() => {
      tool.inputSchema.parse({
        url: 'example.com' // Missing protocol
      })
    }).toThrow()
  })

  it('should validate max_retries range', () => {
    expect(() => {
      tool.inputSchema.parse({
        url: 'https://example.com',
        max_retries: -1
      })
    }).toThrow()

    expect(() => {
      tool.inputSchema.parse({
        url: 'https://example.com',
        max_retries: 4
      })
    }).toThrow()
  })

  it('should require permissions', () => {
    const input = { url: 'https://example.com' }
    expect(tool.needsPermissions(input)).toBe(true)
  })

  it('should format successful results correctly for assistant', () => {
    const mockResult = {
      content: 'This is the extracted content from the webpage. It contains some text.',
      tagCounts: {
        h1: 2,
        h2: 5,
        p: 10,
        div: 20,
        span: 15
      },
      url: 'https://example.com',
      statusCode: 200,
      contentLength: 70,
      success: true
    }

    const formatted = tool.renderResultForAssistant({}, mockResult)
    
    expect(formatted).toContain('Successfully crawled: https://example.com')
    expect(formatted).toContain('Status Code: 200')
    expect(formatted).toContain('Content Length: 70 characters')
    expect(formatted).toContain('HTML Structure:')
    expect(formatted).toContain('H1 tags: 2')
    expect(formatted).toContain('H2 tags: 5')
    expect(formatted).toContain('Paragraphs: 10')
    expect(formatted).toContain('Content Preview:')
    expect(formatted).toContain('This is the extracted content')
  })

  it('should handle failed crawl results', () => {
    const failedResult = {
      content: '',
      url: 'https://example.com',
      statusCode: 0,
      contentLength: 0,
      success: false
    }

    const formatted = tool.renderResultForAssistant({}, failedResult)
    expect(formatted).toContain('Failed to crawl')
    expect(formatted).toContain('https://example.com')
  })

  it('should include full content in assistant output', () => {
    const longContent = 'A'.repeat(600)
    const mockResult = {
      content: longContent,
      url: 'https://example.com',
      statusCode: 200,
      contentLength: 600,
      success: true
    }

    const formatted = tool.renderResultForAssistant({}, mockResult)
    
    // Should include preview (first 500 chars)
    expect(formatted).toContain('Content Preview:')
    expect(formatted).toContain('A'.repeat(500) + '...')
    
    // Should include full content
    expect(formatted).toContain('Full Content (600 characters):')
    expect(formatted).toContain(longContent)
  })
})