# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PM-Dev Translator is a communication translation assistant that bridges the gap between Product Managers and Developers. It translates:
- **PM → Dev**: Converts business requirements into technical specifications (algorithms, data sources, performance requirements, effort estimates)
- **Dev → PM**: Converts technical achievements into business impact (user experience improvements, business growth potential, cost savings)

## Architecture

**Backend**: Cloudflare Workers + Hono framework
- `worker/src/index.ts` - API endpoint with streaming support
- `worker/src/prompts.ts` - Translation prompts for PM↔Dev

**Frontend**: Pure HTML + CSS + JavaScript (Cloudflare Pages)
- `frontend/index.html` - Main page structure
- `frontend/styles.css` - Modern card-based design
- `frontend/app.js` - Streaming API client

**AI Integration**: DeepSeek API (OpenAI-compatible)
- API Base: `https://api.deepseek.com`
- Model: `deepseek-chat`
- Supports streaming output

## Key Implementation Focus

The core differentiator is **prompt engineering** - designing prompts that:
1. Understand the mindset differences between PM and Dev roles
2. Proactively supplement missing information during translation
3. Produce practically useful output for each audience

## Development Commands

```bash
# Install dependencies
cd worker && npm install

# Run worker locally (requires DEEPSEEK_API_KEY)
cd worker && npm run dev

# Deploy worker
cd worker && npm run deploy

# Set API key secret
wrangler secret put DEEPSEEK_API_KEY
```

## Development Status

Implementation complete. Ready for deployment.
