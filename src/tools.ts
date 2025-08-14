import { Tool } from './Tool'
import { TaskTool } from './tools/TaskTool/TaskTool'
import { ArchitectTool } from './tools/ArchitectTool/ArchitectTool'
import { BashTool } from './tools/BashTool/BashTool'
import { AskExpertModelTool } from './tools/AskExpertModelTool/AskExpertModelTool'
import { ContentCrawlerTool } from './tools/ContentCrawlerTool/ContentCrawlerTool'
import { ContentOutlineGeneratorTool } from './tools/ContentOutlineGeneratorTool/ContentOutlineGeneratorTool'
import { ContentWriterTool } from './tools/ContentWriterTool/ContentWriterTool'
import { FileEditTool } from './tools/FileEditTool/FileEditTool'
import { FileReadTool } from './tools/FileReadTool/FileReadTool'
import { FileWriteTool } from './tools/FileWriteTool/FileWriteTool'
import { GlobTool } from './tools/GlobTool/GlobTool'
import { GoogleSearchTool } from './tools/GoogleSearchTool/GoogleSearchTool'
import { GrepTool } from './tools/GrepTool/GrepTool'
import { LSTool } from './tools/lsTool/lsTool'
import { MemoryReadTool } from './tools/MemoryReadTool/MemoryReadTool'
import { MemoryWriteTool } from './tools/MemoryWriteTool/MemoryWriteTool'
import { MultiEditTool } from './tools/MultiEditTool/MultiEditTool'
import { NotebookEditTool } from './tools/NotebookEditTool/NotebookEditTool'
import { NotebookReadTool } from './tools/NotebookReadTool/NotebookReadTool'
import { SerpAnalyzerTool } from './tools/SerpAnalyzerTool/SerpAnalyzerTool'
import { ThinkTool } from './tools/ThinkTool/ThinkTool'
import { TodoWriteTool } from './tools/TodoWriteTool/TodoWriteTool'
import { getMCPTools } from './services/mcpClient'
import { memoize } from 'lodash-es'

const ANT_ONLY_TOOLS = [MemoryReadTool, MemoryWriteTool]

// Function to avoid circular dependencies that break bun
export const getAllTools = (): Tool[] => {
  return [
    TaskTool,
    AskExpertModelTool,
    BashTool,
    ContentCrawlerTool,
    ContentOutlineGeneratorTool,
    ContentWriterTool,
    GlobTool,
    GoogleSearchTool,
    GrepTool,
    LSTool,
    SerpAnalyzerTool,
    FileReadTool,
    FileEditTool,
    MultiEditTool,
    FileWriteTool,
    NotebookReadTool,
    NotebookEditTool,
    ThinkTool,
    TodoWriteTool,
    ...ANT_ONLY_TOOLS,
  ]
}

export const getTools = memoize(
  async (enableArchitect?: boolean): Promise<Tool[]> => {
    const tools = [...getAllTools(), ...(await getMCPTools())]

    // Only include Architect tool if enabled via config or CLI flag
    if (enableArchitect) {
      tools.push(ArchitectTool)
    }

    const isEnabled = await Promise.all(tools.map(tool => tool.isEnabled()))
    return tools.filter((_, i) => isEnabled[i])
  },
)

export const getReadOnlyTools = memoize(async (): Promise<Tool[]> => {
  const tools = getAllTools().filter(tool => tool.isReadOnly())
  const isEnabled = await Promise.all(tools.map(tool => tool.isEnabled()))
  return tools.filter((_, index) => isEnabled[index])
})
