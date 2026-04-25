# SwiftInvoice Security Specification

## Data Invariants
1. A user can only access their own business profile, clients, products, and invoices.
2. Invoices must have a valid client reference.
3. Invoice status transitions should be logical (e.g., from 'draft' to 'sent', but not from 'paid' back to 'draft' - though for simplicity we might allow some flexibility).
4. Totals must match the sum of items + tax (this is hard to enforce perfectly in rules without complex math, but we'll try basic validation).
5. Timestamps and ownership fields are immutable after creation.

## The Dirty Dozen Payloads (Target: DENY)

1. **Identity Spoofing**: Attempt to write an invoice with a `userId` belonging to another user.
2. **Resource Poisoning**: Create a client with a 1MB string in the `name` field.
3. **Ghost Field Update**: Update a business profile with an extra `isVerified: true` field.
4. **Orphaned Invoice**: Create an invoice for a client ID that doesn't exist.
5. **Cross-Tenant Read**: User A tries to read User B's list of clients.
6. **Immutable Field Escape**: Attempt to change `id` or `createdAt` on an existing invoice.
7. **Invalid Type Injection**: Send a boolean `true` for a `unitPrice` field in a product.
8. **Unverified Write**: Attempt to write data from an account with an unverified email (if enforced).
9. **Negative Financials**: Create an invoice with a negative `total`.
10. **State Skipping**: (Not strictly enforced but good to have) Try to set an invoice to 'paid' without it ever being 'sent'.
11. **PII Collection Scraping**: Attempting a collection-group query on all 'users' to get emails without specific user IDs.
12. **Denial of Wallet**: Sending deeply nested maps in an invoice notes field to blow up parsing costs.

## Test Runner (Draft)
```ts
// firestore.rules.test.ts (placeholder)
// We would test each of the above payloads using the Firebase Rules Unit Testing library.
```
