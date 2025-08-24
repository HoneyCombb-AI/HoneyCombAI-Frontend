"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Building2, Target, Lightbulb, TrendingUp, CheckCircle } from "lucide-react"
import { motion } from "motion/react"
import axios from "axios"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

const onboardingSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  industry: z.string().min(1, "Industry is required"),
  business_focus: z.string().min(1, "Business focus is required"),
  target_market: z.string().min(1, "Target market is required"),
  intent_priorities: z.object({
    highest_value: z.array(z.string()).min(1, "At least one highest value priority is required"),
    strategic_focus: z.array(z.string()).min(1, "At least one strategic focus is required")
  }),
  client_specific_guidance: z.string().min(1, "Client specific guidance is required"),
  industry_context: z.string().min(1, "Industry context is required"),
  success_metrics: z.array(z.string()).min(1, "At least one success metric is required")
})

type OnboardingFormData = z.infer<typeof onboardingSchema>



export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = React.useState(1)
  const [highestValueInputs, setHighestValueInputs] = React.useState<string[]>([''])
  const [strategicFocusInputs, setStrategicFocusInputs] = React.useState<string[]>([''])
  const [successMetricsInputs, setSuccessMetricsInputs] = React.useState<string[]>([''])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    trigger,
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      company_name: "",
      industry: "",
      business_focus: "",
      target_market: "",
      intent_priorities: {
        highest_value: [],
        strategic_focus: []
      },
      client_specific_guidance: "",
      industry_context: "",
      success_metrics: []
    }
  })

  const addHighestValueInput = () => {
    if (highestValueInputs.length >= 10) {
      toast.error("Maximum 10 highest value priorities allowed")
      return
    }
    setHighestValueInputs(prev => ['', ...prev])
  }

  const removeHighestValueInput = (index: number) => {
    const newInputs = highestValueInputs.filter((_, i) => i !== index)
    setHighestValueInputs(newInputs)

    const currentValues = watch("intent_priorities.highest_value") || []
    const newValues = currentValues.filter((_, i) => i !== index)
    setValue("intent_priorities.highest_value", newValues)
  }

  const addStrategicFocusInput = () => {
    if (strategicFocusInputs.length >= 10) {
      toast.error("Maximum 10 strategic focus areas allowed")
      return
    }
    setStrategicFocusInputs(prev => ['', ...prev])
  }

  const removeStrategicFocusInput = (index: number) => {
    const newInputs = strategicFocusInputs.filter((_, i) => i !== index)
    setStrategicFocusInputs(newInputs)

    const currentValues = watch("intent_priorities.strategic_focus") || []
    const newValues = currentValues.filter((_, i) => i !== index)
    setValue("intent_priorities.strategic_focus", newValues)
  }

  const addSuccessMetricInput = () => {
    if (successMetricsInputs.length >= 10) {
      toast.error("Maximum 10 success metrics allowed")
      return
    }
    setSuccessMetricsInputs(prev => ['', ...prev])
  }

  const removeSuccessMetricInput = (index: number) => {
    const newInputs = successMetricsInputs.filter((_, i) => i !== index)
    setSuccessMetricsInputs(newInputs)

    const currentValues = watch("success_metrics") || []
    const newValues = currentValues.filter((_, i) => i !== index)
    setValue("success_metrics", newValues)
  }

  const updateHighestValueArray = (index: number, value: string) => {
    if (!value.trim()) return // Prevent empty values

    const currentValues = watch("intent_priorities.highest_value") || []
    const newValues = [...currentValues]
    newValues[index] = value
    setValue("intent_priorities.highest_value", newValues)
  }

  const updateStrategicFocusArray = (index: number, value: string) => {
    if (!value.trim()) return // Prevent empty values

    const currentValues = watch("intent_priorities.strategic_focus") || []
    const newValues = [...currentValues]
    newValues[index] = value
    setValue("intent_priorities.strategic_focus", newValues)
  }

  const updateSuccessMetricsArray = (index: number, value: string) => {
    if (!value.trim()) return // Prevent empty values

    const currentValues = watch("success_metrics") || []
    const newValues = [...currentValues]
    newValues[index] = value
    setValue("success_metrics", newValues)
  }

  const validateAndProceedToStep2 = async () => {
    const isValid = await trigger(['company_name', 'industry', 'business_focus', 'target_market'])
    if (isValid) {
      setCurrentStep(2)
    }
  }

  const validateAndProceedToStep3 = async () => {
    const isValid = await trigger(['intent_priorities.highest_value', 'intent_priorities.strategic_focus'])
    if (isValid) {
      setCurrentStep(3)
    }
  }

  const validateAndProceedToStep4 = async () => {
    const isValid = await trigger(['client_specific_guidance', 'industry_context'])
    if (isValid) {
      setCurrentStep(4)
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onFormSubmit = async (data: OnboardingFormData) => {
    try {
      const response = await axios.post('/api/onboarding', data, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log("Enriched onboarding data:", response.data.data)
      toast.success("Onboarding completed successfully!")
    } catch (error) {
      console.error("Error submitting onboarding form:", error)
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || "Failed to process onboarding data"
        toast.error(errorMessage)
      } else {
        toast.error("Something went wrong. Please try again.")
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-4 space-y-4">
      <motion.div
        className="text-center space-y-1"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">Honey Comb AI</h1>
        <p className="text-muted-foreground">
          Help us understand your business so we can provide personalized insights
        </p>
      </motion.div>

      <form onSubmit={handleSubmit(onFormSubmit)}>
        <div className="flex flex-col items-center">
          {/* Navigation Steps */}
          <div className="flex gap-4 mb-6">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`w-3 h-3 rounded-full ${currentStep >= step ? 'bg-primary' : 'bg-muted'
                  }`}
              />
            ))}
          </div>

          {/* Card Container with fixed height */}
          <div className="w-full max-w-md flex flex-col min-h-[600px]">
            <div className="flex-1">
              {/* Only render the current step */}
              {currentStep === 1 && (
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
                      <CardDescription>
                        Tell us about your company and what you do
                      </CardDescription>
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
              )}

              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: -100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  transition={{ duration: 0.3 }}
                  key="intent-priorities"
                >
                  <Card className="min-h-[500px] flex flex-col">
                    <CardHeader className="space-y-1 pb-4">
                      <CardTitle className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          Intent Priorities
                        </span>
                      </CardTitle>
                      <CardDescription>
                        Define your highest value prospects and strategic focus areas
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Highest Value Prospects *</label>
                          <Button type="button" variant="outline" size="sm" onClick={addHighestValueInput}>
                            Add Item
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {highestValueInputs.map((_, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                placeholder={`Highest value priority ${index + 1}`}
                                onChange={(e) => updateHighestValueArray(index, e.target.value)}
                              />
                              {highestValueInputs.length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeHighestValueInput(index)}
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
                          <Button type="button" variant="outline" size="sm" onClick={addStrategicFocusInput}>
                            Add Item
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {strategicFocusInputs.map((_, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                placeholder={`Strategic focus area ${index + 1}`}
                                onChange={(e) => updateStrategicFocusArray(index, e.target.value)}
                              />
                              {strategicFocusInputs.length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeStrategicFocusInput(index)}
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
              )}

              {currentStep === 3 && (
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
                      <CardDescription>
                        Provide specific guidance and industry context
                      </CardDescription>
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
              )}

              {currentStep === 4 && (
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
                      <CardDescription>
                        Define how you'll measure success
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Success Metrics *</label>
                        <Button type="button" variant="outline" size="sm" onClick={addSuccessMetricInput}>
                          Add Metric
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {successMetricsInputs.map((_, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              placeholder={`Success metric ${index + 1}`}
                              onChange={(e) => updateSuccessMetricsArray(index, e.target.value)}
                            />
                            {successMetricsInputs.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeSuccessMetricInput(index)}
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
              )}
            </div>

            {/* Navigation Buttons - Now in a fixed position relative to container */}
            <div className="flex justify-between py-4 mt-auto">
              <Button
                type="button"
                variant="link"
                onClick={goToPreviousStep}
                disabled={currentStep === 1}
                className="w-[100px] cursor-pointer transition-colors hover:bg-primary/10"
              >
                Previous
              </Button>

              {currentStep < 4 ? (
                <Button
                  type="button"
                  className="w-[100px] cursor-pointer transition-colors hover:bg-primary/10"
                  variant="link"
                  onClick={() => {
                    switch (currentStep) {
                      case 1:
                        validateAndProceedToStep2()
                        break
                      case 2:
                        validateAndProceedToStep3()
                        break
                      case 3:
                        validateAndProceedToStep4()
                        break
                    }
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-[100px] cursor-pointer transition-colors hover:bg-primary/10"
                >
                  {isSubmitting ? "Completing..." : "Complete"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}