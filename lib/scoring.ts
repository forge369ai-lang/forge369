import type { Opportunity } from "./types";

export const weights = {
  urgency: 20,
  demand: 20,
  willingness: 15,
  transformation: 15,
  competition: 10,
  reach: 10,
  feasibility: 5,
  expansion: 5,
} as const;

export function scoreOpportunity(item: Opportunity) {
  return Math.round(
    Object.entries(weights).reduce((total, [key, weight]) => {
      return total + (item[key as keyof typeof weights] / 10) * weight;
    }, 0),
  );
}
