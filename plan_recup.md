Your message came through truncated, so the specific question didn't make it — but based on the search results and the code, it looks like you're working on the delivery fee estimation for this laundry app (the `calculateDeliveryFee` / `clientDeliveryPreview` flow). Here's what stands out from what you shared:

**What's already solid**

- The pricing order in the receipt is correct: delivery fee is added *after* the percentage discount and loyalty reward are subtracted (`netTotal = max(0, total − discounts) + deliveryFee`), so discounts never erode the delivery charge.
- Distance/zone-based pricing (`fee`, `distanceKm`, `zoneLabel`) is the right model for local last-mile delivery. The carrier calculators in those search results (UPS, USPS, volumetric weight) are built for parcel networks — dimensional weight and origin/destination ZIP logic don't really apply to a laundry service delivering within a city.

**Potential issues in the current code**

1. **Inline calculation on every render** — `db.calculateDeliveryFee(...)` is called inside the receipt IIFE during render. If it's a pure, synchronous distance formula (e.g., Haversine against zone radii), that's fine; if it ever hits storage or an API, memoize it (`useMemo` keyed on customer coords + `withDelivery`).
2. **Missing-coordinates guard** — when `withDelivery` is true but the customer has no `coordonnees_livraison` / lat-lng, the calc runs anyway. Worth short-circuiting to a "position GPS manquante" state instead of silently returning 0 or "Hors zone", since those mean different things to the cashier.
3. **"Hors zone" is silently free** — `deliveryFee = deliveryCalc.fee || 0`, so an out-of-zone customer gets delivery toggled on with 0 FCFA charged. Blocking order creation (or forcing the toggle off) when the zone is invalid would prevent that leak.
4. **Fallback default of 50%** for the express markup when `setting_express_markup` is missing is a magic number — worth centralizing with the delivery zone config.

What was the actual question — are you debugging the fee calculation, designing the zone/pricing formula itself, or something else from the search results?