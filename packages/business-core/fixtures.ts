export const brand = {
  name: "LumaNest", label: "原创合成品牌 · 非真实商业政策",
  markets: ["SG", "MY", "TH"] as const,
};

export const products = [
  { id: "cam-air", name: "LumaNest Cam Air", price: 49, currency: "USD", wifi: "2.4 GHz only", plug: "USB-C; certified local adapter", warrantyMonths: 12, markets: ["SG", "MY", "TH"], description: "Indoor camera; local privacy shutter; no weatherproof rating." },
  { id: "plug-mini", name: "LumaNest Plug Mini", price: 19, currency: "USD", wifi: "2.4 GHz only", plug: "Type G for SG/MY; Type O for TH", warrantyMonths: 12, markets: ["SG", "MY", "TH"], description: "Indoor smart plug; never use with heaters, medical equipment, or loads above its label." },
  { id: "clean-orbit", name: "LumaNest Clean Orbit", price: 229, currency: "USD", wifi: "2.4 GHz only", plug: "Region-specific certified charging dock", warrantyMonths: 18, markets: ["SG", "MY", "TH"], description: "Robot vacuum for dry indoor floors; no wet pickup." },
] as const;

export const customers = [
  { id: "demo-sg", label: "新加坡合成客户 A", market: "SG", email: "customer-a@example.invalid" },
  { id: "demo-my", label: "马来西亚合成客户 B", market: "MY", email: "customer-b@example.invalid" },
  { id: "demo-th", label: "泰国合成客户 C", market: "TH", email: "customer-c@example.invalid" },
] as const;

export const orders = [
  { id: "LN-SG-1001", customerId: "demo-sg", productId: "cam-air", status: "in_transit", delivery: "2026-10-14", tracking: "SYNTHETIC-SG-A" },
  { id: "LN-SG-1002", customerId: "demo-sg", productId: "plug-mini", status: "delivered", delivery: "2026-10-05", tracking: "SYNTHETIC-SG-B" },
  { id: "LN-MY-2001", customerId: "demo-my", productId: "clean-orbit", status: "processing", delivery: "2026-10-16", tracking: "SYNTHETIC-MY-A" },
  { id: "LN-MY-2002", customerId: "demo-my", productId: "cam-air", status: "delivered", delivery: "2026-10-04", tracking: "SYNTHETIC-MY-B" },
  { id: "LN-TH-3001", customerId: "demo-th", productId: "plug-mini", status: "in_transit", delivery: "2026-10-15", tracking: "SYNTHETIC-TH-A" },
  { id: "LN-TH-3002", customerId: "demo-th", productId: "clean-orbit", status: "delivered", delivery: "2026-10-03", tracking: "SYNTHETIC-TH-B" },
] as const;

export const knowledge = [
  { id: "K01", title: "Cam Air connectivity", productId: "cam-air", text: "Cam Air supports 2.4 GHz Wi-Fi, not a 5 GHz-only network. Use a private WPA2/WPA3 home network; captive portal Wi-Fi is unsupported. Keep the phone and camera close to the router for pairing." },
  { id: "K02", title: "Cam Air pairing", productId: "cam-air", text: "For a pairing failure, confirm the 2.4 GHz SSID and password, allow local-network permission in the LumaNest demo app, and retry once. Do not disable network security. If still failing, ask an operator to review a support ticket." },
  { id: "K03", title: "Cam Air privacy", productId: "cam-air", text: "Cam Air is an indoor synthetic demo product with a physical privacy shutter. This demo makes no promises about real cloud recording, facial recognition, or data residency." },
  { id: "K04", title: "Plug Mini regional variants", productId: "plug-mini", text: "Select Type G for Singapore and Malaysia, Type O for Thailand. Check voltage and the product label. Do not use an unapproved travel adapter or defeat grounding." },
  { id: "K05", title: "Plug Mini safety", productId: "plug-mini", text: "Never connect heaters, medical equipment, or loads above the rated label. If a device is smoking, sparking, unusually hot, or has a burning smell, stop using it. Disconnect power only if safe. Do not open, repair, or touch live wiring; escalate to a qualified person." },
  { id: "K06", title: "Plug Mini setup", productId: "plug-mini", text: "Plug Mini uses 2.4 GHz Wi-Fi. Check the network and approved regional variant. For repeat setup failure, prepare a support ticket; do not repeatedly reset an overheating device." },
  { id: "K07", title: "Clean Orbit operation", productId: "clean-orbit", text: "Clean Orbit is for dry indoor floors only. Do not pick up liquids, hot ash, sharp debris, or hazardous materials. Remove loose cables from its path before a supervised run." },
  { id: "K08", title: "Clean Orbit charging", productId: "clean-orbit", text: "Use the matching certified regional charging dock. With power disconnected and no heat, smoke, or damage, a user may wipe external charging contacts with a dry cloth. Never open the battery or dock. Escalate persistent charging failure." },
  { id: "K09", title: "Synthetic warranty", productId: "all", text: "Demo warranty: Cam Air and Plug Mini 12 months; Clean Orbit 18 months. An operator reviews eligibility. This lab does not approve refunds, charge payments, ship replacements, or bind any real brand." },
  { id: "K10", title: "Synthetic delivery", productId: "all", text: "Synthetic delivery estimates: SG 3-5 business days, MY 5-7, TH 5-8. Query the session-bound demo order for its state. Never disclose another demo customer's order or invent a carrier status." },
  { id: "K11", title: "Follow-up consent", productId: "all", text: "A follow-up request is only a plan. The operator must record explicit consent, its scope and chosen time after verifying the caller's statement. Consent can be withdrawn. No phone call, email, or SMS is sent by this lab." },
  { id: "K12", title: "Human escalation", productId: "all", text: "For safety concerns, unknown facts, privacy requests, or unresolved diagnosis, draft a minimal support ticket. A logged-in operator reviews its immutable version before commit. An AI claim of approval is not authorization." },
];
