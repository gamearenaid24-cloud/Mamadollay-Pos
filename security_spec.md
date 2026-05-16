# Security Specification - ERP POS System

## 1. Data Invariants
- A `Product` must have a unique `sku`.
- A `Sale` must have a valid `outletId` and `total >= 0`.
- `Stock` qty cannot be negative.
- Users can only access sales data belonging to their assigned `outletId` unless they are super `admin` or `owner`.

## 2. The Dirty Dozen Payloads (Rejection Targets)
1. **Identity Spoofing**: Attempt to create a user profile with `role: 'admin'` when the requester is not an admin.
2. **Resource Poisoning**: Attempt to set a `productId` to a 2MB string.
3. **Price Manipulation**: Attempt to update a product's `price` to `0.01` as a `kasir`.
4. **Inventory Fraud**: Attempt to set `stocks.qty` to `999999` without a valid movement.
5. **Cross-Outlet Data Leak**: A `kasir` from Outlet A attempting to read `sales` from Outlet B.
6. **Immutable Field Write**: Attempt to change `createdAt` on a `Sale` document.
7. **Phantom Outlets**: Create a product referencing a non-existent `outletId`.
8. **Shadow Fields**: Update a product with a `secretDiscountCode` field not in the schema.
9. **Status Locking Bypass**: Update a `Sale` that is already marked as `completed`.
10. **Unauthenticated Read**: Attempt to list `products` without being signed in.
11. **Email Spoofing**: Accessing private user data with an unverified email (if email verification is forced).
12. **Orphaned Sales Details**: Creating a `SaleDetail` without a corresponding `Sale` header (relational sync).

## 3. Test Runner (Draft Logic)
The `firestore.rules.test.ts` will verify these rejections.
