# Yosra Elgohary: Portfolio

Personal portfolio for Yosra Elgohary, Social Media Specialist & Creative Strategist, with a built-in dashboard for managing all of its content.
Built with Next.js 16, TypeScript, Tailwind CSS 4, Motion and Supabase. English is at `/en` and Arabic at `/ar`. The dashboard is at `/admin`.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint
npm run typecheck
npm test           # form, security and migration tests. Needs no Supabase project.
```

With no Supabase connected, the site shows its original content from `supabase/seed-content/`, and `/admin` explains that it is not connected yet.

## Connect Supabase

Do this once, in order. Every step is safe to repeat.

1. **Fill in the settings.** Copy `.env.example` to `.env.local` and fill it in. The file explains where each value is in Supabase. Never put a secret in a chat, a commit or a `NEXT_PUBLIC_` variable.
2. **Create the tables, security rules and storage buckets.**
   ```bash
   npm run cms:migrate -- --dry-run   # shows what it would do, and changes nothing
   npm run cms:migrate
   ```
   It stops without changing anything if a table or type it needs already exists and did not come from these migrations. It never drops anything, and it leaves unrelated tables alone.
3. **Move the original content and images in.**
   ```bash
   npm run cms:seed
   ```
   A second run changes nothing. `npm run cms:seed -- --restore-missing` puts back original items that are missing, without overwriting anything edited since.
4. **Create your administrator account.** Run this in your own terminal. The password is typed there, hidden, and is not stored anywhere readable.
   ```bash
   npm run cms:create-admin
   ```
5. **Close public sign-ups.** In Supabase, go to Authentication > Sign In / Providers and turn off "Allow new users to sign up". A new account would have no dashboard access anyway, so this is a second lock.
6. **Allow password reset links.** In Authentication > URL Configuration, set the Site URL to your live address and add `https://your-domain.com/admin/auth/callback` to the Redirect URLs. Add `http://localhost:3000/admin/auth/callback` too if you use the dashboard locally.
7. **Check it.** This prints no secrets, so its output is safe to share.
   ```bash
   npm run cms:check
   ```

### Hosting

Set only `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` on the host. The website never uses the secret key or the database connection string: they are for the setup commands on your own computer.

After setup, `SUPABASE_DB_URL` can be deleted from `.env.local`, and `SUPABASE_SECRET_KEY` can be too until the next time you add an administrator.

## Using the dashboard

Everything is at `/admin`, with changes live on the website as soon as they are saved.

| Page | What it manages |
| --- | --- |
| Overview | What is live, what still needs attention, and which text has no Arabic yet |
| Homepage | Section order and visibility, hero, moving ribbon, Selected Work text |
| About me | Statement, description, portrait, extra images, principles, key facts |
| Services | Add, edit, reorder, hide and delete, with icons, images and linked projects |
| Projects | Add, edit, duplicate, publish, feature, reorder, galleries, case studies, each project's SEO, and the wall of pages |
| Project categories | The filter buttons above the projects |
| Work process | The steps, with icons or images |
| Results & achievements | The numbers. Only ever real ones |
| Contact information | Email, phone, WhatsApp, location and the contact section |
| Social media links | Shown in the contact section and footer |
| Navigation & footer | Links, the top bar button and the footer text |
| SEO | Defaults, each page's search and sharing details, and whether search engines may list the site |
| Website settings | Name, logos, favicon, default images, languages, small labels and the page-not-found message |
| Media library | Every file: search, upload, describe, replace, and safe deletion |

**Drafts and preview.** A project is private until it is published. "Preview" shows a draft on the real page, only to a signed-in administrator.

**Translations.** English and Arabic are edited side by side and never overwrite each other. While a text has no Arabic, the Arabic site shows the English and the Overview lists it.

**Files.** Replacing a file updates it everywhere it appears. A file in use cannot be deleted: the library says where it is used, and the database refuses as well.

**Hidden services.** Social Media Strategy, Content Planning and Community Management start hidden, because nothing published shows them yet. Show them from the Services page once a project does.

**Playing a video on the site.** Behance's player cannot be embedded on other sites, so a video project links out to Behance. To play one here instead, upload the file in that project's "How it appears" section.

## How it works

| Where | What it holds |
| --- | --- |
| `supabase/migrations/` | The database: tables, security rules, storage buckets and save operations |
| `supabase/seed-content/` | The original content. Used by the seed, and as the fallback when nothing is connected |
| `lib/cms/definitions.ts` | Every editable field, in the words the dashboard shows |
| `lib/cms/site.ts` | Turns stored content into what the pages read |
| `lib/cms/actions/` | Everything the dashboard can do, all on the server |
| `components/admin/` | The dashboard's interface |
| `app/admin/` | The dashboard's pages |
| `app/[lang]/` | The public website |

**Adding a field:** add it in `lib/cms/definitions.ts` and read it in `lib/cms/site.ts`. The form, its validation and its saving all follow from the definition. A unit test fails if the original content holds a value that no form field covers, because saving that form would lose it.

**Content** in two languages is stored as JSON such as `{"en": "...", "ar": "..."}`. **Files** live in Supabase Storage, and the database only stores their paths.

**Publishing without a deployment.** Public pages are static and cached, so they are fast. Every save clears that cache, so the next visitor gets the new content.

**Security** does not rely on the website behaving. Row Level Security and storage policies in the database decide who can read or change what, so visitors can only ever read published content, whatever they send. On top of that, `proxy.ts`, the dashboard layout and every action each check the session again. The publishable key in the browser can do nothing beyond what those rules allow. There is no public registration: `admin_users` is the only way in, and only an owner or the secret key can add to it.

## Brand rules

- **Colors:** only the five in `app/theme.css`: purple `#6C3BFF`, pink `#FF5C8A`, lavender `#F5F0FF`, lime `#C5FF41`, charcoal `#17151F`.
- **Text contrast:** on purple, use full lavender or lime only. Lavender with transparency falls below the accessible contrast level.
- **Lime** is for the main button, the ribbon and small details. Never put lime text on lavender.
- **Logo:** the files in `public/brand/` are cut directly from the original. Do not recolor or redraw them. Set only the height, with `w-auto`, and on a flex parent also set `self-start` or similar so it cannot stretch.
- **Arabic:** no italics and no letter spacing. Latin titles on Arabic pages go inside `<bdi>`.
- **No invented facts:** no made-up metrics, clients or experience.
