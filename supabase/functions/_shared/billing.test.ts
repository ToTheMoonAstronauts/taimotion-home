import { assertEquals } from 'jsr:@std/assert@1';
import { classifyInvoice } from './billing.ts';

Deno.test('base acquisition invoice is initial and reports Purchase', () => {
  assertEquals(classifyInvoice({ billingReason: 'subscription_create' }), {
    kind: 'initial', upsellId: null, capiEvent: 'Purchase',
  });
});

Deno.test('base renewal is a renewal and reports nothing (Purchase is acquisition-only)', () => {
  assertEquals(classifyInvoice({ billingReason: 'subscription_cycle' }), {
    kind: 'renewal', upsellId: null, capiEvent: null,
  });
});

// A recurring upsell is its own subscription, so its first invoice arrives with
// billing_reason=subscription_create — it must NOT be recorded as a new customer.
Deno.test('recurring upsell acquisition is kind upsell:<id> and reports UpsellPurchase', () => {
  assertEquals(classifyInvoice({ billingReason: 'subscription_create', upsellId: 'vip' }), {
    kind: 'upsell:vip', upsellId: 'vip', capiEvent: 'UpsellPurchase',
  });
});

Deno.test('recurring upsell renewal is a plain renewal and reports nothing', () => {
  assertEquals(classifyInvoice({ billingReason: 'subscription_cycle', upsellId: 'vip' }), {
    kind: 'renewal', upsellId: 'vip', capiEvent: null,
  });
});

// TMTEST50 internal checkouts are not customers: they must never reach the live pixel.
Deno.test('test checkouts classify for the DB but report no CAPI event', () => {
  assertEquals(classifyInvoice({ billingReason: 'subscription_create', test: '1' }), {
    kind: 'initial', upsellId: null, capiEvent: null,
  });
  assertEquals(classifyInvoice({ billingReason: 'subscription_create', upsellId: 'vip', test: '1' }), {
    kind: 'upsell:vip', upsellId: 'vip', capiEvent: null,
  });
});

Deno.test('unknown/absent billing_reason is treated as a renewal, never an acquisition', () => {
  // Fail safe: an unrecognized reason must not invent a new customer or a Purchase.
  assertEquals(classifyInvoice({}), { kind: 'renewal', upsellId: null, capiEvent: null });
  assertEquals(classifyInvoice({ billingReason: 'manual' }), {
    kind: 'renewal', upsellId: null, capiEvent: null,
  });
});

Deno.test('empty-string upsell metadata is not an upsell', () => {
  // create-subscription writes test:'' for real checkouts; blank metadata must read as absent.
  assertEquals(classifyInvoice({ billingReason: 'subscription_create', upsellId: '', test: '' }), {
    kind: 'initial', upsellId: null, capiEvent: 'Purchase',
  });
});
