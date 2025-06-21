# Efficiency24 ROI Calculator

Web-based ROI calculator for Argentine SMEs considering Bitrix24 CRM + chatbot.

## Deployment to Cloudflare Pages

This application can be deployed as a static site to Cloudflare Pages.

1.  **Connect Your Repository or Upload Files:**
    *   In your Cloudflare dashboard, go to Workers & Pages > Create application > Pages.
    *   Connect to your Git provider (GitHub, GitLab) and select your repository, or choose direct upload.

2.  **Build Settings (If Using Git):**
    *   **Production Branch:** Select your main branch (e.g., `main`).
    *   **Build command:** For this project's current structure (no dedicated build step like Vite or Webpack), you can often leave this blank, or if Cloudflare requires one for static sites without a framework preset, a simple command like `mkdir -p public && cp -r ./* ./public/ || true` (to create a dummy output directory if needed) might work. However, typically for serving root files, no build command is needed if you don't select a framework preset.
    *   **Build output directory:** If you used a build command that outputs to a specific directory (like `public` or `dist`), specify it here. If serving from the root, this might be `/` or left blank depending on Cloudflare's UI for "no framework" projects. Often, selecting "None" as the framework preset handles this correctly.

3.  **Environment Variables (Crucial for API Key):**
    *   In your Cloudflare Pages project settings, navigate to Settings > Environment variables.
    *   Under "Production" (and "Preview" if desired), click "Add variable".
    *   Set Variable name: `API_KEY`
    *   Set Value: `YOUR_GOOGLE_GEMINI_API_KEY` (paste your actual API key here).
    *   Ensure "Encrypt" is checked if sensitive.

4.  **Deploy.**

### Important Note on API Key Accessibility for Client-Side Code:

The application's client-side JavaScript (`App.tsx`) expects the Google Gemini API key to be available via `process.env.API_KEY`.

*   **Cloudflare Environment Variables:** Environment variables set in the Cloudflare Pages dashboard (like `API_KEY`) are primarily accessible during the **build process** or by **Cloudflare Functions**. They are **not** automatically exposed directly to your static, client-side JavaScript files.

*   **Impact on Functionality:** Without a build step specifically designed to inject `API_KEY` into your client-side JavaScript bundle, or using a Cloudflare Function to proxy API requests or serve the key, the Gemini API-dependent features in this application will be **disabled**. The application is designed to log a warning to the console and degrade gracefully in this scenario (i.e., the ROI calculations will work, but the email content preparation via Gemini will not).

*   **For Full Gemini API Functionality on Cloudflare Pages:**
    *   **Option 1 (Recommended for robust projects):** Integrate a build tool (like Vite, Parcel, or Create React App). These tools can replace `process.env.API_KEY` (or a similar construct like `import.meta.env.VITE_API_KEY`) in your code with the actual key value from Cloudflare's build environment variables during the build process. You would then specify the appropriate build command in Cloudflare Pages.
    *   **Option 2 (Advanced):** Use a Cloudflare Worker to either proxy requests to the Gemini API (handling the API key server-side) or to inject the API key into the `index.html` response.

For the current simple file structure, deploying directly will result in Gemini features being inactive unless you implement one of the advanced methods above for making the `API_KEY` securely available to the client-side code.
