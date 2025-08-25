"use client"

import * as React from "react"
import { UseFormRegister, FieldErrors } from "react-hook-form"
import { Building2 } from "lucide-react"
import { motion } from "motion/react"

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

interface Step1Props {
  register: UseFormRegister<OnboardingFormData>
  errors: FieldErrors<OnboardingFormData>
}

export default function Step1({ register, errors }: Step1Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3 }}
      key="company-info"
    >
      <Card className="min-h-[500px] flex flex-col">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Information
            </span>
          </CardTitle>
          <CardDescription>Tell us about your company and what you do</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex-1">
          <div className="space-y-2">
            <label htmlFor="company_name" className="text-sm font-medium">
              Company Name *
            </label>
            <Input
              id="company_name"
              placeholder="Enter your company name"
              {...register("company_name")}
              aria-invalid={!!errors.company_name}
            />
            {errors.company_name && (
              <p className="text-sm text-destructive">{errors.company_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="industry" className="text-sm font-medium">
              Industry *
            </label>
            <Input
              id="industry"
              placeholder="e.g., AI Agents & Sales Automation"
              {...register("industry")}
              aria-invalid={!!errors.industry}
            />
            {errors.industry && (
              <p className="text-sm text-destructive">{errors.industry.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="business_focus" className="text-sm font-medium">
              Business Focus *
            </label>
            <Input
              id="business_focus"
              placeholder="e.g., AI-Powered Lead Conversion and Sales Process Automation"
              {...register("business_focus")}
              aria-invalid={!!errors.business_focus}
            />
            {errors.business_focus && (
              <p className="text-sm text-destructive">{errors.business_focus.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="target_market" className="text-sm font-medium">
              Target Market *
            </label>
            <Input
              id="target_market"
              placeholder="e.g., B2B Startups and Scale-ups Looking to Automate Sales Processes"
              {...register("target_market")}
              aria-invalid={!!errors.target_market}
            />
            {errors.target_market && (
              <p className="text-sm text-destructive">{errors.target_market.message}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}