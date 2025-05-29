// components/ai-conversation/advanced-model-selector.tsx
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search, Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 })

  // Debug logging
  React.useEffect(() => {
    console.log(`🎯 ModelSelector ${agentName} render:`, {
      modelsCount: models?.length || 0,
      value,
      isLoading,
      disabled,
      open,
      searchQuery
    })
  }, [models, value, isLoading, disabled, agentName, open, searchQuery])

  // Calculate dropdown position when opening
  React.useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
  }, [open])

  // Filter models based on search
  const filteredModels = React.useMemo(() => {
    if (!models || !Array.isArray(models)) {
      return []
    }

    if (!searchQuery.trim()) {
      return models
    }

    const query = searchQuery.toLowerCase()
    return models.filter(model => 
      model.id?.toLowerCase().includes(query) ||
      model.name?.toLowerCase().includes(query)
    )
  }, [models, searchQuery])

  // Group models by provider for display
  const groupedModels = React.useMemo(() => {
    const groups: Record<string, OpenRouterModel[]> = {}
    
    filteredModels.forEach(model => {
      if (!model.id) return
      
      const provider = model.id.split('/')[0] || 'other'
      if (!groups[provider]) {
        groups[provider] = []
      }
      groups[provider].push(model)
    })

    // Sort providers and models
    const sortedGroups: Record<string, OpenRouterModel[]> = {}
    Object.keys(groups)
      .sort()
      .forEach(provider => {
        sortedGroups[provider] = groups[provider].sort((a, b) => a.id.localeCompare(b.id))
      })

    console.log(`🎯 ${agentName} grouped models:`, Object.keys(sortedGroups).length, 'groups')
    return sortedGroups
  }, [filteredModels, agentName])

  const selectedModel = models?.find(model => model.id === value)

  const getProviderIcon = (provider: string) => {
    const icons: Record<string, string> = {
      'openai': '🤖',
      'anthropic': '🧠', 
      'google': '🔍',
      'meta-llama': '📘',
      'mistralai': '🌪️'
    }
    return icons[provider.toLowerCase()] || '⚡'
  }

  const handleSelect = (modelId: string) => {
    console.log(`🎯 ${agentName} model selected:`, modelId)
    onValueChange(modelId)
    setOpen(false)
    setSearchQuery("")
  }

  const handleToggle = () => {
    console.log(`🎯 ${agentName} dropdown toggle:`, !open)
    setOpen(!open)
  }

  return (
    <div className={cn("grid gap-2 relative", className)}>
      {agentName && (
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{agentName} Model</span>
        </div>
      )}
      
      <div className="relative">
        {/* Trigger Button */}
        <div ref={triggerRef}>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            onClick={handleToggle}
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
        </div>
      </div>
      
      {/* Fixed Position Dropdown Portal */}
      {open && (
        <>
          {/* Click outside to close */}
          <div 
            className="fixed inset-0 z-[150]" 
            onClick={() => setOpen(false)}
          />
          
          {/* Dropdown Content - Fixed positioned */}
          <div 
            className="fixed z-[200] bg-popover text-popover-foreground border rounded-md shadow-lg"
            style={{
              top: dropdownPosition.top + 4,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              maxHeight: '50vh'
            }}
          >
            {/* Search Input */}
            <div className="flex items-center border-b px-3 py-2">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                type="text"
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
            
            {/* Models List */}
            <div className="max-h-[40vh] overflow-y-auto p-2">
              {Object.keys(groupedModels).length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {isLoading ? "Loading models..." : 
                   searchQuery ? `No models found for "${searchQuery}"` : 
                   models?.length ? "No models to display" :
                   "No models available"}
                </div>
              ) : (
                Object.entries(groupedModels).map(([provider, providerModels]) => (
                  <div key={provider} className="mb-4">
                    {/* Provider Header */}
                    <div className="flex items-center gap-2 px-2 py-1 text-sm font-semibold text-muted-foreground sticky top-0 bg-popover">
                      <span className="text-base">{getProviderIcon(provider)}</span>
                      <span className="capitalize">{provider.replace('-', ' ')}</span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {providerModels.length}
                      </Badge>
                    </div>
                    
                    {/* Provider Models */}
                    <div className="space-y-1">
                      {providerModels.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => handleSelect(model.id)}
                          className={cn(
                            "w-full flex items-start gap-3 p-2 rounded-md text-left hover:bg-accent transition-colors text-sm",
                            value === model.id && "bg-accent"
                          )}
                        >
                          <Check
                            className={cn(
                              "h-4 w-4 text-primary mt-0.5 flex-shrink-0",
                              value === model.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{model.id}</span>
                              {model.context_length && (
                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                  {(model.context_length / 1000).toFixed(0)}K
                                </Badge>
                              )}
                            </div>
                            {model.name && model.name !== model.id && (
                              <span className="text-xs text-muted-foreground truncate">
                                {model.name}
                              </span>
                            )}
                            {model.pricing && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>${model.pricing.prompt}/1K</span>
                                <span>•</span>
                                <span>${model.pricing.completion}/1K</span>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
      
      {/* Selected Model Info */}
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