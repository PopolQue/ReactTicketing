# RestAdapter Server-Side Invariants Contract

To safely use the `RestAdapter`, the host API **MUST** enforce the following constraints:

1. **Session Verification**: The API must independently verify the scan session token signature using the shared `scanSessionSecret`.
2. **Atomic Scan Validation**: The `validateTicket` endpoint must implement an atomic database operation:
   - Check if `ticket.status` is "valid".
   - If yes, update to "used".
   - If no, return the appropriate error (e.g., "already_used").
   - This prevents race conditions from concurrent offline devices.
3. **Clock Skew Check**:
   - Compare `scannedAt` from the request with the server NTP clock.
   - If `|clientTime - serverTime| > maxClockSkewSeconds`, mark scan as `result: "clock_skew_anomaly"`.
   - If `|clientTime - serverTime| > 3600s`, reject as `result: "invalid"`.
