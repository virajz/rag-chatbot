import { Mistral } from "@mistralai/mistralai";

const client = new Mistral({
    apiKey: process.env.MISTRAL_API_KEY!,
});

export async function embedText(text: string) {
    const response = await client.embeddings.create({
        model: "mistral-embed", // consistent with docs
        inputs: [text],
    });

    return response.data[0].embedding; // array of 1024 floats
}
