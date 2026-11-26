# Single-entry account repair

The previously emailed /account/access page was a separate standalone controller. Successful Auth login explicitly did not unlock/link the app vault, leaving a confusing dead end. Replace access and legacy recovery pages with a CSP-compatible external redirect bridge to the root application; preserve hash token without logging, sending it to a server or leaking a referrer. The root account gate consumes and clears email/signup/recovery token hashes before SDK verification. Recovery updates one password then opens the same stable workspace key; an unlinked legacy vault still requires proof of old password or biometric. No empty replacement or bypass.

Canonical user-facing URL: https://edumoney-web.diegoluissantospabon.chatgpt.site/

Sign-in uses email + password only. Confirmation appears only during account creation/new-password reset. Hidden email-link option removed from the main entry UI; existing service capability retained. Existing biometric entry retained. New shared password eye control preserves values, does not submit the form, exposes an accessible state and supports themes. Security settings use the same control. Server-verified owner role remains unchanged; confirmed active owner role checked with a targeted read, no passwords read or reset.

Tests this correction block: five link-service scenarios, seven existing service scenarios, one targeted owner access query, plus one fixture startup failure before any scenario (conservative count14 before packaging). TypeScript and targeted ESLint passed after fixing initial effect-state lint. Four packaged UI/bridge cases planned. No browser tools available in this managed Sites environment; no physical-device verification claimed.

Publish preserves all existing financial records, formulas, vault crypto implementation, admin service/RLS and appearance modules. Old static assets remain available; new static cache names, aliases, push handlers and safe activation preserved.
