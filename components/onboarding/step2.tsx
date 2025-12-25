"use client"

import { FieldErrors } from "react-hook-form"
import { Target } from "lucide-react"
import { motion } from "motion/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type OnboardingFormData = {
  company_name: string
  industry: string
  business_focus: string
  target_market: string
  intent_priorities: {
    highest_value: string[]
    strategic_focus: string[]
  }
  client_specific_guidance: string
  industry_context: string
  success_metrics: string[]
}

interface Step2Props {
  errors: FieldErrors<OnboardingFormData>
  highestValue: string[]
  strategicFocus: string[]
  addFormArrayItem: (field: "intent_priorities.highest_value" | "intent_priorities.strategic_focus" | "success_metrics") => void
  removeFormArrayItem: (field: "intent_priorities.highest_value" | "intent_priorities.strategic_focus" | "success_metrics", index: number) => void
  updateFormArrayItem: (field: "intent_priorities.highest_value" | "intent_priorities.strategic_focus" | "success_metrics", index: number, value: string) => void
}

export default function Step2({ 
  errors, 
  highestValue, 
  strategicFocus, 
  addFormArrayItem, 
  removeFormArrayItem, 
  updateFormArrayItem 
}: Step2Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3 }}
      key="intent-priorities"
    >
      <Card className="min-h-[500px] flex flex-col shadow-2xl">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Intent Priorities
            </span>
          </CardTitle>
          <CardDescription>Define your highest value prospects and strategic focus areas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex-1">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Highest Value Prospects *</label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => addFormArrayItem("intent_priorities.highest_value")}
              >
                Add Item
              </Button>
            </div>
            <div className="space-y-3">
              {highestValue?.map((_, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Highest value priority ${index + 1}`}
                    value={highestValue[index]}
                    onChange={(e) => updateFormArrayItem("intent_priorities.highest_value", index, e.target.value)}
                  />
                  {highestValue.length > 1 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => removeFormArrayItem("intent_priorities.highest_value", index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              {errors.intent_priorities?.highest_value && (
                <p className="text-sm text-destructive">{errors.intent_priorities.highest_value.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Strategic Focus Areas *</label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => addFormArrayItem("intent_priorities.strategic_focus")}
              >
                Add Item
              </Button>
            </div>
            <div className="space-y-3">
              {strategicFocus?.map((_, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Strategic focus area ${index + 1}`}
                    value={strategicFocus[index]}
                    onChange={(e) => updateFormArrayItem("intent_priorities.strategic_focus", index, e.target.value)}
                  />
                  {strategicFocus.length > 1 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => removeFormArrayItem("intent_priorities.strategic_focus", index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              {errors.intent_priorities?.strategic_focus && (
                <p className="text-sm text-destructive">{errors.intent_priorities.strategic_focus.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}