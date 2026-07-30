<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/3dcef398-a4dc-47e6-8792-542eb1d19d97

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Gemini Runtime (Strict Mode)

The backend is configured to run Gemini as the primary path, with model fallback only between Gemini models.

### Model Environment Variables

- `GEMINI_MODEL_CHAT` (default: `gemini-2.5-flash-lite`)
- `GEMINI_MODEL_REVIEW` (default: `gemini-2.5-flash-lite`)
- `GEMINI_MODEL_CONTENT` (default: `gemini-3.5-flash`)

When the preferred model is unavailable, the server automatically tries other Gemini candidates.

### No Local Text Fallback

If Gemini is unavailable (quota/auth/model outage), the API returns a controlled error instead of generating local simulated replies.

- HTTP status: `503`
- Error code: `GEMINI_UNAVAILABLE`

Routes that follow this behavior:

- `POST /api/agent/chat`
- `POST /api/agent/review-reply`
- `POST /api/posts/generate`
- `POST /api/posts/ideas`

For WhatsApp webhook processing, Gemini failures are logged and no simulated text is sent.
