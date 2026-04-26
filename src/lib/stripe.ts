import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY ?? "";
export const stripe = new Stripe(key, {
  apiVersion: "2026-04-22.dahlia",
  typescript: true,
});

export const STRIPEPriceMap = {
  pro: process.env.STRIPE_PRICE_ID_PRO,
} as const;
