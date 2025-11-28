import { NextRequest, NextResponse } from "next/server";
import { Mistral } from '@mistralai/mistralai';

const apiKey = process.env.MISTRAL_API_KEY;

if (!apiKey) {
    console.error("MISTRAL_API_KEY is not set in environment variables");
}

export async function POST(request: NextRequest) {
    try {
        if (!apiKey) {
            return NextResponse.json(
                { error: "Mistral API key is not configured" },
                { status: 500 }
            );
        }

        const formData = await request.formData();
        const imageFile = formData.get("image") as File;

        if (!imageFile) {
            return NextResponse.json(
                { error: "No image file provided" },
                { status: 400 }
            );
        }

        console.log("Processing image:", imageFile.name, imageFile.type, imageFile.size, "bytes");

        // Convert image to base64
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString('base64');
        const mimeType = imageFile.type || 'image/png';
        const dataUrl = `data:${mimeType};base64,${base64Image}`;

        console.log("Image converted to base64, length:", base64Image.length);
        console.log("MIME type:", mimeType);

        // Initialize Mistral client
        const client = new Mistral({ apiKey });

        console.log("Calling Mistral OCR API...");

        // Process OCR
        const ocrResponse = await client.ocr.process({
            model: "mistral-ocr-latest",
            document: {
                type: "image_url",
                imageUrl: dataUrl,
            },
            includeImageBase64: true
        });

        console.log("Mistral OCR Response received");
        console.log("Raw response type:", typeof ocrResponse);
        console.log("Raw response keys:", Object.keys(ocrResponse || {}));
        console.log("Full response:", JSON.stringify(ocrResponse, null, 2));

        // Extract text from response
        let extractedText = "";

        const respAny = ocrResponse as any;

        console.log("Extracting text from response...");

        if (typeof respAny.text === "string" && respAny.text.length > 0) {
            console.log("Found text property directly");
            extractedText = respAny.text;
        } else if (Array.isArray(respAny.pages)) {
            console.log("Found pages array, length:", respAny.pages.length);

            // Extract markdown from each page
            extractedText = respAny.pages
                .map((p: any) => {
                    // First try to get markdown field
                    if (p.markdown) {
                        console.log("Found markdown field in page");
                        return p.markdown;
                    }
                    // Fallback to lines/paragraphs structure
                    if (Array.isArray(p.lines)) return p.lines.map((l: any) => l.text || '').join('\n');
                    if (Array.isArray(p.paragraphs)) return p.paragraphs.map((par: any) => par.text || '').join('\n');
                    return '';
                })
                .filter(Boolean)
                .join('\n\n');
        } else if (Array.isArray(respAny.blocks)) {
            console.log("Found blocks array, length:", respAny.blocks.length);
            extractedText = respAny.blocks.map((b: any) => b.text || '').filter(Boolean).join('\n');
        } else {
            console.log("No recognized text structure found in response");
        }

        console.log("Extracted text length:", extractedText.length);
        console.log("Extracted text preview:", extractedText.substring(0, 200));

        return NextResponse.json({
            text: extractedText,
            success: true,
            model: "mistral-ocr-latest",
            rawResponse: ocrResponse,
            debugInfo: {
                responseKeys: Object.keys(ocrResponse || {}),
                responseType: typeof ocrResponse,
                hasText: !!respAny.text,
                hasPages: !!respAny.pages,
                hasBlocks: !!respAny.blocks,
                hasChoices: !!respAny.choices,
            }
        });

    } catch (error) {
        console.error("OCR processing error:", error);

        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to process image",
                details: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
