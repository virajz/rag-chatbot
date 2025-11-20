import { supabase } from "@/lib/supabaseClient";

export async function retrieveRelevantChunks(queryEmbedding: number[], limit = 5) {
    const { data, error } = await supabase.rpc("match_documents", {
        query_embedding: queryEmbedding,
        match_count: limit,
    });

    if (error) {
        console.error("VECTOR SEARCH ERROR:", error);
        throw error;
    }

    return data; // array of { id, chunk, similarity }
}
