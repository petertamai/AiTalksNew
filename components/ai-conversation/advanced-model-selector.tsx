// components/ai-conversation/advanced-model-selector.tsx
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search, Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { OpenRouterModel } from "@/types"

interface ModelSelectorProps {
  models: OpenRouterModel[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  isLoading?: boolean
  className?: string
  agentName?: string
}

export function ModelSelector({
  models,
  value,
  onValueChange,
  placeholder = "Select model...",
  disabled = false,
  isLoading = false,
  className,
  agentName
}: ModelSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Filter and sort models
  const filteredModels = React.useMemo(() => {
    if (!searchQuery) return models

    const query = searchQuery.toLowerCase()
    return models.filter(model => 
      model.id.toLowerCase().includes(query) ||
      model.name?.toLowerCase().includes(query) ||
      model.description?.toLowerCase().includes(query)
    )
  }, [models, searchQuery])

  // Group models by provider
  const groupedModels = React.useMemo(() => {
    const groups: Record<string, OpenRouterModel[]> = {}
    
    filteredModels.forEach(model => {
      const provider = model.id.split('/')[0] || 'other'
      if (!groups[provider]) {
        groups[provider] = []
      }
      groups[provider].push(model)
    })

    // Sort groups and models within groups
    const sortedGroups: Record<string, OpenRouterModel[]> = {}
    Object.keys(groups)
      .sort()
      .forEach(provider => {
        sortedGroups[provider] = groups[provider].sort((a, b) => a.id.localeCompare(b.id))
      })

    return sortedGroups
  }, [filteredModels])

  const selectedModel = models.find(model => model.id === value)

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai':
        return '🤖'
      case 'anthropic':
        return '🧠'
      case 'google':
        return '🔍'
      case 'meta':
        return '📘'
      case 'mistral':
        return '🌪️'
      default:
        return '⚡'
    }
  }

  const formatProvider = (provider: string) => {
    return provider.charAt(0).toUpperCase() + provider.slice(1)
  }

  const handleSelect = (modelId: string) => {
    onValueChange(modelId)
    setOpen(false)
    setSearchQuery("")
  }

  return (
    <div className={cn("grid gap-2", className)}>
      {agentName && (
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{agentName} Model</span>
        </div>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between h-auto min-h-[2.5rem] p-3",
              "hover:bg-accent/50 focus:ring-2 focus:ring-primary/20",
              !value && "text-muted-foreground"
            )}
            disabled={disabled || isLoading}
          >
            <div className="flex items-center gap-2 flex-1 text-left">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : selectedModel ? (
                <>
                  <span className="text-lg">
                    {getProviderIcon(selectedModel.id.split('/')[0])}
                  </span>
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <span className="font-medium truncate">{selectedModel.id}</span>
                    {selectedModel.name && selectedModel.name !== selectedModel.id && (
                      <span className="text-xs text-muted-foreground truncate">
                        {selectedModel.name}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>{placeholder}</span>
                </>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            <CommandList>
              <ScrollArea className="h-[300px]">
                {Object.keys(groupedModels).length === 0 ? (
                  <CommandEmpty className="py-6 text-center text-sm">
                    {isLoading ? "Loading models..." : 
                     searchQuery ? `No models found for "${searchQuery}"` : 
                     "No models available"}
                  </CommandEmpty>
                ) : (
                  Object.entries(groupedModels).map(([provider, providerModels]) => (
                    <CommandGroup 
                      key={provider}
                      heading={
                        <div className="flex items-center gap-2 px-2 py-1.5">
                          <span className="text-lg">{getProviderIcon(provider)}</span>
                          <span className="font-semibold">{formatProvider(provider)}</span>
                          <Badge variant="secondary" className="ml-auto">
                            {providerModels.length}
                          </Badge>
                        </div>
                      }
                    >
                      {providerModels.map((model) => (
                        <CommandItem
                          key={model.id}
                          value={model.id}
                          onSelect={() => handleSelect(model.id)}
                          className="flex items-center gap-3 p-3 cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "h-4 w-4",
                              value === model.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{model.id}</span>
                              {model.context_length && (
                                <Badge variant="outline" className="text-xs">
                                  {model.context_length.toLocaleString()}
                                </Badge>
                              )}
                            </div>
                            {model.name && model.name !== model.id && (
                              <span className="text-xs text-muted-foreground truncate">
                                {model.name}
                              </span>
                            )}
                            {model.description && (
                              <span className="text-xs text-muted-foreground line-clamp-2">
                                {model.description}
                              </span>
                            )}
                            {model.pricing && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Prompt: ${model.pricing.prompt}</span>
                                <span>•</span>
                                <span>Completion: ${model.pricing.completion}</span>
                              </div>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))
                )}
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Model info display */}
      {selectedModel && (
        <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 rounded-md p-2">
          <span>Selected: {selectedModel.id}</span>
          {selectedModel.context_length && (
            <span>{selectedModel.context_length.toLocaleString()} tokens</span>
          )}
        </div>
      )}
    </div>
  )
}