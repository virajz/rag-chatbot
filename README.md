# RAG Chatbot

A small Retrieval-Augmented Generation (RAG) chatbot built with Next.js and TypeScript. This project demonstrates integrating a local/content vector store and a generative model to answer questions from a document corpus.

**Tech stack:** Next.js 16, React 19, TypeScript, Tailwind CSS

# RAG Chatbot

Minimal Retrieval-Augmented Generation chatbot — quick start.

Quick start

-   Install

    `npm install`

-   Dev

    `npm run dev`

-   Build

    `npm run build`

Environment

Create `.env.local` (ignored by git). Required keys:

-   `MISTARL_API_KEY`=your_mistral_api_key_here
-   `GROQ_API_KEY`=your_groq_api_key_here
-   `NEXT_PUBLIC_SUPABASE_URL`=https://your-supabase-project-url
-   `NEXT_PUBLIC_SUPABASE_ANON_KEY`=your_supabase_anon_key

Do not commit secrets. Use `.env.example` as a template.

Notes

-   Uses `@mistralai/mistralai` and `groq-sdk` (see `package.json`).
-   Deploy to Vercel and add the env vars in the project settings.
