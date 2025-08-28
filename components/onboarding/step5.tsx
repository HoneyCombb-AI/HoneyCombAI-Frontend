"use client"

import * as React from "react"
import { CheckCircle } from "lucide-react"
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

interface Step5Props {
  editableData: OnboardingFormData
  updateEditableField: (field: string, value: string) => void
  addEditableArrayItem: (field: string) => void
  removeEditableArrayItem: (field: string, index: number) => void
  updateEditableArrayItem: (field: string, index: number, value: string) => void
}

export default function Step5({ 
  editableData, 
  updateEditableField, 
  addEditableArrayItem, 
  removeEditableArrayItem, 
  updateEditableArrayItem 
}: Step5Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3 }}
      key="review-data"
    >
      <Card className="flex flex-col shadow-2xl">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Review & Edit Enriched Data
          </CardTitle>
          <CardDescription>
            Review and edit the AI-enriched onboarding information before final confirmation
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 flex-1 overflow-y-auto min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column  display only (no labels, no inputs) */}
            <div className="space-y-6">
              {/* Basic info with proper hierarchy */}
              <div className="space-y-3">
                {/* Company name - largest and boldest */}
                <div className="bg-muted p-4 rounded-md">
                  <div className="text-lg font-bold text-foreground">
                    {editableData.company_name}
                  </div>
                </div>
                
                {/* Other info - smaller grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-muted p-3 rounded-md">
                    <div className="text-sm text-muted-foreground mb-1">Industry</div>
                    <div className="text-sm">{editableData.industry}</div>
                  </div>
                  <div className="bg-muted p-3 rounded-md">
                    <div className="text-sm text-muted-foreground mb-1">Business Focus</div>
                    <div className="text-sm">{editableData.business_focus}</div>
                  </div>
                </div>
                
                {/* Target market - full width */}
                <div className="bg-muted p-3 rounded-md">
                  <div className="text-sm text-muted-foreground mb-1">Target Market</div>
                  <div className="text-sm">{editableData.target_market}</div>
                </div>
              </div>

              {/* Client Specific Guidance  big readable block (no label/field) */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Client Specific Guidance</label>
                <textarea
                  className="w-full h-64 p-3 mt-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y flex-shrink-0"
                  value={editableData.client_specific_guidance}
                  onChange={(e) => updateEditableField("client_specific_guidance", e.target.value)}
                  rows={8}
                />
              </div>

              {/* Industry Context  big readable block (no label/field) */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Industry Context</label>
                <textarea
                  className="w-full h-64 p-3 mt-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y flex-shrink-0"
                  value={editableData.industry_context}
                  onChange={(e) => updateEditableField("industry_context", e.target.value)}
                  rows={8}
                />
              </div>
            </div>

            {/* Right Column  keep editable arrays as-is */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Highest Value Prospects</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addEditableArrayItem("intent_priorities.highest_value")}
                  >
                    Add Item
                  </Button>
                </div>
                <div className="space-y-3">
                  {editableData.intent_priorities.highest_value.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) =>
                          updateEditableArrayItem("intent_priorities.highest_value", index, e.target.value)
                        }
                      />
                      {editableData.intent_priorities.highest_value.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeEditableArrayItem("intent_priorities.highest_value", index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Strategic Focus Areas</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addEditableArrayItem("intent_priorities.strategic_focus")}
                  >
                    Add Item
                  </Button>
                </div>
                <div className="space-y-3">
                  {editableData.intent_priorities.strategic_focus.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) =>
                          updateEditableArrayItem("intent_priorities.strategic_focus", index, e.target.value)
                        }
                      />
                      {editableData.intent_priorities.strategic_focus.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeEditableArrayItem("intent_priorities.strategic_focus", index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Success Metrics</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addEditableArrayItem("success_metrics")}
                  >
                    Add Metric
                  </Button>
                </div>
                <div className="space-y-3">
                  {editableData.success_metrics.map((metric, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={metric}
                        onChange={(e) => updateEditableArrayItem("success_metrics", index, e.target.value)}
                      />
                      {editableData.success_metrics.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeEditableArrayItem("success_metrics", index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}