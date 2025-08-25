import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

interface IntentPriorities {
    highest_value: string[];
    strategic_focus: string[];
}

interface OnboardingData {
    company_name: string;
    industry: string;
    business_focus: string;
    target_market: string;
    intent_priorities: IntentPriorities;
    client_specific_guidance: string;
    industry_context: string;
    success_metrics: string[];
}

const responseSchema = {
    type: Type.OBJECT,
    required: [
        "company_name",
        "industry",
        "business_focus",
        "target_market",
        "intent_priorities",
        "client_specific_guidance",
        "industry_context",
        "success_metrics",
    ],
    properties: {
        company_name: { type: Type.STRING },
        industry: { type: Type.STRING },
        business_focus: { type: Type.STRING },
        target_market: { type: Type.STRING },
        intent_priorities: {
            type: Type.OBJECT,
            required: ["highest_value", "strategic_focus"],
            properties: {
                highest_value: { type: Type.ARRAY, items: { type: Type.STRING } },
                strategic_focus: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
        },
        client_specific_guidance: { type: Type.STRING },
        industry_context: { type: Type.STRING },
        success_metrics: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
};

function validateOnboardingData(data: OnboardingData): boolean {
    if (!data || typeof data !== 'object') return false;

    // Check all required string fields
    if (!data.company_name || !data.industry || !data.business_focus || 
        !data.target_market || !data.client_specific_guidance || !data.industry_context) {
        return false;
    }
    // Check intent_priorities structure
    if (!data.intent_priorities || 
        !data.intent_priorities.highest_value || !Array.isArray(data.intent_priorities.highest_value) ||
        !data.intent_priorities.strategic_focus || !Array.isArray(data.intent_priorities.strategic_focus)) {
        return false;
    }
    // Check success_metrics array
    if (!Array.isArray(data.success_metrics)) return false;
    return true;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!validateOnboardingData(body)) {
            return NextResponse.json(
                { error: "Invalid onboarding data structure" },
                { status: 400 }
            );
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: "Gemini API key not configured" },
                { status: 500 }
            );
        }

        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
        });

        const config = {
            responseMimeType: "application/json",
            responseSchema,
        };

        const contents = [
            {
                role: "user",
                parts: [
                    {
                        text: `Expand the given onboarding JSON. Keep the same structure but enrich each field with detailed, strategic, context-aware content. Ensure all arrays have meaningful values and text fields are comprehensive and actionable.
Here is the JSON to expand:
${JSON.stringify(body, null, 2)}`,
                    },
                ],
            },
        ];

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-lite",
            config,
            contents,
        });

        if (!response.candidates || response.candidates.length === 0) {
            return NextResponse.json(
                { error: "No response generated from AI" },
                { status: 500 }
            );
        }

        const candidate = response.candidates[0];
        if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
            return NextResponse.json(
                { error: "Invalid response structure from AI" },
                { status: 500 }
            );
        }

        const generatedContent = candidate.content.parts[0].text || "";
        if (!generatedContent) {
            return NextResponse.json(
                { error: "Empty response from AI" },
                { status: 500 }
            );
        }

        let enrichedData;

        try {
            enrichedData = JSON.parse(generatedContent);
        } catch {
            return NextResponse.json(
                { error: "Failed to parse AI response as JSON" },
                { status: 500 }
            );
        }

        if (!validateOnboardingData(enrichedData)) {
            return NextResponse.json(
                { error: "AI response does not match expected schema" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: enrichedData,
        });

    } catch (error) {
        console.error("Error processing onboarding data:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
