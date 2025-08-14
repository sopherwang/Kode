import { describe, it, expect, beforeEach } from 'bun:test'
import { SerpAnalyzerTool } from '../src/tools/SerpAnalyzerTool/SerpAnalyzerTool'
import { ContentOutlineGeneratorTool } from '../src/tools/ContentOutlineGeneratorTool/ContentOutlineGeneratorTool'
import { ContentWriterTool } from '../src/tools/ContentWriterTool/ContentWriterTool'

describe('SEO Tools Test Suite', () => {
  
  describe('SerpAnalyzerTool', () => {
    let tool: SerpAnalyzerTool

    beforeEach(() => {
      tool = new SerpAnalyzerTool()
    })

    it('should have correct name and description', () => {
      expect(tool.name).toBe('serp_analyzer')
      expect(tool.description).toContain('Analyze SERP results')
    })

    it('should validate input schema', () => {
      const validInput = {
        keyword: 'content marketing',
        num_results: 5,
        analyze_content: false,
        country: 'us'
      }

      const result = tool.inputSchema.parse(validInput)
      expect(result.keyword).toBe('content marketing')
      expect(result.num_results).toBe(5)
      expect(result.analyze_content).toBe(false)
      expect(result.country).toBe('us')
    })

    it('should use default values', () => {
      const minimalInput = {
        keyword: 'SEO tools'
      }

      const result = tool.inputSchema.parse(minimalInput)
      expect(result.num_results).toBe(10)
      expect(result.analyze_content).toBe(true)
      expect(result.country).toBe('us')
    })

    it('should require permissions', () => {
      expect(tool.needsPermissions({ keyword: 'test' })).toBe(true)
    })
  })

  describe('ContentOutlineGeneratorTool', () => {
    let tool: ContentOutlineGeneratorTool

    beforeEach(() => {
      tool = new ContentOutlineGeneratorTool()
    })

    it('should have correct name and description', () => {
      expect(tool.name).toBe('content_outline_generator')
      expect(tool.description).toContain('Generate SEO-optimized content outlines')
    })

    it('should validate input schema', () => {
      const validInput = {
        primary_keyword: 'digital marketing',
        secondary_keywords: ['online marketing', 'internet marketing'],
        target_word_count: 2000,
        content_type: 'guide',
        tone: 'professional',
        include_product_section: true
      }

      const result = tool.inputSchema.parse(validInput)
      expect(result.primary_keyword).toBe('digital marketing')
      expect(result.secondary_keywords).toHaveLength(2)
      expect(result.target_word_count).toBe(2000)
      expect(result.content_type).toBe('guide')
      expect(result.tone).toBe('professional')
      expect(result.include_product_section).toBe(true)
    })

    it('should validate word count range', () => {
      expect(() => {
        tool.inputSchema.parse({
          primary_keyword: 'test',
          target_word_count: 400 // Below minimum
        })
      }).toThrow()

      expect(() => {
        tool.inputSchema.parse({
          primary_keyword: 'test',
          target_word_count: 11000 // Above maximum
        })
      }).toThrow()
    })

    it('should not require permissions', () => {
      expect(tool.needsPermissions({ primary_keyword: 'test', target_word_count: 1000 })).toBe(false)
    })

    it('should accept SERP analysis data', () => {
      const inputWithSerp = {
        primary_keyword: 'test',
        target_word_count: 1000,
        serp_analysis: {
          searchIntent: {
            type: 'informational',
            confidence: 85
          },
          commonHeadings: {
            h1: ['Main Title'],
            h2: ['Section 1', 'Section 2'],
            h3: ['Subsection A']
          },
          contentMetrics: {
            avgWordCount: 1500,
            minWordCount: 800,
            maxWordCount: 2200
          },
          titlePatterns: {
            commonFormats: ['How to...', 'Guide']
          }
        }
      }

      const result = tool.inputSchema.parse(inputWithSerp)
      expect(result.serp_analysis).toBeDefined()
      expect(result.serp_analysis?.searchIntent?.type).toBe('informational')
    })
  })

  describe('ContentWriterTool', () => {
    let tool: ContentWriterTool

    beforeEach(() => {
      tool = new ContentWriterTool()
    })

    it('should have correct name and description', () => {
      expect(tool.name).toBe('content_writer')
      expect(tool.description).toContain('Write SEO-optimized content')
    })

    it('should validate section input', () => {
      const validInput = {
        section: {
          level: 'h2',
          title: 'Introduction to SEO',
          description: 'Introduce SEO concepts',
          targetWordCount: 300,
          keywords: ['SEO', 'search optimization'],
          contentPoints: ['Define SEO', 'Explain importance', 'Preview topics']
        },
        primary_keyword: 'SEO',
        secondary_keywords: ['search engine optimization'],
        tone: 'professional'
      }

      const result = tool.inputSchema.parse(validInput)
      expect(result.section.title).toBe('Introduction to SEO')
      expect(result.section.targetWordCount).toBe(300)
      expect(result.primary_keyword).toBe('SEO')
      expect(result.tone).toBe('professional')
    })

    it('should validate style guidelines', () => {
      const input = {
        section: {
          level: 'h2',
          title: 'Test Section',
          description: 'Test',
          targetWordCount: 200,
          keywords: ['test'],
          contentPoints: ['Point 1']
        },
        primary_keyword: 'test',
        style_guidelines: {
          use_active_voice: false,
          include_examples: false,
          use_short_sentences: false,
          include_statistics: true,
          use_bullet_points: false
        }
      }

      const result = tool.inputSchema.parse(input)
      expect(result.style_guidelines.use_active_voice).toBe(false)
      expect(result.style_guidelines.include_statistics).toBe(true)
    })

    it('should validate SEO optimization settings', () => {
      const input = {
        section: {
          level: 'h2',
          title: 'Test',
          description: 'Test',
          targetWordCount: 200,
          keywords: ['test'],
          contentPoints: ['Point']
        },
        primary_keyword: 'test',
        seo_optimization: {
          keyword_density: 2.5,
          use_synonyms: false,
          include_lsi_keywords: false
        }
      }

      const result = tool.inputSchema.parse(input)
      expect(result.seo_optimization.keyword_density).toBe(2.5)
      expect(result.seo_optimization.use_synonyms).toBe(false)
    })

    it('should validate keyword density range', () => {
      const input = {
        section: {
          level: 'h2',
          title: 'Test',
          description: 'Test',
          targetWordCount: 200,
          keywords: ['test'],
          contentPoints: ['Point']
        },
        primary_keyword: 'test',
        seo_optimization: {
          keyword_density: 0.3 // Below minimum
        }
      }

      expect(() => tool.inputSchema.parse(input)).toThrow()

      input.seo_optimization.keyword_density = 3.5 // Above maximum
      expect(() => tool.inputSchema.parse(input)).toThrow()
    })

    it('should not require permissions', () => {
      expect(tool.needsPermissions({ 
        section: { title: 'Test' },
        primary_keyword: 'test' 
      })).toBe(false)
    })
  })

  describe('Tool Integration', () => {
    it('should work together in a workflow', () => {
      // This tests that the tools can be instantiated and have compatible interfaces
      const serpAnalyzer = new SerpAnalyzerTool()
      const outlineGenerator = new ContentOutlineGeneratorTool()
      const contentWriter = new ContentWriterTool()

      // All tools should be valid Tool instances
      expect(serpAnalyzer.name).toBeDefined()
      expect(outlineGenerator.name).toBeDefined()
      expect(contentWriter.name).toBeDefined()

      // Input schemas should be defined
      expect(serpAnalyzer.inputSchema).toBeDefined()
      expect(outlineGenerator.inputSchema).toBeDefined()
      expect(contentWriter.inputSchema).toBeDefined()
    })
  })
})