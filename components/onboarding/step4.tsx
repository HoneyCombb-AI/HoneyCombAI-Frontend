"use client"

import * as React from "react"
import { FieldErrors } from "react-hook-form"
import { TrendingUp } from "lucide-react"
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

interface Step4Props {
  errors: FieldErrors<OnboardingFormData>
  successMetrics: string[]
  addFormArrayItem: (field: "intent_priorities.highest_value" | "intent_priorities.strategic_focus" | "success_metrics") => void
  removeFormArrayItem: (field: "intent_priorities.highest_value" | "intent_priorities.strategic_focus" | "success_metrics", index: number) => void
  updateFormArrayItem: (field: "intent_priorities.highest_value" | "intent_priorities.strategic_focus" | "success_metrics", index: number, value: string) => void
}

export default function Step4({ 
  errors, 
  successMetrics, 
  addFormArrayItem, 
  removeFormArrayItem, 
  updateFormArrayItem 
}: Step4Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3 }}
      key="success-metrics"
    >
      <Card className="min-h-[500px] flex flex-col">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Success Metrics
          </CardTitle>
          <CardDescription>Define how you'll measure success</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Success Metrics *</label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => addFormArrayItem("success_metrics")}
            >
              Add Metric
            </Button>
          </div>
          <div className="space-y-3">
            {successMetrics?.map((_, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`Success metric ${index + 1}`}
                  value={successMetrics[index]}
                  onChange={(e) => updateFormArrayItem("success_metrics", index, e.target.value)}
                />
                {successMetrics.length > 1 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => removeFormArrayItem("success_metrics", index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            {errors.success_metrics && (
              <p className="text-sm text-destructive">{errors.success_metrics.message}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}