import React from 'react'
import { Box, Text } from 'ink'
import { z } from 'zod'
import { Tool } from '../../Tool'
import { ToolUseContext } from '../../Tool'
import { fetch } from 'undici'
import { googleSearchPrompt } from './prompt'

const inputSchema = z.object({
  query: z.string().describe('The search query to execute'),
  search_country: z.string().default('us').describe('Country code for search localization (e.g., "us", "uk", "fr")'),
  num_results: z.number().min(1).max(10).default(3).describe('Number of search results to return')
})

type GoogleSearchInput = z.infer<typeof inputSchema>

interface SearchResult {
  title: string
  link: string
  snippet?: string
  position: number
}

interface SerperResponse {
  organic: Array<{
    title: string
    link: string
    snippet?: string
    position: number
  }>
  searchParameters?: {
    q: string
    gl: string
    hl: string
  }
}

const DESCRIPTION = 'Search Google using the Serper.dev API to find relevant information from the web'

export const GoogleSearchTool: Tool<typeof inputSchema, SearchResult[]> = {
  name: 'google_search',
  
  async description() {
    return DESCRIPTION
  },
  
  inputSchema,
  
  async prompt() {
    return googleSearchPrompt
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
  
  needsPermissions(input?: GoogleSearchInput): boolean {
    // Web searches need permission in safe mode
    return true
  },
  
  renderResultForAssistant(results: SearchResult[]): string {
    if (!results || results.length === 0) {
      return 'No search results found.'
    }

    let output = `Found ${results.length} search results:\n\n`
    
    for (const item of results) {
      output += `${item.position}. **${item.title}**\n`
      output += `   URL: ${item.link}\n`
      if (item.snippet) {
        output += `   ${item.snippet}\n`
      }
      output += '\n'
    }

    return output.trim()
  },
  
  renderToolUseMessage(input: GoogleSearchInput, options: { verbose: boolean }): string {
    return `Searching Google for: "${input.query}" (${input.search_country})`
  },
  
  renderToolUseRejectedMessage(): React.ReactElement {
    return <Text color="red">Google search was rejected by the user</Text>
  },
  
  renderToolResultMessage(results: SearchResult[]): React.ReactElement {
    if (!results || results.length === 0) {
      return <Text>No search results found.</Text>
    }

    return (
      <Box flexDirection="column">
        <Text bold color="green">Found {results.length} search results:</Text>
        <Text> </Text>
        {results.map((item, index) => (
          <Box key={index} flexDirection="column" marginBottom={1}>
            <Text>
              <Text color="yellow">{item.position}.</Text> <Text bold>{item.title}</Text>
            </Text>
            <Text color="cyan">   {item.link}</Text>
            {item.snippet && (
              <Text color="gray">   {item.snippet}</Text>
            )}
          </Box>
        ))}
      </Box>
    )
  },
  
  async *call(
    input: GoogleSearchInput,
    context: ToolUseContext
  ): AsyncGenerator<{ type: 'result'; data: SearchResult[]; resultForAssistant?: string }> {
    const { query, search_country, num_results } = input

    // Check for API key
    const apiKey = process.env.SERPER_API_KEY
    if (!apiKey) {
      throw new Error(
        'SERPER_API_KEY environment variable is not set. ' +
        'You can get a free API key at https://serper.dev'
      )
    }

    try {
      // Make request to Serper API
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: query,
          gl: search_country,
          num: num_results
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Serper API error (${response.status}): ${errorText}`)
      }

      const data = await response.json() as SerperResponse

      // Parse results
      const results: SearchResult[] = []
      if (data.organic && Array.isArray(data.organic)) {
        for (const result of data.organic) {
          if (result.title && result.link) {
            results.push({
              title: result.title,
              link: result.link,
              snippet: result.snippet,
              position: result.position
            })
          }
        }
      }

      yield {
        type: 'result',
        data: results,
        resultForAssistant: GoogleSearchTool.renderResultForAssistant(results)
      }
    } catch (error) {
      throw error
    }
  }
}