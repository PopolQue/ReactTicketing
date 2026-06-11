# Testing Strategy

ReactTicket components are designed to be easily testable.

## Unit Testing
We use `vitest` for all logic and state machine testing.
The `LocalStorageAdapter` is heavily utilized in unit tests to mock the backend without needing a live database.

## Integration Testing
When integrating ReactTicket into your own app, you can use the `LocalStorageAdapter` to test your checkout flows using Cypress or Playwright.

```typescript
// Example Cypress Test
it('should complete checkout flow', () => {
  cy.visit('/tickets');
  cy.get('.rt-add-to-cart').click();
  cy.get('.rt-checkout-btn').click();
  
  // Your custom checkout flow assertion
  cy.url().should('include', '/payment');
});
```
