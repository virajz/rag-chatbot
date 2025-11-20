import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { supabase } from "@/lib/supabaseClient";
import { embedText } from "@/lib/embeddings";
import { retrieveRelevantChunks } from "@/lib/retrieval";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { session_id, message, file_id } = body;

        if (!session_id || !message) {
            return NextResponse.json(
                { error: "session_id and message are required" },
                { status: 400 }
            );
        }

        // 1. Embed the user query
        const queryEmbedding = await embedText(message);

        if (!queryEmbedding) {
            return NextResponse.json(
                { error: "Failed to generate embedding" },
                { status: 500 }
            );
        }

        // 2. Retrieve relevant chunks
        const matches = await retrieveRelevantChunks(queryEmbedding, file_id, 5);

        const contextText = matches.map((m) => m.chunk).join("\n\n");

        // 3. Load conversation history
        const { data: historyRows } = await supabase
            .from("messages")
            .select("role, content")
            .eq("session_id", session_id)
            .order("created_at", { ascending: true });

        const history = (historyRows || []).map(m => ({
            role: m.role,
            content: m.content
        }));

        // 4. Inject RAG context into Groq LLM
        const messages = [
            {
                role: "system",
                content:
                    `You are a RAG assistant. Use the provided context to answer accurately.\n\n` +
                    `CONTEXT:\n${contextText}\n\n` +
                    `If the answer is not in the context, say "The PDF does not contain that information."`
            },
            ...history,
            { role: "user", content: message }
        ];

        // 5. Call Groq
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages,
            temperature: 0.2
        });

        const reply = completion.choices[0].message.content;

        return NextResponse.json({ reply });
    } catch (err: unknown) {
        console.error("CHAT_ERROR:", err);
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
