# Efficiency24 ROI Calculator (Cloudflare Worker Version)

Web-based ROI calculator for Argentine SMEs considering Bitrix24 CRM + chatbot, deployed as a Cloudflare Worker. The Worker serves the static React frontend and provides a secure backend API endpoint for interacting with the Google Gemini API.

## Prerequisites

*   Node.js and npm (or yarn/pnpm) installed.
*   A Cloudflare account.
*   Wrangler CLI installed (`npm install -g wrangler` or add as a dev dependency).

## Project Structure

*   `public/`: Contains the client-side React application source files (`index.html`, `index.tsx`, `App.tsx`, components, etc.) and the bundled output (`bundle.js`).
*   `worker/`: Contains the Cloudflare Worker script (`worker.ts`).
*   `wrangler.toml`: Configuration for the Cloudflare Worker.
*   `package.json`: Project dependencies and scripts.
*   `tsconfig.json`: TypeScript configuration for both client and worker.

## Setup

1.  **Clone/Download Files:**
    Ensure you have all the project files.

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure `wrangler.toml`:**
    *   Open `wrangler.toml`.
    *   Set your Cloudflare `account_id` if it's not configured globally.
    *   The `name` of the worker can be customized.
    *   The `[site].bucket` is set to `./public`, which is where your static frontend assets (including `bundle.js` after build) will be served from.
    *   The `[build].command` is set to `npm run build:client`, which will compile your `public/index.tsx` into `public/bundle.js`.

4.  **API Key Management:**
    The Google Gemini API key is handled securely by the Cloudflare Worker.
    *   **For Production Deployment:** Set the `API_KEY` as a secret in your Worker's settings via the Cloudflare dashboard or Wrangler CLI:
        ```bash
        npx wrangler secret put API_KEY
        ```
        You will be prompted to enter your API key.
    *   **For Local Development (`wrangler dev`):** Create a `.dev.vars` file in the project root:
        ```
        API_KEY="YOUR_GEMINI_API_KEY_FOR_LOCAL_DEV"
        ```
        **Important:** Add `.dev.vars` to your `.gitignore` file to prevent committing your API key.

## Available Scripts

*   **`npm run dev`**: Starts the local development server using Wrangler. This will also run the client build. Changes in `public/` source files should trigger a rebuild of `bundle.js`.
*   **`npm run deploy`**: Builds the client-side application and deploys the Worker and static assets to Cloudflare.
*   **`npm run build:client`**: Compiles `public/index.tsx` into `public/bundle.js` using `esbuild`. This is automatically run as part of `dev` and `deploy` if `wrangler.toml` is configured.
*   **`npm run build`**: Alias for `build:client`.

## Local Development

1.  Ensure you have a `.dev.vars` file with your `API_KEY` as described above.
2.  Run:
    ```bash
    npm run dev
    ```
    Wrangler will start a local server (typically `http://localhost:8787`), build the client-side assets, and serve your application.

## Deployment to Cloudflare

1.  Ensure `wrangler.toml` is correctly configured and you have set the `API_KEY` secret in your Cloudflare Worker settings.
2.  Run:
    ```bash
    npm run deploy
    ```
    Wrangler will build the client-side assets, then deploy your Worker script and the contents of the `public` directory (including `index.html` and `bundle.js`) to Cloudflare.

## How It Works

*   **Client-Side Application (`public/`):**
    *   A React application built with TypeScript/TSX.
    *   User inputs data into the ROI calculator form.
    *   When "Calcular y Ver Resultados" is clicked, the app sends the input data and calculated values via a `fetch` POST request to the `/api/prepare-email` endpoint provided by its own Cloudflare Worker.
    *   Displays the results based on calculations and the (simulated) data preparation confirmation.
*   **Cloudflare Worker (`worker/worker.ts`):**
    *   **API Endpoint (`/api/prepare-email`):**
        *   Receives data from the client application.
        *   Securely initializes the `GoogleGenAI` client using the `API_KEY` from Worker secrets.
        *   Constructs a prompt and calls the Gemini API to generate an email body.
        *   Returns the generated email body (or an error) to the client.
    *   **Static Asset Serving:**
        *   For all other requests, it uses `@cloudflare/kv-asset-handler` to serve static files (like `index.html`, `bundle.js`, images, etc.) from the `public` directory. This directory's contents are uploaded by Wrangler due to the `[site]` configuration.
        *   It's configured to serve `index.html` for root path (`/`) and for SPA-style routing (unknown paths without file extensions).
*   **Build Process:**
    *   `esbuild` (triggered by `npm run build:client`) compiles `public/index.tsx` and all its imported React components and modules into a single `public/bundle.js` file.
    *   `public/index.html` is configured to load this `bundle.js`.
