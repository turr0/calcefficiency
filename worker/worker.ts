/// <reference types="@cloudflare/workers-types" />

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
// Solo necesitamos getAssetFromKV, mapRequestToAsset es más avanzado y puede complicar.
// Para SPAs, es mejor manejar la redirección a index.html manualmente si el path no existe.
import { getAssetFromKV } from "@cloudflare/kv-asset-handler"; 

export interface Env {
  API_KEY: string;
  __STATIC_CONTENT: KVNamespace;
  // REMOVIDO: __STATIC_CONTENT_MANIFEST ya no es necesario aquí con la configuración [site] en wrangler.toml
}

// Define the expected structure of the request body from the client
interface PrepareEmailRequestBody {
  userEmail: string;
  inputs: any; // Consider defining a more specific type for inputs
  calculations: any; // Consider defining a more specific type for calculations
  selectedBitrixPlan: { name: string; monthlyPriceUSD: number };
  annualLicenseCostArs: number;
  fixedImplementationCostArs: number;
  usdToArsExchangeRate: number;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/prepare-email" && request.method === "POST") {
      if (!env.API_KEY) {
        return Response.json({ error: "API key not configured for the worker." }, { status: 500 });
      }
      try {
        // Initialize Gemini AI client with the API key from environment secrets
        const ai = new GoogleGenAI({ apiKey: env.API_KEY });
        
        // Parse the request body
        const requestBody = await request.json();
        const {
          userEmail, inputs, calculations, selectedBitrixPlan, annualLicenseCostArs,
          fixedImplementationCostArs, usdToArsExchangeRate
        } = requestBody as PrepareEmailRequestBody; // Cast to the interface

        const formatCurrency = (value: number | null | undefined) => {
          if (value === null || value === undefined) return 'N/A';
          // Ensure it's a number before calling toLocaleString
          const numValue = Number(value);
          if (isNaN(numValue)) return 'N/A';
          return numValue.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 });
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
- Total Horas Anuales Ahorradas: ${Number(calculations.totalHoursSavedAnnual).toFixed(0)} horas
- Ahorro Anual Total de Costos (ARS): ${formatCurrency(calculations.totalAnnualCostSavingsArs)}
- Inversión Inicial Total (ARS): ${formatCurrency(calculations.totalInvestmentArs)}
- ROI Estimado: ${Number(calculations.roiPercentage).toFixed(1)}%
- Ingresos Anuales Adicionales Estimados (ARS): ${inputs.avgSaleTicketArs && inputs.avgSaleTicketArs > 0 && calculations.estimatedAddedRevenueArs > 0 ? formatCurrency(calculations.estimatedAddedRevenueArs) : 'No aplicable'}

Formatea esto como el cuerpo de un correo electrónico. Comienza con un saludo apropiado (ej: "Saludos equipo Efficiency24,") e indica que es una nueva consulta de la calculadora. Finaliza con una sugerencia para contactar al consultante.
No incluyas un asunto en tu respuesta, solo el cuerpo del correo.
`;
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17', // Use a compatible model
            contents: prompt,
        });
        const emailBody = response.text;
        
        console.log(`Email content prepared for hola@efficiency24.io regarding ${userEmail}`);

        return Response.json({ emailBody });

      } catch (error: any) {
        console.error("Error in /api/prepare-email:", error.message, error.stack);
        return Response.json({ error: error.message || "Failed to generate email content." }, { status: 500 });
      }
    }
    
    // Para cualquier otra solicitud (que no sea la API), intenta servir activos estáticos
    try {
      // Opciones para getAssetFromKV
      // Aquí, getAssetFromKV con ASSET_NAMESPACE será suficiente
      // Cloudflare Pages/Workers Sites manejan el manifest internamente con [site]
      const assetResponse = await getAssetFromKV(
        {
          request: request,
          waitUntil: (promise) => ctx.waitUntil(promise),
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          // REMOVIDO: ASSET_MANIFEST ya no se necesita aquí.
          // mapRequestToAsset es útil para manejar rutas SPA.
          mapRequestToAsset: (req) => {
            const url = new URL(req.url);
            // Si la solicitud es para la raíz o una ruta que parece no ser un archivo (sin extensión),
            // intenta servir index.html (común para SPAs)
            if (url.pathname === '/' || !url.pathname.includes('.')) {
              return new Request(`${url.origin}/index.html`, req);
            }
            // Para otras rutas, sirve el archivo tal cual
            return req;
          },
        }
      );
      return assetResponse;

    } catch (e: any) {
      console.error("Error serving static asset:", e);
      // Si el activo no se encuentra (por ejemplo, es una ruta que no existe)
      // y la lógica de `mapRequestToAsset` para SPA ya ha intentado index.html,
      // entonces es un 404 genuino.
      // Puedes refinar esto para manejar 404s específicos o redirigir a una página de error.
      return new Response("Asset not found or error in serving static content.", { status: 404 });
    }
  },
};
