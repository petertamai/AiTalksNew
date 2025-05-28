// components/ai-conversation/premium-settings-panel.tsx
"use client"

import * as React from "react"
import { 
  X, 
  Key, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  Shield,
  Zap,
  Database,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AIAgent, OpenRouterModel } from "@/types"
import { ModelSelector } from "./advanced-model-selector"
import { AIAgentCard } from "./ai-agent-card"
import Cookies from 'js-cookie'

interface PremiumSettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  ai1Config: AIAgent
  ai2Config: AIAgent
  onAI1ConfigChange: (config: Partial<AIAgent>) => void
  onAI2ConfigChange: (config: Partial<AIAgent>) => void
  isSharedView?: boolean
}

interface APIKeyCardProps {
  title: string
  description: string
  placeholder: string
  keyFormat: string
  docsUrl: string
  icon: React.ReactNode
  value: string
  onChange: (value: string) => void
  onSave: () => void
  isLoading: boolean
  status: { saved: boolean; valid: boolean }
  className?: string
}

function APIKeyCard({
  title,
  description,
  placeholder,
  keyFormat,
  docsUrl,
  icon,
  value,
  onChange,
  onSave,
  isLoading,
  status,
  className
}: APIKeyCardProps) {
  const [showKey, setShowKey] = React.useState(false)
  const [isFocused, setIsFocused] = React.useState(false)

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
    if (status.saved && status.valid) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (status.saved && !status.valid) return <AlertCircle className="h-4 w-4 text-yellow-500" />
    return null
  }

  const getStatusText = () => {
    if (isLoading) return 'Validating...'
    if (status.saved && status.valid) return 'Valid & Active'
    if (status.saved && !status.valid) return 'Saved (needs validation)'
    return 'Not configured'
  }

  const getStatusColor = () => {
    if (isLoading) return 'text-yellow-600'
    if (status.saved && status.valid) return 'text-green-600'
    if (status.saved && !status.valid) return 'text-yellow-600'
    return 'text-muted-foreground'
  }

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-background/50 to-muted/30" />
      
      <CardHeader className="relative pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              {icon}
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className={cn("text-xs font-medium", getStatusColor())}>
              {getStatusText()}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* Key Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">API Key</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowKey(!showKey)}
              className="h-6 text-xs"
            >
              {showKey ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
              {showKey ? 'Hide' : 'Show'}
            </Button>
          </div>
          
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={cn(
                "font-mono text-sm pr-12 transition-all duration-200",
                isFocused && "ring-2 ring-primary/20",
                status.saved && status.valid && "border-green-500/50 bg-green-50/50"
              )}
            />
            <Key className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Format Info */}
        <div className="rounded-lg bg-muted/30 p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium">
            <Shield className="h-3 w-3" />
            <span>Required Format</span>
          </div>
          <p className="text-xs text-muted-foreground font-mono">{keyFormat}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(docsUrl, '_blank')}
            className="text-xs"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Get Key
          </Button>
          
          <Button
            onClick={onSave}
            disabled={isLoading || !value.trim()}
            size="sm"
            className="min-w-[80px]"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              'Save Key'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function PremiumSettingsPanel({
  isOpen,
  onClose,
  ai1Config,
  ai2Config,
  onAI1ConfigChange,
  onAI2ConfigChange,
  isSharedView = false
}: PremiumSettingsPanelProps) {
  // Models and API states
  const [models, setModels] = React.useState<OpenRouterModel[]>([])
  const [isLoadingModels, setIsLoadingModels] = React.useState(false)
  
  // API key states
  const [apiKeys, setApiKeys] = React.useState({
    openrouter: '',
    groq: ''
  })
  
  const [keyStatus, setKeyStatus] = React.useState({
    openrouter: { saved: false, valid: false },
    groq: { saved: false, valid: false }
  })
  
  const [savingStates, setSavingStates] = React.useState({
    openrouter: false,
    groq: false
  })

  // Load API keys and models on mount
  React.useEffect(() => {
    if (isOpen) {
      loadAPIKeys()
      if (!isSharedView) {
        checkModels()
      }
    }
  }, [isOpen, isSharedView])

  const loadAPIKeys = () => {
    const openrouterKey = Cookies.get('openrouter_api_key') || ''
    const groqKey = Cookies.get('groq_api_key') || ''
    
    setApiKeys({ openrouter: openrouterKey, groq: groqKey })
    setKeyStatus({
      openrouter: { saved: Boolean(openrouterKey), valid: false },
      groq: { saved: Boolean(groqKey), valid: false }
    })
    
    if (openrouterKey || groqKey) {
      validateKeys(openrouterKey, groqKey)
    }
  }

  const validateKeys = async (openrouterKey?: string, groqKey?: string) => {
    // Validate OpenRouter key
    if (openrouterKey || apiKeys.openrouter) {
      try {
        const response = await fetch('/api/openrouter/models', {
          credentials: 'include'
        })
        const isValid = response.ok
        setKeyStatus(prev => ({
          ...prev,
          openrouter: { ...prev.openrouter, valid: isValid }
        }))
      } catch {
        setKeyStatus(prev => ({
          ...prev,
          openrouter: { ...prev.openrouter, valid: false }
        }))
      }
    }

    // Validate Groq key
    if (groqKey || apiKeys.groq) {
      const keyToValidate = groqKey || apiKeys.groq
      const isValid = keyToValidate.startsWith('gsk_')
      setKeyStatus(prev => ({
        ...prev,
        groq: { ...prev.groq, valid: isValid }
      }))
    }
  }

  const checkModels = async () => {
    const openrouterKey = Cookies.get('openrouter_api_key')
    if (!openrouterKey) return

    try {
      const response = await fetch('/api/openrouter/models', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.data && Array.isArray(data.data)) {
          setModels(data.data.sort((a: OpenRouterModel, b: OpenRouterModel) => 
            a.id.localeCompare(b.id)
          ))
        }
      }
    } catch (error) {
      console.error('Error loading models:', error)
    }
  }

  const fetchModels = async () => {
    setIsLoadingModels(true)
    try {
      const response = await fetch('/api/openrouter/models', {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.data && Array.isArray(data.data)) {
          const sortedModels = data.data.sort((a: OpenRouterModel, b: OpenRouterModel) => 
            a.id.localeCompare(b.id)
          )
          setModels(sortedModels)
          setKeyStatus(prev => ({
            ...prev,
            openrouter: { ...prev.openrouter, valid: true }
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching models:', error)
    } finally {
      setIsLoadingModels(false)
    }
  }

  const saveAPIKey = async (keyType: 'openrouter' | 'groq') => {
    const keyValue = apiKeys[keyType].trim()
    
    setSavingStates(prev => ({ ...prev, [keyType]: true }))
    
    try {
      // Validate format
      if (keyValue) {
        if (keyType === 'openrouter' && !keyValue.startsWith('sk-or')) {
          throw new Error('OpenRouter API keys must start with "sk-or-"')
        }
        if (keyType === 'groq' && !keyValue.startsWith('gsk_')) {
          throw new Error('Groq API keys must start with "gsk_"')
        }
      }

      // Save to cookies
      if (keyValue) {
        Cookies.set(`${keyType}_api_key`, keyValue, { expires: 30 })
      } else {
        Cookies.remove(`${keyType}_api_key`)
      }

      // Save via API
      await fetch('/api/keys/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          [`${keyType}_api_key`]: keyValue
        })
      })

      setKeyStatus(prev => ({
        ...prev,
        [keyType]: { saved: Boolean(keyValue), valid: false }
      }))

      // Validate and fetch models if OpenRouter
      if (keyType === 'openrouter' && keyValue) {
        setTimeout(() => {
          validateKeys(keyValue)
          fetchModels()
        }, 500)
      } else if (keyType === 'groq' && keyValue) {
        setTimeout(() => {
          validateKeys(undefined, keyValue)
        }, 500)
      }

    } catch (error) {
      console.error(`Error saving ${keyType} key:`, error)
    } finally {
      setSavingStates(prev => ({ ...prev, [keyType]: false }))
    }
  }

  const hasValidOpenRouterKey = keyStatus.openrouter.saved && keyStatus.openrouter.valid

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-4xl overflow-hidden">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-xl">Configuration</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  Configure API keys and AI agent settings
                </p>
              </div>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)] pr-4">
          <Tabs defaultValue="api-keys" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="api-keys" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                API Keys
              </TabsTrigger>
              <TabsTrigger value="agents" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                AI Agents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="api-keys" className="space-y-6">
              {!isSharedView && (
                <>
                  {/* OpenRouter API Key */}
                  <APIKeyCard
                    title="OpenRouter API"
                    description="Required for AI model access"
                    placeholder="sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx..."
                    keyFormat="Must start with 'sk-or-'"
                    docsUrl="https://openrouter.ai/keys"
                    icon={<Database className="h-5 w-5 text-primary" />}
                    value={apiKeys.openrouter}
                    onChange={(value) => setApiKeys(prev => ({ ...prev, openrouter: value }))}
                    onSave={() => saveAPIKey('openrouter')}
                    isLoading={savingStates.openrouter}
                    status={keyStatus.openrouter}
                  />

                  {/* Groq API Key */}
                  <APIKeyCard
                    title="Groq API (Optional)"
                    description="Required for text-to-speech functionality"
                    placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx..."
                    keyFormat="Must start with 'gsk_'"
                    docsUrl="https://console.groq.com/keys"
                    icon={<Zap className="h-5 w-5 text-purple-500" />}
                    value={apiKeys.groq}
                    onChange={(value) => setApiKeys(prev => ({ ...prev, groq: value }))}
                    onSave={() => saveAPIKey('groq')}
                    isLoading={savingStates.groq}
                    status={keyStatus.groq}
                  />

                  {/* Models Status */}
                  {hasValidOpenRouterKey && (
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </div>
                            <div>
                              <CardTitle className="text-base">Models Available</CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {models.length} models loaded successfully
                              </p>
                            </div>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchModels}
                            disabled={isLoadingModels}
                          >
                            <RefreshCw className={cn(
                              "h-4 w-4 mr-1",
                              isLoadingModels && "animate-spin"
                            )} />
                            Refresh
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  )}
                </>
              )}

              {isSharedView && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This is a shared conversation view. API key configuration is not available.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="agents" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AIAgentCard
                  agent={ai1Config}
                  models={models}
                  isLoadingModels={isLoadingModels}
                  onChange={onAI1ConfigChange}
                  disabled={isSharedView}
                />
                
                <AIAgentCard
                  agent={ai2Config}
                  models={models}
                  isLoadingModels={isLoadingModels}
                  onChange={onAI2ConfigChange}
                  disabled={isSharedView}
                />
              </div>

              {!hasValidOpenRouterKey && !isSharedView && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Configure your OpenRouter API key in the API Keys tab to select models for your AI agents.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}