"use client";

import { ChangeEvent, useCallback, useEffect, useState } from "react";

type FileItem = {
    id: string;
    name: string;
    chunk_count?: number;
};

export default function FilesPage() {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [uploading, setUploading] = useState(false);

    const loadFiles = useCallback(async () => {
        const res = await fetch("/api/files");
        const data = await res.json();
        setFiles(data.files || []);
    }, []);

    useEffect(() => {
        // Initial load of files on mount
        void loadFiles();
    }, [loadFiles]);

    async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const form = new FormData();
        form.append("file", file);

        setUploading(true);
        try {
            const res = await fetch("/api/process-pdf", { method: "POST", body: form });
            const payload = await res.json();

            if (!res.ok) {
                console.error("Upload failed:", payload?.error);
                alert(payload?.error ?? "Failed to process PDF");
                return;
            }

            loadFiles();
        } finally {
            setUploading(false);
        }
    }

    async function deleteFile(id: string) {
        await fetch(`/api/files?id=${id}`, { method: "DELETE" });
        loadFiles();
    }

    return (
        <main className="p-6">
            <h1 className="text-2xl font-bold mb-4">Manage PDFs</h1>

            <input type="file" onChange={handleUpload} />
            {uploading && <p>Processing...</p>}

            <ul className="mt-6 space-y-3">
                {files.map((f) => {
                    const count = f.chunk_count ?? 0;
                    return (
                    <li key={f.id} className="border p-3 rounded flex justify-between">
                        <div className="flex flex-col">
                            <span>{f.name}</span>
                            <span className="text-sm text-gray-500">{count} chunks</span>
                        </div>
                        <button
                            className="text-red-600"
                            onClick={() => deleteFile(f.id)}
                        >
                            Delete
                        </button>
                    </li>
                );
                })}
            </ul>
        </main>
    );
}
