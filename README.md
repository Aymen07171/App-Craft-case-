<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/ffab6dc2-a9ce-46c8-98cd-6bb2ed928736

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and fill in the API keys and Google OAuth client ID. See [Google Drive and Sheets setup](GOOGLE_SHEETS_SETUP.md).
3. Start the local development server with `npm run dev` and open `http://localhost:3000`.

### Image generation fallback

When Gemini returns a quota error, design artwork generation can fall back to Hugging Face Inference Providers using [`black-forest-labs/FLUX.1-schnell`](https://huggingface.co/black-forest-labs/FLUX.1-schnell). Create a Hugging Face token with Inference Providers permission in [token settings](https://huggingface.co/settings/tokens), set it as `HF_TOKEN` in `.env`, and restart the app. The model may require accepting its access terms on Hugging Face. Hugging Face currently gives free accounts a small monthly inference credit, so this fallback is limited rather than unlimited. Reference-based product and lifestyle mockups stay on Gemini because a text-only fallback would not preserve the supplied artwork and product photos.

For a production build, run `npm run build` and then `npm start`. The build creates the browser assets and bundles the TypeScript server for Node.js.
