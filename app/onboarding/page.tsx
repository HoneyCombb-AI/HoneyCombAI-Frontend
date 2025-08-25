"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion } from "motion/react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Step1 from "@/components/onboarding/step1"
import Step2 from "@/components/onboarding/step2"
import Step3 from "@/components/onboarding/step3"
import Step4 from "@/components/onboarding/step4"
import Step5 from "@/components/onboarding/step5"

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
  const [editableData, setEditableData] = React.useState<OnboardingFormData | null>(null)
  const [isSubmittingFinal, setIsSubmittingFinal] = React.useState(false)
  const router = useRouter()

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
        highest_value: [""],
        strategic_focus: [""],
      },
      client_specific_guidance: "",
      industry_context: "",
      success_metrics: [""],
    },
  })

  // ---------- Helpers for Steps 2 & 4 (single source of truth = RHF) ----------
  const addFormArrayItem = (field:
    | "intent_priorities.highest_value"
    | "intent_priorities.strategic_focus"
    | "success_metrics") => {
    const current = (watch(field as any) as string[]) || []
    if (current.length >= 10) {
      const label =
        field === "success_metrics"
          ? "Maximum 10 success metrics allowed"
          : field.endsWith("highest_value")
            ? "Maximum 10 highest value priorities allowed"
            : "Maximum 10 strategic focus areas allowed"
      toast.error(label)
      return
    }
    setValue(field as any, [...current, ""])
  }

  const removeFormArrayItem = (
    field:
      | "intent_priorities.highest_value"
      | "intent_priorities.strategic_focus"
      | "success_metrics",
    index: number
  ) => {
    const current = (watch(field as any) as string[]) || []
    const next = current.filter((_, i) => i !== index)
    // Keep at least one item to satisfy schema min(1)
    setValue(field as any, next.length > 0 ? next : [""])
  }

  const updateFormArrayItem = (
    field:
      | "intent_priorities.highest_value"
      | "intent_priorities.strategic_focus"
      | "success_metrics",
    index: number,
    value: string
  ) => {
    const current = (watch(field as any) as string[]) || []
    const next = [...current]
    next[index] = value
    setValue(field as any, next)
  }

  // ---------- Step navigation validation ----------
  const validateAndProceedToStep2 = async () => {
    const isValid = await trigger(["company_name", "industry", "business_focus", "target_market"])
    if (isValid) setCurrentStep(2)
  }

  const validateAndProceedToStep3 = async () => {
    const isValid = await trigger(["intent_priorities.highest_value", "intent_priorities.strategic_focus"])
    if (isValid) setCurrentStep(3)
  }

  const validateAndProceedToStep4 = async () => {
    const isValid = await trigger(["client_specific_guidance", "industry_context"])
    if (isValid) setCurrentStep(4)
  }

  const goToPreviousStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  // ---------- Prevent auto-submission, only allow manual submit ----------
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (currentStep !== 4) return
    handleSubmit(onFormSubmit)()
  }

  // ---------- Submit after Step 4 (enrichment) ----------
  const onFormSubmit = async (data: OnboardingFormData) => {
    try {
      const response = await axios.post("/api/onboarding", data, {
        headers: { "Content-Type": "application/json" },
      })
      setEditableData(response.data.data)
      setCurrentStep(5)
      toast.success("AI data enrichment completed!")
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

  // ---------- Step 5 editing helpers (memoized) ----------
  const updateEditableField = React.useCallback(
    (field: string, value: any) => {
      if (!editableData) return

      if (field.includes(".")) {
        const [parent, child] = field.split(".")
        if (parent === "intent_priorities") {
          setEditableData((prev) => ({
            ...prev!,
            intent_priorities: {
              ...prev!.intent_priorities,
              [child]: value,
            },
          }))
        }
      } else {
        setEditableData((prev) => ({
          ...prev!,
          [field as keyof OnboardingFormData]: value,
        }))
      }
    },
    [editableData]
  )

  const addEditableArrayItem = React.useCallback(
    (field: string) => {
      if (!editableData) return

      if (field === "intent_priorities.highest_value") {
        setEditableData((prev) => ({
          ...prev!,
          intent_priorities: {
            ...prev!.intent_priorities,
            highest_value: [...prev!.intent_priorities.highest_value, ""],
          },
        }))
      } else if (field === "intent_priorities.strategic_focus") {
        setEditableData((prev) => ({
          ...prev!,
          intent_priorities: {
            ...prev!.intent_priorities,
            strategic_focus: [...prev!.intent_priorities.strategic_focus, ""],
          },
        }))
      } else if (field === "success_metrics") {
        setEditableData((prev) => ({
          ...prev!,
          success_metrics: [...prev!.success_metrics, ""],
        }))
      }
    },
    [editableData]
  )

  const removeEditableArrayItem = React.useCallback(
    (field: string, index: number) => {
      if (!editableData) return

      if (field === "intent_priorities.highest_value") {
        setEditableData((prev) => ({
          ...prev!,
          intent_priorities: {
            ...prev!.intent_priorities,
            highest_value: prev!.intent_priorities.highest_value.filter((_, i) => i !== index),
          },
        }))
      } else if (field === "intent_priorities.strategic_focus") {
        setEditableData((prev) => ({
          ...prev!,
          intent_priorities: {
            ...prev!.intent_priorities,
            strategic_focus: prev!.intent_priorities.strategic_focus.filter((_, i) => i !== index),
          },
        }))
      } else if (field === "success_metrics") {
        setEditableData((prev) => ({
          ...prev!,
          success_metrics: prev!.success_metrics.filter((_, i) => i !== index),
        }))
      }
    },
    [editableData]
  )

  const updateEditableArrayItem = React.useCallback(
    (field: string, index: number, value: string) => {
      if (!editableData) return

      if (field === "intent_priorities.highest_value") {
        const newArray = [...editableData.intent_priorities.highest_value]
        newArray[index] = value
        setEditableData((prev) => ({
          ...prev!,
          intent_priorities: { ...prev!.intent_priorities, highest_value: newArray },
        }))
      } else if (field === "intent_priorities.strategic_focus") {
        const newArray = [...editableData.intent_priorities.strategic_focus]
        newArray[index] = value
        setEditableData((prev) => ({
          ...prev!,
          intent_priorities: { ...prev!.intent_priorities, strategic_focus: newArray },
        }))
      } else if (field === "success_metrics") {
        const newArray = [...editableData.success_metrics]
        newArray[index] = value
        setEditableData((prev) => ({
          ...prev!,
          success_metrics: newArray,
        }))
      }
    },
    [editableData]
  )

  const onFinalConfirm = async () => {
    if (!editableData) {
      toast.error("No data to submit")
      return
    }

    setIsSubmittingFinal(true)
    
    try {
      const response = await axios.post("/api/onboarding/clientContext", editableData, {
        headers: { "Content-Type": "application/json" },
      })

      if (response.data.success) {
        toast.success("Onboarding completed successfully!")        
        router.replace("/contacts?joyride=true");
      } else {
        toast.error(response.data.error)
        throw new Error(response.data.error || "Failed to save onboarding data")
      }
    } catch (error) {
      console.error("Error saving final onboarding data:", error)
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || "Failed to complete onboarding"
        toast.error(errorMessage)
      } else {
        toast.error("Something went wrong. Please try again.")
      }
    } finally {
      setIsSubmittingFinal(false)
    }
  }

  // ---------- Watched arrays for Steps 2 & 4 ----------
  const highestValue = watch("intent_priorities.highest_value")
  const strategicFocus = watch("intent_priorities.strategic_focus")
  const successMetrics = watch("success_metrics")

  return (
    <div className="mx-auto px-4 py-6 space-y-6">
      <motion.div
        className="text-center space-y-1"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">Honey Comb AI</h1>
        <p className="text-muted-foreground">Help us understand your business so we can provide personalized insights</p>
      </motion.div>

      <form onSubmit={handleFormSubmit}>
        <div className="flex flex-col items-center">
          {/* Navigation Steps */}
          <div className="flex gap-4 mb-6">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className={`w-3 h-3 rounded-full ${currentStep >= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>

          {/* Card Container with fixed height */}
          <div className={`w-full flex flex-col  ${currentStep === 5 ? "max-w-6xl" : "max-w-md"}`}>
            <div className="flex-1">
              {/* Step 1 */}
              {currentStep === 1 && (
                <Step1 register={register} errors={errors} />
              )}

              {/* Step 2 */}
              {currentStep === 2 && (
                <Step2
                  errors={errors}
                  highestValue={highestValue}
                  strategicFocus={strategicFocus}
                  addFormArrayItem={addFormArrayItem}
                  removeFormArrayItem={removeFormArrayItem}
                  updateFormArrayItem={updateFormArrayItem}
                />
              )}

              {/* Step 3 */}
              {currentStep === 3 && (
                <Step3 register={register} errors={errors} />
              )}

              {/* Step 4 */}
              {currentStep === 4 && (
                <Step4
                  errors={errors}
                  successMetrics={successMetrics}
                  addFormArrayItem={addFormArrayItem}
                  removeFormArrayItem={removeFormArrayItem}
                  updateFormArrayItem={updateFormArrayItem}
                />
              )}

              {/* Step 5 */}
              {currentStep === 5 && editableData && (
                <Step5
                  editableData={editableData}
                  updateEditableField={updateEditableField}
                  addEditableArrayItem={addEditableArrayItem}
                  removeEditableArrayItem={removeEditableArrayItem}
                  updateEditableArrayItem={updateEditableArrayItem}
                />
              )}

            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between py-4 mt-auto">
              <Button
                type="button"
                variant="link"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  goToPreviousStep()
                }}
                disabled={currentStep === 1 || currentStep ===5}
                className="cursor-pointer transition-colors hover:bg-primary/10"
              >
                Previous
              </Button>

              {currentStep < 4 ? (
                <Button
                  type="button"
                  className="cursor-pointer transition-colors hover:bg-primary/10"
                  variant="link"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
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
              ) : currentStep === 4 ? (
                <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                  {isSubmitting ? "Processing..." : "Process"}
                </Button>
              ) : (
                <Button type="button" disabled={isSubmittingFinal} onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onFinalConfirm()
                }} className="cursor-pointer">
                  {isSubmittingFinal ? "Saving..." : "Confirm"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
