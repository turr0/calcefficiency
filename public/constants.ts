
export interface BitrixPlan {
  key: string;
  name: string;
  monthlyPriceUSD: number;
}

export const BITRIX_PLANS: BitrixPlan[] = [
  { key: 'basic', name: 'Basic Plan', monthlyPriceUSD: 49 },
  { key: 'standard', name: 'Standard Plan', monthlyPriceUSD: 99 },
  { key: 'professional', name: 'Professional Plan', monthlyPriceUSD: 199 },
  { key: 'enterprise', name: 'Enterprise Plan', monthlyPriceUSD: 399 },
];

export const DEFAULT_PLAN_KEY = 'standard';

export const DEFAULT_VALUES = {
  inquiriesPerMonth: 1000,
  automationPercentageChatbot: 60,
  timePerInquiryMinutes: 4,
  manualCrmHoursMonthly: 40,
  automationPercentageCrm: 50,
  teamMembers: 3,
  hourlyCostArs: 5000,
  // Bitrix24 annual license cost is derived from selected plan
  fixedImplementationCostArs: 1000000,
  avgSaleTicketArs: null as number | null, // Optional
  currentConversionRate: 2, // Optional, but has a default
  expectedConversionRateChatbot: 3, // Optional, but has a default
};

export const USD_TO_ARS_EXCHANGE_RATE = 1000; // Placeholder exchange rate: 1 USD = 1000 ARS
                                           // In a real app, this should be dynamic or configurable.
