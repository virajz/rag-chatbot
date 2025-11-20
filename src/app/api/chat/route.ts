import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
})

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const userMessage = body.message || '';

        const chat = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "user",
                    content: userMessage
                }
            ]
        });

        const reply = chat.choices[0].message.content;

        return NextResponse.json({ reply });
    } catch (error) {
        console.error("Error processing chat request:", error);
        return NextResponse.json(
            { error: "Something went wrong while processing your request." },
            { status: 500 }
        )
    }
}
