# Forge369

Forge369 is an AI-assisted digital product foundry. It discovers problems worth solving, scores commercial opportunities, guides product creation and packages completed products for launch.

## MVP workflow

1. Discover demand signals
2. Score and shortlist profit pockets
3. Select an opportunity
4. Architect the product and offer
5. Research and create the deliverables
6. Quality-check and package the launch

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Supabase

1. Create a Supabase project named `forge369-prod`.
2. Open the SQL editor and run `supabase/schema.sql`.
3. Copy the project URL and publishable/anon key into `.env.local`.
4. Never commit `.env.local` or the service-role key.

## Deployment

Import this GitHub repository into Vercel. Add the same environment variables in Vercel Project Settings, then deploy.

## Current status

The first build includes the responsive Command Center, weighted opportunity scoring, sample profit pockets, the active product pipeline and a production-oriented Supabase schema. Live scanning, authentication and AI generation are the next implementation phase.
