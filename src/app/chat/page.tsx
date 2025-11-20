'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function ChatPage() {
    const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
    const [input, setInput] = useState("");

    async function sendMessage() {
        const userMessage = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);

        const res = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ message: input }),
        })

        const data = await res.json();
        const aiMessage = {
            role: "assistant",
            content: data.reply,
        }

        setMessages((prev) => [...prev, aiMessage]);
        setInput("");
    }

    return (
        <main className="p-6 max-w-xl mx-auto space-y-4">
            <h1 className="text-2xl font-bold text-center">Chat</h1>

            <Card className="p-4 h-[60vh] overflow-y-auto space-y-3 mb-3">
                {messages.map((msg, index) => (
                    <div key={index}>
                        <strong>
                            {msg.role === "user" ? "You: " : "AI: "}
                        </strong>
                        {msg.content}
                    </div>
                ))}
            </Card>

            <div className="flex gap-2">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                />
                <Button onClick={sendMessage}>Send</Button>
            </div>
        </main>
    )
}
