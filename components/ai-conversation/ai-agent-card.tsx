// components/ai-conversation/ai-agent-card.tsx - MUCH TALLER VERSION
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

  // Debug logging
  React.useEffect(() => {
    console.log(`🎭 AIAgentCard ${agent.id} received:`, {
      modelsCount: models?.length || 0,
      isLoadingModels,
      disabled,
      agentName: agent.name,
      currentModel: agent.model
    })
  }, [models, isLoadingModels, disabled, agent])

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
      "group relative overflow-visible transition-all duration-300",
      "hover:shadow-lg hover:shadow-primary/5",
      `bg-gradient-to-br ${colors.primary}`,
      colors.border,
      // MUCH TALLER CARD - This is the key fix!
      "min-h-[800px] h-auto",
      className
    )}>
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/50 to-background/30 backdrop-blur-sm" />
      
      <CardHeader className="relative pb-6">
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
              <div className="flex items-center gap-2">
                <Input
                  value={agent.name}
                  onChange={(e) => onChange({ name: e.target.value })}
                  className="h-8 text-base font-semibold bg-transparent border-none p-0 focus-visible:ring-0 min-w-[120px]"
                  disabled={disabled}
                />
                <Badge variant="outline" className="text-sm">
                  {agent.id.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {selectedModel && (
                  <>
                    <Brain className="h-4 w-4" />
                    <span className="truncate max-w-[250px]">{selectedModel.id}</span>
                  </>
                )}
                {agent.tts.enabled && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <Volume2 className="h-4 w-4" />
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

      <CardContent className="relative space-y-8 pb-8">
        {/* Model Selection - MUCH MORE SPACE */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <Label className="text-base font-medium">AI Model</Label>
          </div>
          
          {/* THIS IS THE KEY - LOTS OF SPACE FOR DROPDOWN */}
          <div className="min-h-[300px] relative">
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
          <div className="space-y-8 animate-in slide-in-from-top-2 duration-200">
            <Separator />
            
            {/* Parameters Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-muted-foreground" />
                <h4 className="text-base font-medium">Parameters</h4>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-4">
                  <Label className="text-sm">Temperature: {agent.temperature}</Label>
                  <div className="space-y-3">
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
                
                <div className="space-y-4">
                  <Label className="text-sm">Max Tokens: {agent.maxTokens}</Label>
                  <div className="space-y-3">
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
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-muted-foreground" />
                  <h4 className="text-base font-medium">Text-to-Speech</h4>
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
                <Select
                  value={agent.tts.voice}
                  onValueChange={handleVoiceChange}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
                className="min-h-[120px] resize-none text-sm"
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