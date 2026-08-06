// How an invoice.paid event should be recorded and reported. Pure — no env, no I/O.
//
// The distinction that matters: an ACQUISITION is a new paying customer (Purchase to Meta,
// payments.kind='initial'). Everything else is not. A recurring upsell is its own Stripe
// subscription, so its first invoice also carries billing_reason='subscription_create' — without
// this classifier it would be recorded as a new customer and reported as a Purchase, double-
// counting one buyer. Its kind uses the same 'upsell:<id>' shape as one-time upsell charges,
// which is what the app keys entitlement off (taichi_app db.js) and what buy-guides checks to
// avoid re-selling something the member already owns.

export type PaymentKind = 'initial' | 'renewal' | `upsell:${string}`;
export type CapiEvent = 'Purchase' | 'UpsellPurchase';

export interface InvoiceFacts {
  billingReason?: string | null;   // Stripe invoice.billing_reason
  upsellId?: string | null;        // subscription metadata.upsell_id
  test?: string | null;            // subscription metadata.test ('1' for TMTEST50 checkouts)
}

export interface InvoiceClass {
  kind: PaymentKind;
  upsellId: string | null;
  capiEvent: CapiEvent | null;     // null = report nothing to Meta
}

export function classifyInvoice(facts: InvoiceFacts): InvoiceClass {
  const upsellId = facts.upsellId ? facts.upsellId : null;
  // Fail safe: only subscription_create is an acquisition. Anything unrecognized is a renewal,
  // so a new Stripe billing_reason can never invent a customer or a Purchase.
  const isAcquisition = facts.billingReason === 'subscription_create';
  const kind: PaymentKind = !isAcquisition ? 'renewal' : upsellId ? `upsell:${upsellId}` : 'initial';
  // Internal test checkouts are not customers — they stay in the DB but never reach the pixel.
  const capiEvent: CapiEvent | null = !isAcquisition || facts.test === '1'
    ? null
    : upsellId ? 'UpsellPurchase' : 'Purchase';
  return { kind, upsellId, capiEvent };
}
