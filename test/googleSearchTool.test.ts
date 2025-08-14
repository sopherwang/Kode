import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { GoogleSearchTool } from '../src/tools/GoogleSearchTool/GoogleSearchTool'
import { z } from 'zod'

describe('GoogleSearchTool', () => {
  let tool: GoogleSearchTool

  beforeEach(() => {
    tool = new GoogleSearchTool()
  })

  it('should have correct name and description', () => {
    expect(tool.name).toBe('google_search')
    expect(tool.description).toContain('Search Google')
  })

  it('should have valid input schema', () => {
    const validInput = {
      query: 'TypeScript tutorial',
      search_country: 'us',
      num_results: 3
    }

    const result = tool.inputSchema.parse(validInput)
    expect(result.query).toBe('TypeScript tutorial')
    expect(result.search_country).toBe('us')
    expect(result.num_results).toBe(3)
  })

  it('should use default values for optional parameters', () => {
    const minimalInput = {
      query: 'React hooks'
    }

    const result = tool.inputSchema.parse(minimalInput)
    expect(result.query).toBe('React hooks')
    expect(result.search_country).toBe('us')
    expect(result.num_results).toBe(3)
  })

  it('should validate number of results is within range', () => {
    expect(() => {
      tool.inputSchema.parse({
        query: 'test',
        num_results: 0
      })
    }).toThrow()

    expect(() => {
      tool.inputSchema.parse({
        query: 'test',
        num_results: 11
      })
    }).toThrow()
  })

  it('should require permissions', () => {
    const input = { query: 'test' }
    expect(tool.needsPermissions(input)).toBe(true)
  })

  it('should format results correctly for assistant', () => {
    const mockResults = [
      {
        title: 'Example Page',
        link: 'https://example.com',
        snippet: 'This is an example snippet',
        position: 1
      },
      {
        title: 'Another Page',
        link: 'https://another.com',
        position: 2
      }
    ]

    const formatted = tool.renderResultForAssistant({}, mockResults)
    
    expect(formatted).toContain('Found 2 search results')
    expect(formatted).toContain('Example Page')
    expect(formatted).toContain('https://example.com')
    expect(formatted).toContain('This is an example snippet')
    expect(formatted).toContain('Another Page')
  })

  it('should handle empty results', () => {
    const formatted = tool.renderResultForAssistant({}, [])
    expect(formatted).toBe('No search results found.')
  })
})