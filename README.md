# RAG Chatbot

A small Retrieval-Augmented Generation (RAG) chatbot built with Next.js and TypeScript. This project demonstrates integrating a local/content vector store and a generative model to answer questions from a document corpus.

**Tech stack:** Next.js 16, React 19, TypeScript, Tailwind CSS

**Highlights:**

-   Uses `@mistralai/mistralai` for model integration
-   Uses GROQ SDK for content/querying

## Quick Start

-   Install dependencies:

    `npm install`

-   Start development server:

    `npm run dev`

# RAG Chatbot

Minimal Retrieval-Augmented Generation Chatbot — quick start and required env keys.

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

Do not commit secrets. See `.env.example` for placeholders.
