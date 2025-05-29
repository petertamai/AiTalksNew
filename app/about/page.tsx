// app/about/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { 
  ArrowLeft,
  Code,
  ExternalLink,
  Copy,
  CheckCircle,
  Heart,
  Star,
  Sparkles,
  BrainCircuit,
  Zap,
  Globe,
  Github,
  Coffee
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Enhanced Markdown Components for About Page
function AboutMarkdownRenderer({ content }: { content: string }) {
  const { theme } = useTheme()
  const [copied, setCopied] = React.useState<string | null>(null)

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
      toast.success('Code copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy text: ', err)
      toast.error('Failed to copy code')
    }
  }

  const components = {
    // Enhanced code blocks with copy functionality
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '')
      const codeId = React.useId()
      
      if (!inline && match) {
        return (
          <div className="relative group my-6 rounded-xl overflow-hidden border border-border/50 bg-card shadow-sm">
            <div className="flex items-center justify-between bg-muted/50 px-4 py-3 border-b border-border/50">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Code className="h-4 w-4" />
                {match[1].toUpperCase()}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(String(children).replace(/\n$/, ''), codeId)}
                className="h-7 w-7 p-0 opacity-60 hover:opacity-100 transition-opacity"
              >
                {copied === codeId ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            <div className="overflow-x-auto">
              <SyntaxHighlighter
                style={theme === 'dark' ? oneDark : oneLight}
                language={match[1]}
                PreTag="div"
                className="!mt-0 !mb-0 !bg-transparent"
                customStyle={{
                  margin: 0,
                  background: 'transparent',
                  padding: '1rem',
                }}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            </div>
          </div>
        )
      }

      // Inline code with better styling
      return (
        <code
          className="relative rounded-md bg-primary/10 px-2 py-0.5 font-mono text-sm font-semibold text-primary border border-primary/20"
          {...props}
        >
          {children}
        </code>
      )
    },

    // Enhanced blockquotes with gradient borders
    blockquote({ children }: any) {
      return (
        <blockquote className="my-6 border-l-4 border-gradient-to-b from-primary to-primary/50 bg-gradient-to-r from-primary/5 to-transparent pl-6 py-4 italic text-muted-foreground rounded-r-lg">
          {children}
        </blockquote>
      )
    },

    // Enhanced tables with better styling
    table({ children }: any) {
      return (
        <div className="my-8 w-full overflow-hidden rounded-lg border border-border/50 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              {children}
            </table>
          </div>
        </div>
      )
    },

    th({ children }: any) {
      return (
        <th className="border-b border-border bg-muted/50 px-4 py-3 text-left font-semibold text-foreground">
          {children}
        </th>
      )
    },

    td({ children }: any) {
      return (
        <td className="border-b border-border/30 px-4 py-3 text-muted-foreground">
          {children}
        </td>
      )
    },

    // Enhanced links with icons
    a({ href, children }: any) {
      const isExternal = href?.startsWith('http')
      
      return (
        <a
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="font-medium text-primary underline-offset-4 hover:text-primary/80 inline-flex items-center gap-1 hover:underline transition-colors"
        >
          {children}
          {isExternal && <ExternalLink className="h-3 w-3" />}
        </a>
      )
    },

    // Enhanced headings with better hierarchy
    h1({ children }: any) {
      return (
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mt-8 mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {children}
        </h1>
      )
    },

    h2({ children }: any) {
      return (
        <h2 className="scroll-m-20 text-3xl font-bold tracking-tight mt-8 mb-4 flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-primary" />
          {children}
        </h2>
      )
    },

    h3({ children }: any) {
      return (
        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-6 mb-3 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary/70" />
          {children}
        </h3>
      )
    },

    h4({ children }: any) {
      return (
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mt-4 mb-2">
          {children}
        </h4>
      )
    },

    // Enhanced lists with better spacing
    ul({ children }: any) {
        return (
          <ul className="my-6 ml-6 list-none space-y-2">
            {children}
          </ul>
        )
      },
  
      li({ children }: any) {
        return (
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
            <div className="flex-1">{children}</div>
          </li>
        )
      },
  
      ol({ children }: any) {
        return (
          <ol className="my-6 ml-6 list-decimal space-y-2 [&>li]:mt-2">
            {children}
          </ol>
        )
      },

    // Enhanced paragraphs
    p({ children }: any) {
      return (
        <p className="leading-7 text-muted-foreground [&:not(:first-child)]:mt-6">
          {children}
        </p>
      )
    },

    // Enhanced emphasis
    strong({ children }: any) {
      return <strong className="font-semibold text-foreground">{children}</strong>
    },

    em({ children }: any) {
      return <em className="italic text-primary">{children}</em>
    },

    // Enhanced horizontal rules
    hr() {
      return (
        <hr className="my-8 border-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      )
    },
  }

  return (
    <div className="prose prose-lg max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={components}
        className="leading-relaxed"
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default function AboutPage() {
  const [content, setContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadContent = async () => {
      try {
        setIsLoading(true)
        // Try to load the about.md file from public folder
        const response = await fetch('/content/about.md')
        
        if (!response.ok) {
          throw new Error(`Failed to load content: ${response.status}`)
        }
        
        const text = await response.text()
        setContent(text)
      } catch (err) {
        console.error('Error loading about content:', err)
        setError('Failed to load about content')
        // Fallback content
        setContent(`# About AI Conversation System

Welcome to the AI Conversation System - a premium platform for AI collaboration.

## Features

- **Multi-AI Conversations**: Enable dynamic conversations between multiple AI agents
- **Advanced Text-to-Speech**: High-quality audio generation powered by Groq
- **Premium Models**: Access to the latest AI models via OpenRouter
- **Beautiful UI**: Modern, responsive design with dark mode support

## Getting Started

Configure your API keys in the settings panel to begin creating AI conversations.

*This content is loaded from \`/public/content/about.md\`. Please create this file to customize the about page.*`)
      } finally {
        setIsLoading(false)
      }
    }

    loadContent()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-lg font-medium">Loading about content...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6 text-center">
                <div className="text-destructive mb-4">Error loading content</div>
                <Button asChild>
                  <Link href="/">Return Home</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
  {/* Premium Header */}
  <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to App</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <BrainCircuit className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">About</h1>
              <p className="text-sm text-muted-foreground">AI Conversation System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Heart className="h-3 w-3 text-red-500" />
              Made with love
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Star className="h-4 w-4" />
              AI 2 AI Conversaions
            </div>
          </div>

          {/* Content Card */}
          <Card className="relative overflow-hidden border-border/50 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-muted/30" />
            
            <CardContent className="relative p-8 lg:p-12">
              <AboutMarkdownRenderer content={content} />
            </CardContent>
          </Card>

          {/* Footer Info */}
          <div className="mt-12 text-center">
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <a 
                  href="https://petertam.pro" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  petertam.pro
                </a>
              </div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              <div className="flex items-center gap-2">
                <Coffee className="h-4 w-4" />
                <span>Made by Piotr Tamulewicz</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}