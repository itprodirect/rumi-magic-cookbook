## Rumi Magic Cookbook

Kid-safe recipe-card image generator with parent approval controls.

### Demo-Ready Checklist

- Configure `.env.local` from `.env.example` (at minimum: `DATABASE_URL`, `OPENAI_API_KEY`, `ADMIN_PIN_HASH`, `SESSION_SECRET`, `CRON_SECRET`).
- Run setup commands: `npm install`, `npm run db:migrate`, `npm run db:seed`.
- Run quality gates: `npm run lint` and `npm run build`.
- Start app with `npm run dev`.
- Builder submits from `/` and shows success/error messages.
- Gallery works at `/gallery` and shows empty/error states cleanly.
- Admin login works at `/admin`; unauthenticated requests to `/api/admin/queue|approve|reject|logout` return `401`.
- Cron endpoint requires `Authorization: Bearer <CRON_SECRET>` for `/api/cron/cleanup`.

### Admin PIN Hash Note

- Bcrypt hashes start with `$` and Next.js dotenv expansion may eat unescaped `$` tokens.
- Use `npm run setup:admin-pin` to generate a safe `.env.development.local`, or escape dollars as `\\$`.
- `SESSION_SECRET` must be 32+ chars. Use `npm run setup:session-secret`.
- One-shot local setup: `npm run setup:dev-secrets`.

See `docs/SETUP.md` for full setup and endpoint details.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
