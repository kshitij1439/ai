// components/ModelSelector.tsx
"use client";

import {
    MODEL_CATEGORIES,
    MODEL_DISPLAY_NAMES,
    AIModel,
} from "@/lib/ai/modelTypes";

interface ModelSelectorProps {
    selectedModel: AIModel;
    onModelChange: (model: AIModel) => void;
}

export default function ModelSelector({
    selectedModel,
    onModelChange,
}: ModelSelectorProps) {
    return (
        <select
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value as AIModel)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
        >
            <optgroup label=" Free - Google Gemini">
                {MODEL_CATEGORIES.free.google.map((model) => (
                    <option key={model} value={model}>
                        {MODEL_DISPLAY_NAMES[model as AIModel]}
                    </option>
                ))}
            </optgroup>

            <optgroup label=" Free - Groq (Fast)">
                {MODEL_CATEGORIES.free.groq.map((model) => (
                    <option key={model} value={model}>
                        {MODEL_DISPLAY_NAMES[model as AIModel]}
                    </option>
                ))}
            </optgroup>

            {/* <optgroup label=" Free - Ollama (Local)">
                {MODEL_CATEGORIES.free.ollama.map((model) => (
                    <option key={model} value={model}>
                        {MODEL_DISPLAY_NAMES[model as AIModel]}
                    </option>
                ))}
            </optgroup>

            <optgroup label=" Paid - OpenAI">
                {MODEL_CATEGORIES.paid.openai.map((model) => (
                    <option key={model} value={model}>
                        {MODEL_DISPLAY_NAMES[model as AIModel]}
                    </option>
                ))}
            </optgroup>

            <optgroup label=" Paid - Anthropic">
                {MODEL_CATEGORIES.paid.anthropic.map((model) => (
                    <option key={model} value={model}>
                        {MODEL_DISPLAY_NAMES[model as AIModel]}
                    </option>
                ))}
            </optgroup> */}
        </select>
    );
}
