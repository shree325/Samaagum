# Services Layer (Business Logic)

This folder contains all business logic services. Services are responsible for processing business rules, orchestrating transactions, and fetching/storing data via the repositories.

## Deliverables for Interns:

1. **Services (`*.service.ts`)**:
   - Write logic for business capabilities (e.g., user authentication, placing orders, checking product stock).
   - Fetch/mutate data using the repositories from `src/db/`.
   - Avoid direct dependency on HTTP/Express objects (`req`, `res`) here.
   - Example files:
     - `user.service.ts`
     - `product.service.ts`
     - `order.service.ts`
