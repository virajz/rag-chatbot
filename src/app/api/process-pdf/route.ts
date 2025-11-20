import { NextResponse } from "next/server";
import { extractPdfText } from "@/lib/pdf";
import { chunkText } from "@/lib/chunk";
import { embedText } from "@/lib/embeddings";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const form = await req.formData();
        const file = form.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No PDF uploaded" }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const pdfName = file.name;

        // 1. Extract text
        const text = await extractPdfText(buffer);

        // 2. Chunk text
        const chunks = chunkText(text, 400);

        // 3. Process chunks one by one
        for (const chunk of chunks) {
            const embedding = await embedText(chunk);

            // 4. Insert into Supabase
            const { error } = await supabase
                .from("rag_chunks")
                .insert({
                    pdf_name: pdfName,
                    chunk,
                    embedding, // vector(1024)
                });

            if (error) {
                console.error("SUPABASE_INSERT_ERROR:", error);
                throw error;
            }
        }

        return NextResponse.json({
            message: "PDF processed successfully",
            chunks: chunks.length,
        });
    } catch (err: any) {
        console.error("PROCESS_PDF_ERROR:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
