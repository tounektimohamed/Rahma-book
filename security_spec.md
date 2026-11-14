# My Little Story — Security Specification

## 1. Data Invariants
1. **Orders contain PII & Child Photos**: No unauthenticated user or other customer may `get` or `list` any document in `/orders/{orderId}`. Only the authenticated order owner (`request.auth.uid == resource.data.userId`) or a verified admin (`isAdmin()`) can read an order.
2. **Server-Authoritative Pricing & Totals**: Client checkout must re-fetch live `price` values from `/stories/{storyId}` before constructing an order, and Firestore rules verify `total == subtotal + deliveryFee`, `subtotal > 0`, `deliveryFee >= 0`, `items.size() >= 1 && items.size() <= 10`, and that `items[0].storyId` exists in `/stories`.
3. **Immutable Order State on Creation**: New orders can only be created with `paymentMethod == 'COD'`, `status == 'pending'`, `confirmedAccurate == true`, and `createdAt == request.time`.
4. **Strict Document & Image Size Guards**: Every string has an explicit `.size()` bound. Compressed `childPhotoBase64` strings are bounded (`<= 220000` characters) to ensure the total Firestore order document stays well below the 1 MiB document ceiling.
5. **Catalog Integrity**: Only active stories (`resource.data.active == true`) are publicly readable. Catalog updates and deletes are strictly admin-only.

## 2. Adversarial Test Payloads ("Dirty Dozen")
1. **Public Order Scraping**: Unauthenticated `list` on `/orders` -> `PERMISSION_DENIED`.
2. **Cross-User Order Read**: Authenticated User B attempting `get` on User A's `/orders/{orderId}` -> `PERMISSION_DENIED`.
3. **Shadow Field Injection on Order**: Order `create` with extra field `discountOverride: 100` -> `PERMISSION_DENIED` (`hasOnly` check).
4. **Status Shortcutting on Order Create**: Order `create` with `status: 'delivered'` -> `PERMISSION_DENIED`.
5. **Payment Method Tampering**: Order `create` with `paymentMethod: 'FREE'` -> `PERMISSION_DENIED`.
6. **Total Arithmetic Tampering**: Order `create` with `subtotal: 65, deliveryFee: 7, total: 1` -> `PERMISSION_DENIED`.
7. **Orphan Story Reference**: Order `create` referencing non-existent `storyId: 'fake-story-999'` -> `PERMISSION_DENIED` (`exists()` check).
8. **Oversized Child Photo DoS**: Order `create` with `childPhotoBase64` exceeding 220,000 bytes -> `PERMISSION_DENIED`.
9. **Spoofed User ID**: Unauthenticated or mismatched `userId` on order creation -> `PERMISSION_DENIED`.
10. **Forged Timestamp**: Order `create` with client-supplied past `createdAt` instead of `request.time` -> `PERMISSION_DENIED`.
11. **Non-Admin Catalog Tampering**: Customer attempting `update` on `/stories/story-desert-stars` to change `price` to `0.01` -> `PERMISSION_DENIED`.
12. **Path Variable Poisoning**: Request with 500-character or special-character `{orderId}` -> `PERMISSION_DENIED` (`isValidId()`).
