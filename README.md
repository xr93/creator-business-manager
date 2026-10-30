This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Project structure

- `app/page.tsx` composes the homepage at `/`.
- `app/layout.tsx` owns the shared document shell, fonts, metadata, and global stylesheet import.
- `app/globals.css` defines global styles and the Tailwind theme.
- `components/home/` contains the homepage introduction and action links.
- `public/` contains static assets.

Keep routes in the root-level `app/` directory: each additional page belongs in
`app/<route>/page.tsx`. Organize reusable components by feature under the root-level
`components/` directory. Shared UI such as a header or sidebar belongs in the
appropriate `layout.tsx`, using components extracted from `components/` as needed.
Keep homepage-specific content out of shared layouts.

## Getting Started

### Authentication

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in
`.env.local`. Use an existing Supabase Auth email/password account to sign in at
`/login`. Signed-out requests redirect to login; signed-in users see Overview at
`/`. The root layout shows shared navigation only for authenticated users.

`proxy.ts` verifies and refreshes sessions. The server actions in
`app/login/actions.ts` handle sign-in and sign-out. Remember me uses persistent
cookies with a 30-day lifetime; unchecked uses browser-session cookies, including
after token refresh. Browser session restoration may preserve session cookies.
Supabase session expiry/revocation can still require another sign-in.

Registration and password reset are not implemented. Overview still contains
sample business data. Database access must also be protected by Supabase RLS;
page redirects do not replace database authorization.

Run cookie persistence checks with `node --test tests/session.test.mjs` (Node 22.18+
or 24+). For a manual end-to-end check: sign in with each checkbox setting,
reload, restart the browser, and sign out. Confirm that sign-out prevents access
to `/` and that remembered sessions skip `/login` while valid.

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
