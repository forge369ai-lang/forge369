export type Opportunity = {
  id: string;
  title: string;
  audience: string;
  problem: string;
  format: string;
  source: string;
  urgency: number;
  demand: number;
  willingness: number;
  transformation: number;
  competition: number;
  reach: number;
  feasibility: number;
  expansion: number;
  trend: "Rising" | "Stable" | "Emerging";
};
