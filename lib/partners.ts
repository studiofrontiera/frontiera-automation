/**
 * Where the export buttons send people who have no Make or n8n account yet.
 * Set NEXT_PUBLIC_MAKE_REF_URL / NEXT_PUBLIC_N8N_REF_URL in Vercel to our affiliate links;
 * the affiliate disclosure shows only when at least one of them is set.
 */
const makeRef = process.env.NEXT_PUBLIC_MAKE_REF_URL;
const n8nRef = process.env.NEXT_PUBLIC_N8N_REF_URL;

export const partners = {
  make: makeRef || "https://www.make.com/en/register",
  n8n: n8nRef || "https://n8n.io/pricing/",
  affiliate: !!(makeRef || n8nRef),
};
