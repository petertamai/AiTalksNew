// components/ai-conversation/ai-agent-card.tsx - Enhanced with prominent name editing
"use client"

import * as React from "react"
import { 
  Bot, 
  Settings, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Sliders,
  Mic,
  Brain,
  Zap,
  Edit3,
  Check,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ModelSelector } from "./advanced-model-selector"
import { AIAgent, OpenRouterModel, VoiceOption } from "@/types"

interface AIAgentCardProps {
  agent: AIAgent
  models: OpenRouterModel[]
  isLoadingModels?: boolean
  onChange: (updates: Partial<AIAgent>) => void
  disabled?: boolean
  className?: string
}

// Updated with actual Groq-supported voices from the API error message
const VOICE_OPTIONS: { value: VoiceOption; label: string; accent: string }[] = [
  { value: 'Aaliyah-PlayAI', label: 'Aaliyah', accent: 'Female, Expressive' },
  { value: 'Adelaide-PlayAI', label: 'Adelaide', accent: 'Female, Elegant' },
  { value: 'Angelo-PlayAI', label: 'Angelo', accent: 'Male, American' },
  { value: 'Arista-PlayAI', label: 'Arista', accent: 'Female, American' },
  { value: 'Atlas-PlayAI', label: 'Atlas', accent: 'Male, Deep' },
  { value: 'Basil-PlayAI', label: 'Basil', accent: 'Male, British' },
  { value: 'Briggs-PlayAI', label: 'Briggs', accent: 'Male, Confident' },
  { value: 'Calum-PlayAI', label: 'Calum', accent: 'Male, Scottish' },
  { value: 'Celeste-PlayAI', label: 'Celeste', accent: 'Female, Sophisticated' },
  { value: 'Cheyenne-PlayAI', label: 'Cheyenne', accent: 'Female, Western' },
  { value: 'Chip-PlayAI', label: 'Chip', accent: 'Male, Cheerful' },
  { value: 'Cillian-PlayAI', label: 'Cillian', accent: 'Male, Irish' },
  { value: 'Deedee-PlayAI', label: 'Deedee', accent: 'Female, Bubbly' },
  { value: 'Eleanor-PlayAI', label: 'Eleanor', accent: 'Female, Classic' },
  { value: 'Fritz-PlayAI', label: 'Fritz', accent: 'Male, German' },
  { value: 'Gail-PlayAI', label: 'Gail', accent: 'Female, Professional' },
  { value: 'Indigo-PlayAI', label: 'Indigo', accent: 'Neutral, Calm' },
  { value: 'Jennifer-PlayAI', label: 'Jennifer', accent: 'Female, Corporate' },
  { value: 'Judy-PlayAI', label: 'Judy', accent: 'Female, Mature' },
  { value: 'Mamaw-PlayAI', label: 'Mamaw', accent: 'Female, Southern' },
  { value: 'Mason-PlayAI', label: 'Mason', accent: 'Male, Authoritative' },
  { value: 'Mikail-PlayAI', label: 'Mikail', accent: 'Male, Eastern European' },
  { value: 'Mitch-PlayAI', label: 'Mitch', accent: 'Male, Casual' },
  { value: 'Nia-PlayAI', label: 'Nia', accent: 'Female, Modern' },
  { value: 'Quinn-PlayAI', label: 'Quinn', accent: 'Unisex, Contemporary' },
  { value: 'Ruby-PlayAI', label: 'Ruby', accent: 'Female, Vintage' },
  { value: 'Thunder-PlayAI', label: 'Thunder', accent: 'Male, Powerful' },
]

export function AIAgentCard({
  agent,
  models,
  isLoadingModels = false,
  onChange,
  disabled = false,
  className
}: AIAgentCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [isEditingName, setIsEditingName] = React.useState(false)
  const [tempName, setTempName] = React.useState(agent.name)

  // Debug logging
  React.useEffect(() => {
    console.log(`🎭 AIAgentCard ${agent.id} received:`, {
      modelsCount: models?.length || 0,
      isLoadingModels,
      disabled,
      agentName: agent.name,
      currentModel: agent.model,
      currentVoice: agent.tts.voice
    })
  }, [models, isLoadingModels, disabled, agent])

  const agentColors = {
    ai1: {
      primary: "from-blue-500/20 to-cyan-500/20",
      border: "border-blue-500/30",
      icon: "text-blue-600",
      accent: "bg-blue-500/10",
      ring: "ring-blue-500/20"
    },
    ai2: {
      primary: "from-purple-500/20 to-pink-500/20",
      border: "border-purple-500/30", 
      icon: "text-purple-600",
      accent: "bg-purple-500/10",
      ring: "ring-purple-500/20"
    }
  }

  const colors = agentColors[agent.id]
  const selectedModel = models?.find(m => m.id === agent.model)

  const handleModelChange = (modelId: string) => {
    console.log(`🎭 Model changed for ${agent.id}:`, modelId)
    onChange({ model: modelId })
  }

  const handleTTSToggle = (enabled: boolean) => {
    onChange({
      tts: { ...agent.tts, enabled }
    })
  }

  const handleVoiceChange = (voice: VoiceOption) => {
    console.log(`🎵 Voice changed for ${agent.id}:`, voice)
    onChange({
      tts: { ...agent.tts, voice }
    })
  }

  const handleTemperatureChange = (value: number[]) => {
    onChange({ temperature: value[0] })
  }

  const handleMaxTokensChange = (value: number[]) => {
    onChange({ maxTokens: value[0] })
  }

  const handleNameSave = () => {
    if (tempName.trim() && tempName !== agent.name) {
      onChange({ name: tempName.trim() })
    }
    setIsEditingName(false)
  }

  const handleNameCancel = () => {
    setTempName(agent.name)
    setIsEditingName(false)
  }

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave()
    } else if (e.key === 'Escape') {
      handleNameCancel()
    }
  }

  // Check if current voice is supported by Groq
  const isVoiceSupported = VOICE_OPTIONS.some(option => option.value === agent.tts.voice)
  
  // If current voice is not supported, suggest a replacement
  React.useEffect(() => {
    if (!isVoiceSupported && agent.tts.voice) {
      console.warn(`⚠️ Voice ${agent.tts.voice} not supported by Groq. Available voices:`, VOICE_OPTIONS.map(v => v.value))
      
      // Auto-fix with a similar voice
      const fallbackVoice = agent.id === 'ai1' ? 'Arista-PlayAI' : 'Angelo-PlayAI'
      if (agent.tts.voice !== fallbackVoice) {
        console.log(`🔧 Auto-fixing ${agent.id} voice from ${agent.tts.voice} to ${fallbackVoice}`)
        handleVoiceChange(fallbackVoice)
      }
    }
  }, [agent.tts.voice, isVoiceSupported, agent.id])

  return (
    <Card className={cn(
      "group relative overflow-visible transition-all duration-300",
      "hover:shadow-lg hover:shadow-primary/5",
      `bg-gradient-to-br ${colors.primary}`,
      colors.border,
      "h-[80vh] flex flex-col",
      className
    )}>
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/50 to-background/30 backdrop-blur-sm" />
      
      <CardHeader className="relative pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center",
              colors.accent,
              colors.border
            )}>
              <Bot className={cn("h-6 w-6", colors.icon)} />
            </div>
            <div className="space-y-2">
              {/* ENHANCED NAME EDITING SECTION */}
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={handleNameKeyDown}
                      className={cn(
                        "h-8 text-base font-semibold bg-background/50 border px-2",
                        "focus:ring-2", colors.ring
                      )}
                      placeholder="Enter agent name..."
                      disabled={disabled}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleNameSave}
                      className="h-6 w-6 p-0 text-green-600 hover:bg-green-100"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleNameCancel}
                      className="h-6 w-6 p-0 text-gray-500 hover:bg-gray-100"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group/name">
                    <span className="text-base font-semibold">
                      {agent.name}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditingName(true)}
                      className="h-6 w-6 p-0 opacity-0 group-hover/name:opacity-100 transition-opacity"
                      disabled={disabled}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <Badge variant="outline" className="text-sm">
                  {agent.id.toUpperCase()}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {selectedModel && (
                  <>
                    <Brain className="h-4 w-4" />
                    <span className="truncate max-w-[200px]">{selectedModel.id}</span>
                  </>
                )}
                {agent.tts.enabled && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <Volume2 className="h-4 w-4" />
                    <span>{agent.tts.voice.replace('-PlayAI', '')}</span>
                    {!isVoiceSupported && (
                      <Badge variant="destructive" className="text-xs">
                        Not Supported
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "w-10 h-10 rounded-md flex items-center justify-center",
                "hover:bg-accent transition-colors",
                colors.accent
              )}
              disabled={disabled}
            >
              <Settings className={cn(
                "h-5 w-5 transition-transform duration-200",
                isExpanded && "rotate-90"
              )} />
            </button>
          </div>
        </div>
      </CardHeader>

      {/* Scrollable Content Area */}
      <CardContent className="relative flex-1 overflow-hidden pb-4">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-6">
            {/* PROMINENT NAME EDITING SECTION */}
            {isExpanded && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-primary" />
                  <Label className="text-base font-medium">Agent Identity</Label>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Agent Name</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={agent.name}
                        onChange={(e) => onChange({ name: e.target.value })}
                        placeholder="Enter a unique name for this AI agent..."
                        className={cn(
                          "text-sm focus:ring-2", 
                          colors.ring
                        )}
                        disabled={disabled}
                      />
                      <Badge variant="secondary" className="text-xs">
                        {agent.id.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Give your AI agent a unique name that reflects its personality and role.
                    </p>
                  </div>
                </div>
                
                <Separator />
              </div>
            )}

            {/* Model Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <Label className="text-base font-medium">AI Model</Label>
              </div>
              
              <div className="relative z-50">
                <ModelSelector
                  models={models || []}
                  value={agent.model}
                  onValueChange={handleModelChange}
                  placeholder={`Select ${agent.name} model...`}
                  disabled={disabled || isLoadingModels}
                  isLoading={isLoadingModels}
                  agentName={agent.name}
                />
              </div>
            </div>

            {/* Expanded Configuration */}
            {isExpanded && (
              <div className="space-y-6 animate-in slide-in-from-top-2 duration-200">
                <Separator />
                
                {/* Parameters Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sliders className="h-5 w-5 text-muted-foreground" />
                    <h4 className="text-base font-medium">Parameters</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-3">
                      <Label className="text-sm">Temperature: {agent.temperature}</Label>
                      <div className="space-y-2">
                        <Slider
                          value={[agent.temperature]}
                          onValueChange={handleTemperatureChange}
                          max={2}
                          min={0}
                          step={0.1}
                          className="w-full"
                          disabled={disabled}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Conservative (0)</span>
                          <span>Creative (2)</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Label className="text-sm">Max Tokens: {agent.maxTokens}</Label>
                      <div className="space-y-2">
                        <Slider
                          value={[agent.maxTokens]}
                          onValueChange={handleMaxTokensChange}
                          max={8000}
                          min={50}
                          step={50}
                          className="w-full"
                          disabled={disabled}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Short (50)</span>
                          <span>Long (8K)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TTS Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mic className="h-5 w-5 text-muted-foreground" />
                      <h4 className="text-base font-medium">Text-to-Speech (Groq)</h4>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={`${agent.id}-tts`}
                        checked={agent.tts.enabled}
                        onCheckedChange={handleTTSToggle}
                        disabled={disabled}
                      />
                      <Label 
                        htmlFor={`${agent.id}-tts`} 
                        className="text-sm cursor-pointer"
                      >
                        {agent.tts.enabled ? 'Enabled' : 'Disabled'}
                      </Label>
                    </div>
                  </div>
                  
                  {agent.tts.enabled && (
                    <div className="space-y-3">
                      <Select
                        value={agent.tts.voice}
                        onValueChange={handleVoiceChange}
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {VOICE_OPTIONS.map((voice) => (
                            <SelectItem key={voice.value} value={voice.value}>
                              <div className="flex flex-col py-1">
                                <span className="font-medium">{voice.label}</span>
                                <span className="text-xs text-muted-foreground">
                                  {voice.accent}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {!isVoiceSupported && (
                        <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-600">⚠️</span>
                            <span className="font-medium">Voice Not Supported</span>
                          </div>
                          <p className="mt-1">
                            The selected voice "{agent.tts.voice}" is not supported by Groq. 
                            Please select a different voice from the list above.
                          </p>
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <Sparkles className="h-3 w-3" />
                          <span className="font-medium">Groq TTS Info</span>
                        </div>
                        <p>{VOICE_OPTIONS.length} premium voices available • Ultra-fast generation • High quality audio</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* System Prompt */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-muted-foreground" />
                    <Label className="text-base font-medium">System Prompt</Label>
                  </div>
                  <Textarea
                    value={agent.prompt}
                    onChange={(e) => onChange({ prompt: e.target.value })}
                    placeholder={`Instructions for ${agent.name} behavior...`}
                    className="min-h-[100px] resize-none text-sm"
                    disabled={disabled}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Define your AI's personality and behavior</span>
                    <span>{agent.prompt.length} characters</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}