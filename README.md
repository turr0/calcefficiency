
# Efficiency24 ROI Calculator (Cloudflare Worker Version)

Web-based ROI calculator for Argentine SMEs considering Bitrix24 CRM + chatbot, deployed as a Cloudflare Worker.

## Prerequisites

*   Node.js and npm installed.
*   A Cloudflare account.
*   Wrangler CLI installed globally or as a project dependency (`npm install -g wrangler` or `npm install --save-dev wrangler`).

## Setup

1.  **Clone/Download Files:**
    Ensure you have all the project files.

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure `wrangler.toml`:**
    *   Open `wrangler.toml`.
    *   Fill in your Cloudflare `account_id`. You can find this in your Cloudflare dashboard.

4.  **Set API Key Secret for Production:**
    The Gemini API key must be set as a secret for your deployed worker.
    ```bash
    npx wrangler secret put API_KEY
    ```
    You will be prompted to enter the API key value. This is stored securely by Cloudflare and accessible to your worker script via `env.API_KEY`.

## Local Development

1.  **Create `.dev.vars` for Local API Key:**
    For local development using `wrangler dev`, create a file named `.dev.vars` in the root of your project (alongside `wrangler.toml`). Add your Gemini API key to this file:
    ```
    API_KEY="YOUR_GEMINI_API_KEY_FOR_LOCAL_DEV"
    ```
    **IMPORTANT:** Ensure `.dev.vars` is listed in your `.gitignore` file to prevent committing your API key.

2.  **Start the Development Server:**
    ```bash
    npm run dev
    # or
    npx wrangler dev
    ```
    This will start a local server, typically on `http://localhost:8787`.

## Client-Side Build (Important for TSX)

The current setup serves `.tsx` files directly. Browsers **do not** understand TSX natively. For the React application to work correctly when deployed or in most local development scenarios, you need a build step to transpile TSX to JavaScript.

*   **Recommendation:** Use a tool like `esbuild`, `Vite`, `Parcel`, or `create-react-app` (if starting fresh) to handle your client-side code.
*   **Example with `esbuild` (manual setup):**
    1.  Install `esbuild`: `npm install --save-dev esbuild`
    2.  Add a build script to `package.json`:
        ```json
        "scripts": {
          // ... other scripts
          "build:client": "esbuild public/index.tsx --bundle --outfile=public/bundle.js --jsx=automatic --loader:.ts=tsx",
          "build": "npm run build:client" // if you want wrangler build to trigger this
        }
        ```
    3.  Update `public/index.html` to load `bundle.js`:
        ```html
        <script type="module" src="/bundle.js"></script>
        ```
    4.  If using the `[build]` section in `wrangler.toml`, uncomment and configure it:
        ```toml
        [build]
        command = "npm run build:client" # Or "npm run build"
        # watch_dir = "./public" # Or your client source dir if separate
        ```

## Deployment to Cloudflare

1.  **Ensure `wrangler.toml` is configured and `API_KEY` secret is set.**
2.  **Deploy the Worker:**
    ```bash
    npm run deploy
    # or
    npx wrangler deploy
    ```
    Wrangler will build the worker (if a build command is specified) and deploy it along with the static assets in the `./public` directory.

## How it Works

*   **Cloudflare Worker (`worker/worker.ts`):**
    *   Handles all incoming HTTP requests.
    *   If a request is for `/api/prepare-email` (POST), it takes the input data, securely calls the Google Gemini API using the `API_KEY` secret, and returns the generated email body to the client.
    *   For all other requests, it serves static files (HTML, CSS, client-side JS, images) from the `public` directory.
*   **Frontend (`public/` directory):**
    *   The React application (`App.tsx`, `index.tsx`, etc.).
    *   Instead of calling the Gemini API directly, it makes a `fetch` request to its own worker's `/api/prepare-email` endpoint.
    *   The API key is never exposed to the client-side code.
