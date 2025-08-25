"use client"

import * as React from "react"
import { UseFormRegister, FieldErrors } from "react-hook-form"
import { Lightbulb } from "lucide-react"
import { motion } from "motion/react"

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

interface Step3Props {
  register: UseFormRegister<OnboardingFormData>
  errors: FieldErrors<OnboardingFormData>
}

export default function Step3({ register, errors }: Step3Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3 }}
      key="guidance-context"
    >
      <Card className="min-h-[500px] flex flex-col">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Guidance & Context
            </span>
          </CardTitle>
          <CardDescription>Provide specific guidance and industry context</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex-1">
          <div className="space-y-2">
            <label htmlFor="client_specific_guidance" className="text-sm font-medium">
              Client Specific Guidance *
            </label>
            <textarea
              id="client_specific_guidance"
              className="w-full min-h-[120px] p-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Provide detailed guidance on your ideal prospects, targeting criteria, and key messaging points..."
              {...register("client_specific_guidance")}
            />
            {errors.client_specific_guidance && (
              <p className="text-sm text-destructive">{errors.client_specific_guidance.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="industry_context" className="text-sm font-medium">
              Industry Context *
            </label>
            <textarea
              id="industry_context"
              className="w-full min-h-[120px] p-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Describe current market dynamics, trends, and opportunities in your industry..."
              {...register("industry_context")}
            />
            {errors.industry_context && (
              <p className="text-sm text-destructive">{errors.industry_context.message}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}