
import React, { useState, useMemo, useCallback } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { BITRIX_PLANS, DEFAULT_PLAN_KEY, DEFAULT_VALUES, USD_TO_ARS_EXCHANGE_RATE, BitrixPlan } from './constants';
import InputField from './components/InputField';
import SectionTitle from './components/SectionTitle';

// Placeholder icons
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-3.86 8.25-8.625 8.25S3.75 16.556 3.75 12 7.61 3.75 12.375 3.75 21 7.444 21 12Z" /></svg>;
const CrmIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.375 1.438M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
const CostIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6H2.25m0-1.5S2.25 2.25 3.75 2.25h16.5c1.5 0 1.5 1.5 1.5 1.5V6a.75.75 0 0 1-.75.75h-.75m0-1.5S20.25 2.25 18.75 2.25H3.75m14.25 6.75c0-1.5-1.5-1.5-1.5-1.5H5.25c-1.5 0-1.5 1.5-1.5 1.5s1.5 1.5 1.5 1.5h12.75c1.5 0 1.5-1.5 1.5-1.5Z" /></svg>;
const RevenueIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" /></svg>;
const ResultsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" /></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>;
const EmailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>;

// Initialize Gemini AI Client
// IMPORTANT: This assumes process.env.API_KEY is set in the environment where this code runs.
// Do NOT hardcode API keys.
let ai: GoogleGenAI | null = null;
try {
    if (process.env.API_KEY) {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } else {
        console.warn("API_KEY environment variable not found. Gemini API features will be disabled.");
    }
} catch (error) {
    console.error("Error initializing GoogleGenAI:", error);
}


const App: React.FC = () => {
  const [inputs, setInputs] = useState({
    inquiriesPerMonth: DEFAULT_VALUES.inquiriesPerMonth,
    automationPercentageChatbot: DEFAULT_VALUES.automationPercentageChatbot,
    timePerInquiryMinutes: DEFAULT_VALUES.timePerInquiryMinutes,
    manualCrmHoursMonthly: DEFAULT_VALUES.manualCrmHoursMonthly,
    automationPercentageCrm: DEFAULT_VALUES.automationPercentageCrm,
    teamMembers: DEFAULT_VALUES.teamMembers,
    hourlyCostArs: DEFAULT_VALUES.hourlyCostArs,
    selectedBitrixPlanKey: DEFAULT_PLAN_KEY,
    avgSaleTicketArs: DEFAULT_VALUES.avgSaleTicketArs,
    currentConversionRate: DEFAULT_VALUES.currentConversionRate,
    expectedConversionRateChatbot: DEFAULT_VALUES.expectedConversionRateChatbot,
  });

  const [userEmail, setUserEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');


  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target;
    
    if (id === 'userEmail') {
      setUserEmail(value);
      if (emailError) setEmailError(''); // Clear error on typing
      return;
    }

    const isNumericField = type === 'number' || 
                           id === 'automationPercentageChatbot' || 
                           id === 'automationPercentageCrm' ||
                           id === 'currentConversionRate' ||
                           id === 'expectedConversionRateChatbot';
                           
    let processedValue: string | number | null = value;
    if (isNumericField) {
      processedValue = value === '' ? null : parseFloat(value);
      if (id === 'avgSaleTicketArs' && value === '') processedValue = null;
    }

    setInputs(prev => ({ ...prev, [id]: processedValue }));
    if (showResults) setShowResults(false); // Hide results if inputs change
    if (submitMessage) setSubmitMessage('');

  }, [emailError, showResults, submitMessage]);
  
  const selectedBitrixPlan = useMemo(() => 
    BITRIX_PLANS.find(plan => plan.key === inputs.selectedBitrixPlanKey) || BITRIX_PLANS.find(p => p.key === DEFAULT_PLAN_KEY) || BITRIX_PLANS[0],
    [inputs.selectedBitrixPlanKey]
  );

  const annualLicenseCostArs = useMemo(() => 
    selectedBitrixPlan.monthlyPriceUSD * 12 * USD_TO_ARS_EXCHANGE_RATE,
    [selectedBitrixPlan]
  );

  const calculations = useMemo(() => {
    const {
      inquiriesPerMonth, automationPercentageChatbot, timePerInquiryMinutes,
      manualCrmHoursMonthly, automationPercentageCrm, teamMembers, hourlyCostArs,
      avgSaleTicketArs, currentConversionRate, expectedConversionRateChatbot
    } = inputs;

    const chatbotMonthlyHoursSaved = (inquiriesPerMonth * (automationPercentageChatbot / 100) * timePerInquiryMinutes) / 60;
    const annualCostSavingsChatbotArs = chatbotMonthlyHoursSaved * hourlyCostArs * 12;

    const crmAnnualHoursSaved = manualCrmHoursMonthly * (automationPercentageCrm / 100) * teamMembers * 12;
    const annualCostSavingsCrmArs = crmAnnualHoursSaved * hourlyCostArs;
    
    const totalAnnualCostSavingsArs = annualCostSavingsChatbotArs + annualCostSavingsCrmArs;
    const totalInvestmentArs = annualLicenseCostArs + DEFAULT_VALUES.fixedImplementationCostArs;
    
    const roiPercentage = totalInvestmentArs > 0 ? ((totalAnnualCostSavingsArs - totalInvestmentArs) / totalInvestmentArs) * 100 : 0;

    const totalHoursSavedAnnual = (chatbotMonthlyHoursSaved * 12) + crmAnnualHoursSaved;

    let estimatedAddedRevenueArs = 0;
    if (avgSaleTicketArs !== null && avgSaleTicketArs > 0 && currentConversionRate !== null && expectedConversionRateChatbot !== null) {
      const conversionImprovement = (expectedConversionRateChatbot / 100) - (currentConversionRate / 100);
      if (conversionImprovement > 0) {
        estimatedAddedRevenueArs = inquiriesPerMonth * conversionImprovement * avgSaleTicketArs * 12;
      }
    }

    return {
      chatbotMonthlyHoursSaved,
      annualCostSavingsChatbotArs,
      crmAnnualHoursSaved,
      annualCostSavingsCrmArs,
      totalAnnualCostSavingsArs,
      totalInvestmentArs,
      roiPercentage,
      totalHoursSavedAnnual,
      estimatedAddedRevenueArs,
    };
  }, [inputs, annualLicenseCostArs]);

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const generateAndPrepareEmailData = async () => {
    if (!ai) {
        console.warn("Gemini AI client not initialized. Skipping email preparation.");
        setSubmitMessage("Servicio de preparación de datos no disponible en este momento.");
        return; // Or throw an error / handle gracefully
    }

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
- Costo Anual Licencia Bitrix24 (ARS): ${formatCurrency(annualLicenseCostArs)}
- Costo Implementación Fijo (ARS): ${formatCurrency(DEFAULT_VALUES.fixedImplementationCostArs)}
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

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: prompt,
      });
      const emailBody = response.text;
      console.log("Email content prepared for hola@efficiency24.io:");
      console.log("Subject: Nueva Consulta ROI Calculadora - " + userEmail);
      console.log("Body:\n", emailBody);
      setSubmitMessage("¡Gracias! Sus resultados están listos y sus datos han sido procesados para nuestro equipo.");
      setShowResults(true);
    } catch (error) {
      console.error("Error generating email content with Gemini:", error);
      setSubmitMessage("Hubo un error al procesar sus datos. Por favor, intente nuevamente.");
      setShowResults(false); // Optionally, still show results or handle error more gracefully
    }
  };


  const handleShowResults = async () => {
    setEmailError('');
    setSubmitMessage('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userEmail || !emailRegex.test(userEmail)) {
      setEmailError('Por favor, ingrese un correo electrónico válido.');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('Procesando su información y generando resultados...');
    
    await generateAndPrepareEmailData(); // This will handle setting showResults

    setIsSubmitting(false);
  };

  const handlePrint = () => {
    window.print();
  };
  
  const bitrixPlanOptions = BITRIX_PLANS.map(plan => ({
    value: plan.key,
    label: `${plan.name} - $${plan.monthlyPriceUSD}/mes USD`
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold text-[#007bff]">Efficiency24</h1>
        <p className="text-2xl font-semibold text-gray-700 mt-1">Calculadora de ROI para Adopción de Bitrix24 y Chatbot</p>
        <p className="text-md text-gray-600">Estime ahorros y crecimiento para su PyME en Argentina.</p>
      </header>

      <div className="max-w-4xl mx-auto mb-10">
        <section>
          <SectionTitle title="Información de la Industria: Ahorros de Tiempo Reales" icon={<InfoIcon />} />
          <div className="p-6 bg-blue-50 border border-[#007bff] rounded-lg text-gray-700 space-y-4 shadow">
            <div>
              <h4 className="font-semibold text-[#007bff]">Reducción Promedio de Tiempo con Chatbot:</h4>
              <p>Los chatbots suelen automatizar entre el <strong className="text-gray-900">60% y el 80%</strong> de las consultas de los clientes, ahorrando un promedio de <strong className="text-gray-900">3 a 5 minutos por consulta</strong>. Esto puede resultar en cientos de horas ahorradas al año para las PyMEs.</p>
            </div>
            <div>
              <h4 className="font-semibold text-[#007bff]">Reducción Promedio de Tiempo con CRM Bitrix24:</h4>
              <p>Bitrix24 automatiza y optimiza tareas administrativas, de ventas y de atención al cliente, reduciendo la carga de trabajo manual en un promedio del <strong className="text-gray-900">30% al 50%</strong>, según estudios de Nucleus Research.</p>
            </div>
          </div>
        </section>
      </div>

      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg p-6 sm:p-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          
          <div className="space-y-8">
            <section>
              <SectionTitle title="Automatización de Atención al Cliente (Chatbot)" icon={<ChatIcon />} />
              <InputField label="Número de consultas de clientes por mes" id="inquiriesPerMonth" type="number" value={inputs.inquiriesPerMonth} onChange={handleInputChange} min={0} />
              <InputField label="% de consultas automatizables por el chatbot" id="automationPercentageChatbot" type="number" value={inputs.automationPercentageChatbot} onChange={handleInputChange} unit="%" min={0} max={100} />
              <InputField label="Tiempo promedio por consulta manual (minutos)" id="timePerInquiryMinutes" type="number" value={inputs.timePerInquiryMinutes} onChange={handleInputChange} unit="min" min={0} />
            </section>

            <section>
              <SectionTitle title="Automatización de CRM (Bitrix24)" icon={<CrmIcon />} />
              <InputField label="Horas mensuales en tareas manuales de CRM (por empleado relevante)" id="manualCrmHoursMonthly" type="number" value={inputs.manualCrmHoursMonthly} onChange={handleInputChange} unit="hs" min={0} />
              <InputField label="% de tareas de CRM automatizables con Bitrix24" id="automationPercentageCrm" type="number" value={inputs.automationPercentageCrm} onChange={handleInputChange} unit="%" min={0} max={100} />
              <InputField label="Número de miembros del equipo involucrados" id="teamMembers" type="number" value={inputs.teamMembers} onChange={handleInputChange} min={1} />
            </section>
          </div>

          <div className="space-y-8">
            <section>
              <SectionTitle title="Costos e Inversión" icon={<CostIcon />} />
              <InputField label="Costo promedio por hora por empleado (ARS)" id="hourlyCostArs" type="number" value={inputs.hourlyCostArs} onChange={handleInputChange} unit="ARS" min={0} />
              
              <InputField 
                label="Selección de Plan Bitrix24" 
                id="selectedBitrixPlanKey" 
                type="text"
                value={inputs.selectedBitrixPlanKey} 
                onChange={handleInputChange} 
                options={bitrixPlanOptions}
              />
              <div className="mt-1 p-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                <p>Plan Seleccionado: <span className="font-semibold">{selectedBitrixPlan.name}</span></p>
                <p>Costo Mensual: <span className="font-semibold">${selectedBitrixPlan.monthlyPriceUSD} USD</span></p>
                <p>Costo Anual de Licencia: <span className="font-semibold">{formatCurrency(annualLicenseCostArs)} ARS</span> (a {USD_TO_ARS_EXCHANGE_RATE} ARS/USD)</p>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Costo Fijo de Implementación (ARS)</label>
                <p className="mt-1 text-lg font-semibold text-gray-800 p-2 bg-gray-100 rounded-md">{formatCurrency(DEFAULT_VALUES.fixedImplementationCostArs)}</p>
              </div>
            </section>

            <section>
              <SectionTitle title="Opcional: Potencial de Crecimiento de Ingresos" icon={<RevenueIcon />} />
              <InputField label="Ticket promedio de venta (ARS)" id="avgSaleTicketArs" type="number" value={inputs.avgSaleTicketArs ?? ''} onChange={handleInputChange} unit="ARS" min={0} isOptional />
              <InputField label="Tasa de conversión actual (%)" id="currentConversionRate" type="number" value={inputs.currentConversionRate ?? ''} onChange={handleInputChange} unit="%" min={0} max={100} isOptional />
              <InputField label="Tasa de conversión esperada con chatbot (%)" id="expectedConversionRateChatbot" type="number" value={inputs.expectedConversionRateChatbot ?? ''} onChange={handleInputChange} unit="%" min={0} max={100} isOptional />
            </section>
          </div>
        </div>

        {/* Email Input and Submit Section */}
        <section className="mt-10 pt-8 border-t border-gray-300">
           <SectionTitle title="Obtenga sus Resultados Personalizados" icon={<EmailIcon />} />
          <p className="text-sm text-gray-600 mb-4">Ingrese su correo para recibir sus resultados personalizados.</p>
          <InputField 
            label="Su Correo Electrónico" 
            id="userEmail" 
            type="text" /* HTML5 type 'email' could also be used */
            value={userEmail} 
            onChange={handleInputChange} 
            placeholder="nombre@empresa.com"
          />
          {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
          
          <button
            onClick={handleShowResults}
            disabled={isSubmitting || !ai} // Disable if AI not available
            className="w-full mt-4 px-8 py-3 bg-[#007bff] text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Procesando...' : 'Calcular y Ver Resultados'}
          </button>
          {!ai && <p className="text-sm text-amber-700 mt-2">Nota: La funcionalidad completa de preparación de datos requiere configuración del API.</p>}
          {submitMessage && <p className={`text-sm mt-2 ${showResults ? 'text-green-600' : 'text-gray-700'}`}>{submitMessage}</p>}
        </section>


        {/* Results Section - Conditional Rendering */}
        {showResults && (
          <section className="mt-12 pt-8 border-t border-gray-300">
            <SectionTitle title="Resumen de Resultados Estimados" icon={<ResultsIcon />} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <ResultItem label="Total de Horas Anuales Ahorradas" value={`${calculations.totalHoursSavedAnnual.toFixed(0)} horas`} />
              <ResultItem label="Ahorro Anual Total de Costos" value={formatCurrency(calculations.totalAnnualCostSavingsArs)} isPrimary={true} />
              <ResultItem label="Costo Anual Licencia Bitrix24" value={formatCurrency(annualLicenseCostArs)} />
              <ResultItem label="Inversión Inicial Total" value={formatCurrency(calculations.totalInvestmentArs)} />
              <ResultItem label="ROI Estimado" value={`${calculations.roiPercentage.toFixed(1)} %`} isPrimary={true} isPositive={calculations.roiPercentage > 0} isNegative={calculations.roiPercentage < 0} />
              {inputs.avgSaleTicketArs && inputs.avgSaleTicketArs > 0 && calculations.estimatedAddedRevenueArs > 0 && (
                <ResultItem label="Ingresos Anuales Adicionales Est." value={formatCurrency(calculations.estimatedAddedRevenueArs)} isPrimary={false}/>
              )}
            </div>
            <div className="mt-8 text-center">
              <button
                onClick={handlePrint}
                className="px-8 py-3 bg-[#007bff] text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150"
              >
                Imprimir / Guardar Resultados como PDF
              </button>
            </div>
          </section>
        )}
      </div>

      <footer className="text-center mt-12 pb-8">
        <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Efficiency24. Todos los cálculos son estimaciones.</p>
        <p className="text-xs text-gray-400 mt-1">La preparación de datos para envío interno utiliza la API de Gemini. El envío real de correos no está implementado en esta demo.</p>
      </footer>
    </div>
  );
};

interface ResultItemProps {
  label: string;
  value: string;
  isPrimary?: boolean;
  isPositive?: boolean;
  isNegative?: boolean;
}

const ResultItem: React.FC<ResultItemProps> = ({ label, value, isPrimary = false, isPositive, isNegative }) => (
  <div className={`p-4 rounded-lg shadow ${isPrimary ? 'bg-[#007bff] text-white' : 'bg-gray-100'}`}>
    <p className={`text-sm ${isPrimary ? 'text-blue-100' : 'text-gray-600'}`}>{label}</p>
    <p 
      className={`text-2xl font-bold 
        ${isPrimary ? 'text-white' : 
          isPositive ? 'text-green-600' : 
          isNegative ? 'text-red-600' : 'text-[#007bff]'
        }`}
    >
      {value}
    </p>
  </div>
);

export default App;
