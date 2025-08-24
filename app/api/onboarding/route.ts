import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

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

function validateOnboardingData(data: any): boolean {
    if (!data || typeof data !== 'object') return false;

    const requiredFields = [
        'company_name', 'industry', 'business_focus', 'target_market',
        'intent_priorities', 'client_specific_guidance', 'industry_context', 'success_metrics'
    ];

    for (const field of requiredFields) {
        if (!data[field]) return false;
    }

    if (!data.intent_priorities.highest_value || !Array.isArray(data.intent_priorities.highest_value)) return false;
    if (!data.intent_priorities.strategic_focus || !Array.isArray(data.intent_priorities.strategic_focus)) return false;
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
        } catch (parseError) {
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
