const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GENERATIVE_LANGUAGE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
    }

    if (!GEMINI_API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: "GEMINI_API_KEY is not configured" }) };
    }

    let payload;
    try {
        payload = JSON.parse(event.body || "{}");
    } catch (error) {
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
    }

    const { model, systemPrompt, contents } = payload;
    if (!model || !contents) {
        return { statusCode: 400, body: JSON.stringify({ error: "model and contents are required" }) };
    }

    const url = `${GENERATIVE_LANGUAGE_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`;

    const requestBody = {
        systemInstruction: systemPrompt
            ? { parts: [{ text: systemPrompt }] }
            : undefined,
        contents,
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini error:", data);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: data.error?.message || "Gemini API error" }),
            };
        }

        const text = data.candidates?.[0]?.content?.parts
            ?.map((part) => part.text || "")
            .join("")
            .trim();

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: text || "" }),
        };
    } catch (error) {
        console.error("Fetch error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Upstream request failed" }) };
    }
};
