"use client";

import { ChangeEvent, useState } from "react";

type OCRResult = {
    text: string;
    imageBase64?: string;
    rawResponse?: any;
    debugInfo?: any;
};

export default function OCRPage() {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState<OCRResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    function handleImageSelect(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            setError(null);
            setResult(null);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }

    async function handleOCRProcess() {
        if (!selectedImage) {
            setError("Please select an image first");
            return;
        }

        setProcessing(true);
        setError(null);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append("image", selectedImage);

            const res = await fetch("/api/ocr", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            console.log("OCR API Response:", data);

            if (!res.ok) {
                throw new Error(data.error || "Failed to process image");
            }

            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setProcessing(false);
        }
    }

    function resetForm() {
        setSelectedImage(null);
        setImagePreview(null);
        setResult(null);
        setError(null);

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = "";
    }

    return (
        <main className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Image OCR Testing</h1>
            <p className="text-gray-600 mb-6">
                Upload an image to extract text using Mistral OCR (mistral-ocr-latest)
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upload Section */}
                <div className="border rounded-lg p-6 bg-white">
                    <h2 className="text-lg font-semibold mb-4">Upload Image</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Select Image File
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-md file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-purple-50 file:text-purple-700
                                    hover:file:bg-purple-100"
                            />
                            {selectedImage && (
                                <p className="mt-2 text-sm text-gray-600">
                                    Selected: {selectedImage.name}
                                </p>
                            )}
                        </div>

                        {/* Image Preview */}
                        {imagePreview && (
                            <div className="border rounded-lg p-4 bg-gray-50">
                                <h3 className="text-sm font-medium mb-2">Preview</h3>
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="max-w-full h-auto rounded border"
                                />
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={handleOCRProcess}
                                disabled={processing || !selectedImage}
                                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {processing ? "Processing..." : "Extract Text (OCR)"}
                            </button>
                            {(selectedImage || result) && (
                                <button
                                    onClick={resetForm}
                                    disabled={processing}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                    Reset
                                </button>
                            )}
                        </div>

                        {error && (
                            <div className="border border-red-300 rounded-lg p-4 bg-red-50">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Results Section */}
                <div className="border rounded-lg p-6 bg-white">
                    <h2 className="text-lg font-semibold mb-4">OCR Results</h2>

                    {!result && !processing && (
                        <div className="flex items-center justify-center h-64 text-gray-400">
                            <p>Results will appear here after processing</p>
                        </div>
                    )}

                    {processing && (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">Processing image with Mistral OCR...</p>
                            </div>
                        </div>
                    )}

                    {result && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium mb-2">Extracted Text</h3>
                                <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                                    <pre className="text-sm whitespace-pre-wrap font-mono">
                                        {result.text || "No text extracted"}
                                    </pre>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(result.text);
                                        alert("Text copied to clipboard!");
                                    }}
                                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:blue-700"
                                    disabled={!result.text}
                                >
                                    Copy Text
                                </button>
                                <button
                                    onClick={() => {
                                        const blob = new Blob([result.text], { type: 'text/plain' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `ocr-result-${Date.now()}.txt`;
                                        a.click();
                                        URL.revokeObjectURL(url);
                                    }}
                                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                                    disabled={!result.text}
                                >
                                    Download as TXT
                                </button>
                            </div>

                            <div className="text-xs text-gray-500 mt-4">
                                <p>Character count: {result.text?.length || 0}</p>
                                <p>Word count: {result.text?.split(/\s+/).filter(w => w.length > 0).length || 0}</p>
                            </div>

                            {/* Debug Info Section */}
                            <div className="border-t pt-4 mt-4">
                                <h3 className="text-sm font-medium mb-2">Debug Information</h3>
                                <div className="border rounded-lg p-4 bg-yellow-50 max-h-96 overflow-y-auto">
                                    <pre className="text-xs whitespace-pre-wrap font-mono">
                                        {JSON.stringify(result, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
