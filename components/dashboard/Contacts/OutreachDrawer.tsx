"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Sparkles } from "lucide-react";
import { toast } from "sonner";

const outreachSchema = z.object({
    tonality: z.enum(["AI Decided","casual", "professional", "formal", "friendly", "concise", "enthusiastic"]),
    personalization: z.string().trim().max(1000, "Personalization text must be less than 1000 characters").optional(),
});

type OutreachFormData = z.infer<typeof outreachSchema>;

interface ContactValidationData {
    isTracked: boolean;
    primaryAnalysisCompleted: boolean;
    primaryAnalysisRequested: boolean;
    full_name: string;
}

export interface OutreachDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedContacts: Map<string, ContactValidationData>;
    onSubmit: () => void;
}

const customDrawerStyles = {
    width: '32vw',
    maxWidth: '35vw'
};


export function OutreachDrawer({
    open,
    onOpenChange,
    selectedContacts,
    onSubmit,
}: OutreachDrawerProps) {
    // Filter eligible contacts (those with completed primary analysis)
    const eligibleContactIds = Array.from(selectedContacts.entries())
        .filter(([, data]) => data.primaryAnalysisCompleted)
        .map(([id]) => id);

    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<OutreachFormData>({
        resolver: zodResolver(outreachSchema),
        defaultValues: {
            tonality: "AI Decided",
            personalization: "",
        },
    });

    const onFormSubmit = async (data: OutreachFormData) => {
        try {
            const response = await axios.post("/api/contacts/outreach", {
                entity_ids: eligibleContactIds,
                entity_type: "contact_id",
                task_type: "outreach_generation",
                payload: {
                    personalization: data.personalization || undefined,
                    tonality: data.tonality,
                },
            });

            if (response.data.success) {
                toast.success(`${response.data.message}${response.data.tokens_used ? `. This will consume ${response.data.tokens_used} tokens upon completion` : ""}`);
                onSubmit();
                onOpenChange(false);
                reset();
            } else {
                toast.error(response.data.message || "Outreach generation failed");
            }
        } catch (error) {
            console.error("Outreach generation failed:", error);
            if (axios.isAxiosError(error) && error.response?.data) {
                const errorData = error.response.data;
                if (errorData.errors && Array.isArray(errorData.errors)) {
                    errorData.errors.forEach((err: { message?: string }) => {
                        toast.error(err.message || "Unknown error occurred");
                    });
                } else {
                    toast.error(errorData.message || "Outreach generation failed");
                }
            } else {
                toast.error("Network error. Please try again.");
            }
        }
    };

    return (
        <Drawer direction="left" open={open} onOpenChange={onOpenChange}>
            <DrawerContent style={customDrawerStyles}>
                <div className="mx-auto w-full h-screen flex flex-col">
                    <DrawerHeader className="sticky top-0 bg-white z-10 border-b">
                        <DrawerTitle>Personalize Outreach</DrawerTitle>
                        <p className="text-sm text-muted-foreground">
                            Generating personalized outreach for {eligibleContactIds.length} contact{eligibleContactIds.length > 1 ? 's' : ''}
                        </p>
                    </DrawerHeader>
                    <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col flex-1 overflow-y-auto">
                        <div className="px-6 py-4 space-y-6 flex-1 flex flex-col justify-between">
                            <div className="space-y-6">
                                {/* Tone Selector */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium">
                                        <MessageSquare className="h-4 w-4" />
                                        Message Tone
                                    </label>
                                    <Controller
                                        name="tonality"
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select message tone" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="AI Decided">AI Decided</SelectItem>
                                                    <SelectItem value="casual">Casual</SelectItem>
                                                    <SelectItem value="friendly">Friendly</SelectItem>
                                                    <SelectItem value="professional">Professional</SelectItem>
                                                    <SelectItem value="formal">Formal</SelectItem>
                                                    <SelectItem value="concise">Concise</SelectItem>
                                                    <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.tonality && (
                                        <p className="text-sm text-destructive">{errors.tonality.message}</p>
                                    )}
                                </div>

                                {/* Personalization Instructions */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium">
                                        <Sparkles className="h-4 w-4" />
                                        Personalization Instructions
                                    </label>
                                    <Controller
                                        name="personalization"
                                        control={control}
                                        render={({ field }) => (
                                            <Textarea
                                                placeholder="e.g., Reference their recent company announcement, mention our shared connection, focus on ROI benefits..."
                                                {...field}
                                                className="min-h-[200px] resize-none"
                                            />
                                        )}
                                    />
                                    {errors.personalization && (
                                        <p className="text-sm text-destructive">{errors.personalization.message}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        AI will use these instructions to personalize outreach messages for each contact
                                    </p>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4 border-t sticky bottom-0 bg-white">
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Generating..." : "Generate Outreach"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

export default OutreachDrawer;