# TripleStack

AI-powered expertise monetization funnel built on the Triple Threat methodology.

## Tech Stack
- React 18 + Vite
- Anthropic Claude API (claude-sonnet-4-20250514)
- GoHighLevel (webhooks, payment, calendar)
- CSS Modules

## Project Structure

```
src/
├── main.jsx              # React entry point
├── App.jsx               # Root — screen state & routing
├── index.css             # Global reset & CSS variables
├── config.js             # All URLs and constants
├── api.js                # Claude AI + GHL webhook calls
└── components/
    ├── Landing.jsx / .module.css     # Hero screen
    ├── Intake.jsx  / .module.css     # Lead capture form
    ├── Processing.jsx / .module.css  # AI loading state
    ├── Results.jsx / .module.css     # Free + paid results
    └── ThreatCard.jsx / .module.css  # Income stream card
```

## Local Development

```bash
npm install
npm run dev
```

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to vercel.com → New Project → Import repo
3. Framework preset: Vite
4. Click Deploy — done

## Configuration

All URLs live in `src/config.js`:

| Key               | Value                              |
|-------------------|------------------------------------|
| GHL_WEBHOOK_URL   | GoHighLevel inbound webhook        |
| GHL_CALENDAR_URL  | GHL calendar embed URL             |
| GHL_PAYMENT_URL   | GHL $7 payment link                |
| CLAUDE_MODEL      | claude-sonnet-4-20250514           |

## GHL Setup Required

1. **Webhook workflow** — receives lead data on intake + after payment
   - On `paid = false`: create contact, tag "TripleStack Lead"
   - On `paid = true`: tag "TripleStack Paid", send roadmap email

2. **Roadmap email** — use these GHL custom fields in the email body:
   - `{{threat1Title}}`, `{{threat1Description}}`, `{{threat1Earning}}`
   - `{{threat2Title}}`, `{{threat2Description}}`, `{{threat2Earning}}`
   - `{{threat3Title}}`, `{{threat3Description}}`, `{{threat3Earning}}`

3. **Payment link redirect** — set your app URL as the redirect destination
   (the app appends `?paid=true` automatically)

## User Flow

```
Landing → Intake → [Claude AI] → Results (Threat 1 free)
    → $7 payment (GHL) → Results (all 3 unlocked) → Book discovery call
```

## Brand Colors

| Token   | Hex       | Usage                        |
|---------|-----------|------------------------------|
| --lime  | #D7CF07   | Primary CTAs, Threat 1       |
| --orange| #F15A29   | Hook, upsell, Threats 2 & 3  |
| --purple| #540D6E   | Deep background base         |
| --black | #2a0a3a   | App background               |
