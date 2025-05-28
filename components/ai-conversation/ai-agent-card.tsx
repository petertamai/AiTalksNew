// components/ai-conversation/ai-agent-card.tsx
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
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
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

const VOICE_OPTIONS: { value: VoiceOption; label: string; accent: string }[] = [
  { value: 'Arista-PlayAI', label: 'Arista', accent: 'Female, American' },
  { value: 'Angelo-PlayAI', label: 'Angelo', accent: 'Male, American' },
  { value: 'Nova-PlayAI', label: 'Nova', accent: 'Female, British' },
  { value: 'Atlas-PlayAI', label: 'Atlas', accent: 'Male, Deep' },
  { value: 'Indigo-PlayAI', label: 'Indigo', accent: 'Neutral, Calm' },
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

  const agentColors = {
    ai1: {
      primary: "from-blue-500/20 to-cyan-500/20",
      border: "border-blue-500/30",
      icon: "text-blue-600",
      accent: "bg-blue-500/10"
    },
    ai2: {
      primary: "from-purple-500/20 to-pink-500/20",
      border: "border-purple-500/30", 
      icon: "text-purple-600",
      accent: "bg-purple-500/10"
    }
  }

  const colors = agentColors[agent.id]
  const selectedModel = models.find(m => m.id === agent.model)

  const handleModelChange = (modelId: string) => {
    onChange({ model: modelId })
  }

  const handleTTSToggle = (enabled: boolean) => {
    onChange({
      tts: { ...agent.tts, enabled }
    })
  }

  const handleVoiceChange = (voice: VoiceOption) => {
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

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300",
      "hover:shadow-lg hover:shadow-primary/5",
      `bg-gradient-to-br ${colors.primary}`,
      colors.border,
      className
    )}>
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/50 to-background/30 backdrop-blur-sm" />
      
      <CardHeader className="relative pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              colors.accent,
              colors.border
            )}>
              <Bot className={cn("h-5 w-5", colors.icon)} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Input
                  value={agent.name}
                  onChange={(e) => onChange({ name: e.target.value })}
                  className="h-7 text-sm font-semibold bg-transparent border-none p-0 focus-visible:ring-0"
                  disabled={disabled}
                />
                <Badge variant="outline" className="text-xs">
                  {agent.id.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {selectedModel && (
                  <>
                    <Brain className="h-3 w-3" />
                    <span className="truncate max-w-[200px]">{selectedModel.id}</span>
                  </>
                )}
                {agent.tts.enabled && (
                  <>
                    <Separator orientation="vertical" className="h-3" />
                    <Volume2 className="h-3 w-3" />
                    <span>{agent.tts.voice.replace('-PlayAI', '')}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "w-8 h-8 rounded-md flex items-center justify-center",
                "hover:bg-accent transition-colors",
                colors.accent
              )}
              disabled={disabled}
            >
              <Settings className={cn(
                "h-4 w-4 transition-transform duration-200",
                isExpanded && "rotate-90"
              )} />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* Model Selection */}
        <ModelSelector
          models={models}
          value={agent.model}
          onValueChange={handleModelChange}
          placeholder={`Select ${agent.name} model...`}
          disabled={disabled || isLoadingModels}
          isLoading={isLoadingModels}
          agentName={agent.name}
        />

        {/* Expanded Configuration */}
        {isExpanded && (
          <div className="space-y-6 animate-in slide-in-from-top-2 duration-200">
            <Separator />
            
            {/* Parameters Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">Parameters</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Temperature</Label>
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
                      <span>0</span>
                      <span className="font-medium">{agent.temperature}</span>
                      <span>2</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Max Tokens</Label>
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
                      <span>50</span>
                      <span className="font-medium">{agent.maxTokens}</span>
                      <span>8K</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TTS Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium">Text-to-Speech</h4>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${agent.id}-tts`}
                    checked={agent.tts.enabled}
                    onCheckedChange={handleTTSToggle}
                    disabled={disabled}
                  />
                  <Label 
                    htmlFor={`${agent.id}-tts`} 
                    className="text-xs cursor-pointer"
                  >
                    {agent.tts.enabled ? 'Enabled' : 'Disabled'}
                  </Label>
                </div>
              </div>
              
              {agent.tts.enabled && (
                <Select
                  value={agent.tts.voice}
                  onValueChange={handleVoiceChange}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICE_OPTIONS.map((voice) => (
                      <SelectItem key={voice.value} value={voice.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{voice.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {voice.accent}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* System Prompt */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">System Prompt</Label>
              </div>
              <Textarea
                value={agent.prompt}
                onChange={(e) => onChange({ prompt: e.target.value })}
                placeholder={`Instructions for ${agent.name} behavior...`}
                className="min-h-[80px] resize-none"
                disabled={disabled}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Define your AI's personality and behavior</span>
                <span>{agent.prompt.length} characters</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}