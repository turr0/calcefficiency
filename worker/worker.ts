/// <reference types="@cloudflare/workers-types" />
import type { KVNamespace, ExecutionContext } from '@cloudflare/workers-types';

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// This type helps define the structure of the environment variables/secrets
// passed to the worker by Cloudflare.
export interface Env {
  API_KEY: string; // Secret for Gemini API Key
  // __STATIC_CONTENT and __STATIC_CONTENT_MANIFEST are automatically
  // injected by Wrangler when [site] config is used.
  __STATIC_CONTENT: KVNamespace;
  __STATIC_CONTENT_MANIFEST: string;
}

// Helper function to serve static assets from the KV store populated by `[site]`
// This uses the same mechanism Cloudflare Pages uses for static assets.
async function serveStaticAsset(request: Request, env: Env, ctx: ExecutionContext) {
  const { getAssetFromKV, mapRequestToAsset } = await import(
    "@cloudflare/kv-asset-handler"
  );

  try {
    const asset = await getAssetFromKV(
      {
        request: request,
        waitUntil: (promise) => ctx.waitUntil(promise),
      },
      {
        ASSET_NAMESPACE: env.__STATIC_CONTENT,
        ASSET_MANIFEST: JSON.parse(env.__STATIC_CONTENT_MANIFEST),
        mapRequestToAsset: (req) => {
          // If the request is for the root, serve index.html
          const url = new URL(req.url);
          if (url.pathname === '/' || url.pathname === '') {
            return mapRequestToAsset(new Request(`${url.origin}/index.html`, req));
          }
          return mapRequestToAsset(req);
        },
      }
    );
    return asset;
  } catch (e) {
    // If asset not found, you can return a 404 or a custom page
    // For SPA, you might want to return index.html for unknown paths
    // const pathname = new URL(request.url).pathname;
    // if (!pathname.includes('.')) { // Simple check if it's not a file request
    //   try {
    //     return await getAssetFromKV(
    //       { request: new Request(new URL(request.url).origin + "/index.html", request),
    //         waitUntil: ctx.waitUntil.bind(ctx) },
    //       { ASSET_NAMESPACE: env.__STATIC_CONTENT, ASSET_MANIFEST: JSON.parse(env.__STATIC_CONTENT_MANIFEST) }
    //     );
    //   } catch (e2) { /* ignore */ }
    // }
    console.error("Error serving static asset:", e);
    return new Response("Asset not found", { status: 404 });
  }
}


export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/prepare-email" && request.method === "POST") {
      if (!env.API_KEY) {
        return Response.json({ error: "API key not configured for the worker." }, { status: 500 });
      }
      try {
        const ai = new GoogleGenAI({ apiKey: env.API_KEY });
        const {
          userEmail, inputs, calculations, selectedBitrixPlan, annualLicenseCostArs,
          fixedImplementationCostArs, usdToArsExchangeRate
        } = await request.json() as any; // Cast to any or define a specific type for the request body

        const formatCurrency = (value: number | null | undefined) => {
          if (value === null || value === undefined) return 'N/A';
          return value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 });
        };
        
        const prompt = `
Eres un asistente virtual para Efficiency24. Un usuario ha utilizado la calculadora de ROI.
Prepara el cuerpo de un correo electrónico profesional en texto plano para enviar a hola@efficiency24.io.
El correo debe incluir la siguiente información de manera clara y organizada:

1. El correo electrónico del consultante.
2. Todos los datos que el consultante ingresó en la calculadora.
3. Todos los resultados que la calculadora generó para el consultante.

Aquí están los datos:

Correo del Consultante: ${userEmail}

Datos Ingresados:
- Consultas por mes: ${inputs.inquiriesPerMonth}
- % Automatización Chatbot: ${inputs.automationPercentageChatbot}%
- Tiempo por Consulta (min): ${inputs.timePerInquiryMinutes}
- Horas CRM Mensuales (por empleado): ${inputs.manualCrmHoursMonthly}
- % Automatización CRM: ${inputs.automationPercentageCrm}%
- Miembros del Equipo Involucrados: ${inputs.teamMembers}
- Costo Hora Empleado (ARS): ${formatCurrency(inputs.hourlyCostArs)}
- Plan Bitrix24 Seleccionado: ${selectedBitrixPlan.name} (${selectedBitrixPlan.monthlyPriceUSD} USD/mes)
- Costo Anual Licencia Bitrix24 (ARS): ${formatCurrency(annualLicenseCostArs)} (a ${usdToArsExchangeRate} ARS/USD)
- Costo Implementación Fijo (ARS): ${formatCurrency(fixedImplementationCostArs)}
- Ticket Promedio Venta (ARS): ${inputs.avgSaleTicketArs !== null ? formatCurrency(inputs.avgSaleTicketArs) : 'No provisto'}
- Tasa Conversión Actual (%): ${inputs.currentConversionRate !== null ? inputs.currentConversionRate : 'No provisto'}
- Tasa Conversión Esperada con Chatbot (%): ${inputs.expectedConversionRateChatbot !== null ? inputs.expectedConversionRateChatbot : 'No provisto'}

Resultados Calculados:
- Total Horas Anuales Ahorradas: ${calculations.totalHoursSavedAnnual.toFixed(0)} horas
- Ahorro Anual Total de Costos (ARS): ${formatCurrency(calculations.totalAnnualCostSavingsArs)}
- Inversión Inicial Total (ARS): ${formatCurrency(calculations.totalInvestmentArs)}
- ROI Estimado: ${calculations.roiPercentage.toFixed(1)}%
- Ingresos Anuales Adicionales Estimados (ARS): ${inputs.avgSaleTicketArs && inputs.avgSaleTicketArs > 0 && calculations.estimatedAddedRevenueArs > 0 ? formatCurrency(calculations.estimatedAddedRevenueArs) : 'No aplicable'}

Formatea esto como el cuerpo de un correo electrónico. Comienza con un saludo apropiado (ej: "Saludos equipo Efficiency24,") e indica que es una nueva consulta de la calculadora. Finaliza con una sugerencia para contactar al consultante.
No incluyas un asunto en tu respuesta, solo el cuerpo del correo.
`;
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
        });
        const emailBody = response.text;
        
        // Log to Worker console (for debugging/monitoring in Cloudflare Dashboard)
        console.log(`Email content prepared for hola@efficiency24.io regarding ${userEmail}`);

        return Response.json({ emailBody });

      } catch (error: any) {
        console.error("Error in /api/prepare-email:", error);
        return Response.json({ error: error.message || "Failed to generate email content." }, { status: 500 });
      }
    }
    
    // For any other request, serve static assets
    return serveStaticAsset(request, env, ctx);
  },
};