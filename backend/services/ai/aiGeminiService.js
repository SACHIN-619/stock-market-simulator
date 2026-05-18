import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { InferenceClient } from "@huggingface/inference";

// ──────────────────────────────────────────────────────────────────────
// CLIENT INITIALIZATION
// ──────────────────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const groq   = new Groq({ apiKey: process.env.GROQ_API_KEY });
const hf     = new InferenceClient(process.env.HUGGINGFACE_API_KEY);

// Gemini models to try in order (first hit wins)
// Updated to current working model names for Gemini API v1
const GEMINI_MODELS = [
    "gemini-2.0-flash",         // Latest stable flash model
    "gemini-2.0-flash-lite",    // Lightweight fallback
    "gemini-1.5-flash-latest",  // Latest 1.5 flash
    "gemini-1.5-pro-latest",    // Latest 1.5 pro
];

// GROQ fallback models — try large model first, small model for budget
const GROQ_TEXT_MODELS  = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
const GROQ_JSON_MODELS  = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]; // both support json_object
const HF_FINANCE_MODEL  = "ProsusAI/finbert";

/**
 * Returns true if the error is a quota/rate-limit error (all Gemini models share one quota).
 */
const isGeminiQuotaError = (err) =>
    err.message.includes("429") ||
    err.message.includes("RESOURCE_EXHAUSTED") ||
    err.message.includes("quota");

/**
 * Returns true if the error means the model name is wrong (try next model).
 */
const isGeminiModelNotFound = (err) =>
    err.message.includes("404") || err.message.includes("not found");

// ──────────────────────────────────────────────────────────────────────
// HELPER: clean raw Gemini/GROQ text into valid JSON
// ──────────────────────────────────────────────────────────────────────
const cleanJSON = (text) =>
    text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();

// ──────────────────────────────────────────────────────────────────────
// GROQ FALLBACK — free-text
// ──────────────────────────────────────────────────────────────────────
const generateTextViaGroq = async (prompt) => {
    for (const model of GROQ_TEXT_MODELS) {
        try {
            const completion = await groq.chat.completions.create({
                model,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 2048,
            });
            const text = completion.choices[0]?.message?.content;
            if (text) {
                console.log(`[GROQ] Success with model: ${model}`);
                return text;
            }
        } catch (err) {
            console.warn(`[GROQ] Model "${model}" failed:`, err.message);
            if (err.message.includes("429")) break; // GROQ quota — stop
        }
    }
    return null;
};

// ──────────────────────────────────────────────────────────────────────
// GROQ FALLBACK — structured JSON
// ──────────────────────────────────────────────────────────────────────
const generateJSONViaGroq = async (prompt) => {
    for (const model of GROQ_JSON_MODELS) {
        try {
            const completion = await groq.chat.completions.create({
                model,
                messages: [
                    {
                        role: "system",
                        content:
                            "You are a financial AI assistant. Always respond with ONLY valid JSON. No markdown fences, no extra text.",
                    },
                    { role: "user", content: prompt },
                ],
                temperature: 0.2,
                max_tokens: 2048,
                response_format: { type: "json_object" },
            });
            const raw = completion.choices[0]?.message?.content;
            if (raw) {
                const parsed = JSON.parse(cleanJSON(raw));
                console.log(`[GROQ] JSON success with model: ${model}`);
                return parsed;
            }
        } catch (err) {
            console.warn(`[GROQ] JSON model "${model}" failed:`, err.message);
            if (err.message.includes("429")) break;
        }
    }
    return null;
};

// ──────────────────────────────────────────────────────────────────────
// HUGGING FACE FALLBACK — free-text
// ──────────────────────────────────────────────────────────────────────
const generateTextViaHF = async (prompt) => {
    try {
        const result = await hf.chatCompletion({
            model: "Qwen/Qwen2.5-72B-Instruct",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 4096,   // Increased: full JSON schema needs ~3500 tokens
            temperature: 0.3,   // Lower temp for more consistent JSON output
        });
        if (result?.choices[0]?.message?.content) {
            console.log("[HF] Success with Qwen-72B");
            return result.choices[0].message.content;
        }
    } catch (err) {
        console.warn("[HF] Qwen failed:", err.message);
    }
    return null;
};

// ──────────────────────────────────────────────────────────────────────
// HELPER: Attempt to salvage partial/truncated JSON from HF output
// ──────────────────────────────────────────────────────────────────────
const tryParsePartialJSON = (text) => {
    try {
        return JSON.parse(cleanJSON(text));
    } catch {
        // Try to extract just the JSON object via regex
        const match = text.match(/\{[\s\S]+/);
        if (match) {
            try {
                // Attempt to close any open structures and parse
                let partial = match[0];
                const openBraces = (partial.match(/\{/g) || []).length;
                const closeBraces = (partial.match(/\}/g) || []).length;
                partial += '}'.repeat(Math.max(0, openBraces - closeBraces));
                return JSON.parse(partial);
            } catch { /* ignore */ }
        }
        return null;
    }
};

/**
 * Specialized Financial Sentiment Analysis using ProsusAI/finbert
 */
export const analyzeFinancialSentiment = async (text) => {
    try {
        const result = await hf.textClassification({
            model: HF_FINANCE_MODEL,
            inputs: text
        });
        return result[0]; 
    } catch (error) {
        console.error("HF Sentiment Analysis failed:", error.message);
        return { label: 'neutral', score: 0.0 };
    }
};

/**
 * Specialized News Sentiment Analysis
 */
export const analyzeNewsSentiment = async (headline) => {
    try {
        const result = await hf.textClassification({
            model: HF_FINANCE_MODEL,
            inputs: headline,
        });
        const topSentiment = result[0];
        return {
            sentiment: topSentiment.label.toUpperCase(),
            confidence: (topSentiment.score * 100).toFixed(2),
        };
    } catch (error) {
        console.error("Hugging Face News Analysis Error:", error.message);
        return { sentiment: "NEUTRAL", confidence: "0.00" };
    }
};

// ──────────────────────────────────────────────────────────────────────
// PUBLIC: Generate structured JSON  (Gemini → GROQ fallback)
// ──────────────────────────────────────────────────────────────────────
export const generateStructuredJSON = async (prompt) => {
    // ── Try Gemini first ──
    for (const modelName of GEMINI_MODELS) {
        try {
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 2048,
                },
            }, { apiVersion: 'v1' });
            const result = await model.generateContent(prompt);
            const rawText = result.response.text();
            const parsed = JSON.parse(cleanJSON(rawText));
            console.log(`[Gemini] JSON success with model: ${modelName}`);
            return parsed;
        } catch (err) {
            console.warn(`[Gemini] JSON (${modelName}) failed:`, err.message);
            if (isGeminiQuotaError(err)) {
                console.warn("[Gemini] Quota hit -> falling back...");
                break; 
            }
            continue;
        }
    }

    // ── Fall back to GROQ ──
    const groqResult = await generateJSONViaGroq(prompt);
    if (groqResult) return groqResult;

    // ── Fall back to Hugging Face ──
    try {
        console.warn("[AI] Falling back to Hugging Face for JSON...");
        const hfRaw = await generateTextViaHF(prompt);
        if (hfRaw) {
            const parsed = tryParsePartialJSON(hfRaw);
            if (parsed) {
                console.log("[HF] JSON success");
                return parsed;
            }
            console.warn("[HF] JSON parsing failed: could not extract valid JSON");
        }
    } catch (err) {
        console.warn("[HF] Unexpected error:", err.message);
    }

    console.error("[AI] All providers failed for JSON generation.");
    return null;
};

// ──────────────────────────────────────────────────────────────────────
// PUBLIC: Generate free-text chat response  (Gemini → GROQ fallback)
// ──────────────────────────────────────────────────────────────────────
export const generateText = async (prompt) => {
    // ── Try Gemini first ──
    for (const modelName of GEMINI_MODELS) {
        try {
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH",        threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",  threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT",  threshold: "BLOCK_NONE" },
                ],
            }, { apiVersion: 'v1' });
            const result = await model.generateContent(prompt);
            const text   = result.response.text();
            console.log(`[Gemini] Text success with model: ${modelName}`);
            return text;
        } catch (err) {
            console.warn(`[Gemini] Text (${modelName}) failed:`, err.message);
            if (isGeminiQuotaError(err)) {
                console.warn("[Gemini] Quota exhausted → falling back to GROQ for text...");
                break; // stop trying Gemini models
            }
            continue;
        }
    }

    // ── Fall back to GROQ ──
    const groqText = await generateTextViaGroq(prompt);
    if (groqText) return groqText;

    // ── Fall back to Hugging Face ──
    const hfText = await generateTextViaHF(prompt);
    if (hfText) return hfText;

    console.error("[AI] All providers failed for text generation.");
    return "Alpha-Insight AI is currently experiencing extremely high demand. Please try again in 30 seconds.";
};