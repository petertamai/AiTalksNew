// components/ai-conversation/premium-settings-panel.tsx - Added Common System Instruction
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
  Sparkles,
  Save,
  Download,
  Upload,
  RotateCcw,
  MessageCircle,
  Bot
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
import { Textarea } from "@/components/ui/textarea"
import { AIAgent, OpenRouterModel } from "@/types"
import { ModelSelector } from "./advanced-model-selector"
import { AIAgentCard } from "./ai-agent-card"
import { 
  exportConversationSettings, 
  importConversationSettings, 
  resetConversationSettings 
} from "@/lib/utils"
import { toast } from "sonner"
import Cookies from 'js-cookie'

interface PremiumSettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  ai1Config: AIAgent
  ai2Config: AIAgent
  onAI1ConfigChange: (config: Partial<AIAgent>) => void
  onAI2ConfigChange: (config: Partial<AIAgent>) => void
  commonSystemInstruction: string
  onCommonSystemInstructionChange: (instruction: string) => void
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
  commonSystemInstruction,
  onCommonSystemInstructionChange,
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

  // File input ref for import
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Load API keys and models on mount
  React.useEffect(() => {
    if (isOpen) {
      console.log('🔧 Settings panel opened, loading data...')
      loadAPIKeys()
      if (!isSharedView) {
        fetchModelsWithDelay()
      }
    }
  }, [isOpen, isSharedView])

  // Save configuration changes to localStorage automatically
  React.useEffect(() => {
    if (isOpen && !isSharedView) {
      console.log('💾 AI configs changed in settings panel, auto-saving to localStorage')
      // The parent component handles saving via useEffect, but we can add additional logging here
    }
  }, [ai1Config, ai2Config, isOpen, isSharedView])

  const loadAPIKeys = () => {
    console.log('🔑 Loading API keys from cookies...')
    const openrouterKey = Cookies.get('openrouter_api_key') || ''
    const groqKey = Cookies.get('groq_api_key') || ''
    
    console.log('🔑 Found keys:', { 
      openrouter: openrouterKey ? 'present' : 'missing',
      groq: groqKey ? 'present' : 'missing'
    })
    
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
    console.log('🔍 Validating API keys...')
    
    // Validate OpenRouter key
    if (openrouterKey || apiKeys.openrouter) {
      try {
        console.log('🔍 Validating OpenRouter key...')
        const response = await fetch('/api/openrouter/models', {
          credentials: 'include'
        })
        const isValid = response.ok
        console.log('🔍 OpenRouter validation result:', isValid)
        setKeyStatus(prev => ({
          ...prev,
          openrouter: { ...prev.openrouter, valid: isValid }
        }))
      } catch (error) {
        console.error('❌ OpenRouter validation failed:', error)
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
      console.log('🔍 Groq validation result:', isValid)
      setKeyStatus(prev => ({
        ...prev,
        groq: { ...prev.groq, valid: isValid }
      }))
    }
  }

  const fetchModelsWithDelay = async () => {
    setTimeout(fetchModels, 100)
  }

  const fetchModels = async () => {
    console.log('📥 Fetching models...')
    setIsLoadingModels(true)
    
    try {
      const response = await fetch('/api/openrouter/models', {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      console.log('📥 Models response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📥 Models data received:', { 
          success: data.success, 
          total: data.total,
          dataLength: data.data?.length 
        })
        
        if (data.success && data.data && Array.isArray(data.data)) {
          const sortedModels = data.data.sort((a: OpenRouterModel, b: OpenRouterModel) => 
            a.id.localeCompare(b.id)
          )
          console.log('📥 Setting models:', sortedModels.length)
          setModels(sortedModels)
          setKeyStatus(prev => ({
            ...prev,
            openrouter: { ...prev.openrouter, valid: true }
          }))
        } else {
          console.warn('📥 Invalid models data structure:', data)
        }
      } else {
        console.error('📥 Models fetch failed:', response.status)
      }
    } catch (error) {
      console.error('📥 Error fetching models:', error)
    } finally {
      setIsLoadingModels(false)
    }
  }

  const saveAPIKey = async (keyType: 'openrouter' | 'groq') => {
    const keyValue = apiKeys[keyType].trim()
    console.log(`💾 Saving ${keyType} key...`)
    
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

      // Save to cookies first
      if (keyValue) {
        Cookies.set(`${keyType}_api_key`, keyValue, { expires: 30 })
        console.log(`💾 ${keyType} key saved to cookies`)
      } else {
        Cookies.remove(`${keyType}_api_key`)
        console.log(`💾 ${keyType} key removed from cookies`)
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
        console.log('💾 OpenRouter key saved, fetching models...')
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
      console.error(`❌ Error saving ${keyType} key:`, error)
    } finally {
      setSavingStates(prev => ({ ...prev, [keyType]: false }))
    }
  }

  const handleExportSettings = () => {
    try {
      const settingsJson = exportConversationSettings()
      const blob = new Blob([settingsJson], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ai-conversation-settings-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Settings Exported', {
        description: 'Your conversation settings have been downloaded.',
        duration: 3000
      })
    } catch (error) {
      toast.error('Export Failed', {
        description: 'Failed to export conversation settings.'
      })
    }
  }

  const handleImportSettings = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string
        const success = importConversationSettings(jsonString)
        
        if (success) {
          toast.success('Settings Imported', {
            description: 'Conversation settings have been imported successfully. Reload the page to see changes.',
            duration: 5000
          })
        } else {
          throw new Error('Import failed')
        }
      } catch (error) {
        toast.error('Import Failed', {
          description: 'Failed to import settings. Please check the file format.'
        })
      }
    }
    reader.readAsText(file)
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleResetAllSettings = () => {
    try {
      const success = resetConversationSettings()
      
      if (success) {
        toast.success('Settings Reset', {
          description: 'All conversation settings have been reset to defaults. Reload the page to see changes.',
          duration: 5000
        })
      } else {
        throw new Error('Reset failed')
      }
    } catch (error) {
      toast.error('Reset Failed', {
        description: 'Failed to reset conversation settings.'
      })
    }
  }

  const hasValidOpenRouterKey = keyStatus.openrouter.saved && keyStatus.openrouter.valid

  console.log('🔧 Render state:', {
    isOpen,
    modelsCount: models.length,
    isLoadingModels,
    hasValidOpenRouterKey,
    openrouterKeyStatus: keyStatus.openrouter
  })

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        className="w-full sm:max-w-6xl max-h-screen overflow-hidden flex flex-col"
        style={{ height: '100vh' }}
      >
        <SheetHeader className="pb-4 flex-shrink-0">
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
            
            {/* Settings Management Buttons */}
            {!isSharedView && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportSettings}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleImportSettings}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetAllSettings}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </div>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="api-keys" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
              <TabsTrigger value="api-keys" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                API Keys
              </TabsTrigger>
              <TabsTrigger value="agents" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                AI Agents ({models.length} models)
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden mt-6">
              <TabsContent value="api-keys" className="h-full mt-0">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-6 pb-8">
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

                        {/* Settings Management Info */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                              <Save className="h-4 w-4" />
                              Settings Management
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                              Your conversation settings are automatically saved to your browser's localStorage. 
                              You can export, import, or reset all settings using the buttons above.
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs">
                              <Badge variant="outline">Auto-save enabled</Badge>
                              <Badge variant="outline">Export/Import JSON</Badge>
                              <Badge variant="outline">Reset to defaults</Badge>
                            </div>
                          </CardContent>
                        </Card>
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
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="agents" className="h-full mt-0">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-6 pb-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="min-h-[600px]">
                        <AIAgentCard
                          agent={ai1Config}
                          models={models}
                          isLoadingModels={isLoadingModels}
                          onChange={onAI1ConfigChange}
                          disabled={isSharedView}
                        />
                      </div>
                      
                      <div className="min-h-[600px]">
                        <AIAgentCard
                          agent={ai2Config}
                          models={models}
                          isLoadingModels={isLoadingModels}
                          onChange={onAI2ConfigChange}
                          disabled={isSharedView}
                        />
                      </div>
                    </div>

                    {/* NEW: Common System Instruction Section */}
                    {!isSharedView && (
                      <>
                        <Separator />
                        
                        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                          <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                                <MessageCircle className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">Common System Instruction for Both AI</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                  This instruction is added to both AI agents' system prompts during conversations
                                </p>
                              </div>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="space-y-4">
                            <div className="space-y-3">
                              <Label className="text-sm font-medium">System Instruction</Label>
                              <Textarea
                                value={commonSystemInstruction}
                                onChange={(e) => onCommonSystemInstructionChange(e.target.value)}
                                placeholder="Enter instructions that will be applied to both AI agents during conversations..."
                                className="min-h-[120px] resize-none text-sm"
                                disabled={isSharedView}
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Shared by both AI agents during conversations</span>
                                <span>{commonSystemInstruction.length} characters</span>
                              </div>
                            </div>
                            
                            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                              <div className="flex items-center gap-2 mb-1">
                                <Bot className="h-4 w-4" />
                                <span className="font-medium">How it works</span>
                              </div>
                              <p>
                                This instruction is automatically appended to each AI's individual system prompt 
                                during conversations, ensuring consistent behaviour across both agents.
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}

                    {!hasValidOpenRouterKey && !isSharedView && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Configure your OpenRouter API key in the API Keys tab to select models for your AI agents.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Agent Settings Persistence Info */}
                    {!isSharedView && (
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Save className="h-3 w-3" />
                              <span className="font-medium">Agent Settings Auto-Save</span>
                            </div>
                            <p>All changes to your AI agent configurations are automatically saved to your browser storage and will persist between sessions.</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </SheetContent>
    </Sheet>
  )
}