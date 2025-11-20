import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { supabase } from "@/lib/supabaseClient";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const session_id = body.session_id as string | undefined;
        const message = body.message as string | undefined;

        if (!session_id || !message) {
            return NextResponse.json(
                { error: "session_id and message are required" },
                { status: 400 }
            );
        }

        // Load conversation history for this session
        const { data: rows, error } = await supabase
            .from("messages")
            .select("role, content, created_at")
            .eq("session_id", session_id)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("SUPABASE_HISTORY_ERROR:", error.message);
            return NextResponse.json(
                { error: "Failed to load conversation history" },
                { status: 500 }
            );
        }

        const historyMessages =
            rows?.map((m) => ({
                role: (m.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
                content: m.content as string,
            })) ?? [];

        // Call Groq with system prompt + history + latest user message
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content:
                        "You are a helpful assistant in a web chat. The user may tell you their name; remember it for this conversation and use it politely.",
                },
                ...historyMessages,
                { role: "user", content: message },
            ],
        });

        const reply = completion.choices[0]?.message?.content ?? "";

        return NextResponse.json({ reply });
    } catch (err) {
        console.error("CHAT_ROUTE_ERROR:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
