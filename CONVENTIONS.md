# Project conventions

## Stack
Next.js App Router, Supabase, TypeScript, Vercel hosting

## Styling
- Use CSS variables from tokens.css, never hardcode colours
- Use component classes from components.css
- Fonts: Outfit (display/headings, weight 700 logo, 600 page titles), DM Sans (body/UI, weights 400 and 500)
- Dark theme is primary, light theme is secondary
- Theme switching via data-theme="dark|light" on html/body

## Key colours (always use variables, not hex)
- Accent: var(--mint)
- Backgrounds: var(--bg), var(--surface), var(--surface-2), var(--surface-3)
- Text: var(--text), var(--text-mid), var(--text-dim)
- Borders: var(--border), var(--border-hover)
- Categories: var(--red), var(--blue), var(--purple), var(--amber), var(--pink), var(--teal), var(--green), var(--orange), var(--sky)

## Component patterns
- Buttons: .btn, .btn-primary, .btn-ghost, .btn-danger
- Cards: .card, .stat-card, .video-card, .channel-card
- Tags: .tag-entertainment, .tag-tech, .tag-gaming etc
- Navigation: .nav-item, .nav-item.active-page, .nav-item.active-cat
- Topbar: .topbar, .tb-control, .view-btn
- Modals: .modal, .modal-backdrop
- Avatars: .avatar-xs through .avatar-xl

## Icons
- All nav icons: 16x16 viewBox, 1.5px stroke, round caps/joins, stroke="currentColor", fill="none"
- Exception: Settings icon uses Lucide gear at 24x24 viewBox rendered at 16x16
- Never use icon libraries — all icons are inline SVGs

## Logo
- Outfit 700, 22px, -0.5px letter-spacing
- "sub" in var(--mint), "scrub" in var(--text)
- HTML: <a class="logo"><span>sub</span>scrub</a>

## Tone of voice
- Cheeky, observational, warm
- Always direct humour at the situation (messy feeds, dead channels), never at the user
- Examples:
  - "Your feed scored 43%. Apparently that's a dumpster fire."
  - "347 channels. That's not a subscription list, that's a census."
  - "You've been subscribed for 3 years and watched 2 videos. That's commitment to something, just not their content."

## File structure
- Pages: app/[page]/page.tsx
- API routes: app/api/[route]/route.ts
- Utilities: lib/[name].ts
- Components: components/[name].tsx
- Styles: tokens.css (variables only), components.css (all UI classes)

## Database (Supabase)
- Use service role key for server-side operations
- Use anon key for client-side
- Foreign keys reference auth.users(id) for user_id
- Production DB on main branch, test DB on dev branch and local

## Git workflow
- main = production (auto-deploys to getsubscrub.com)
- dev = working branch (preview URLs)
- Never commit directly to main
- .env.local points to test database only

## API / data
- RSS feeds for detecting new uploads (free, no quota)
- YouTube API only for channel metadata and video details
- Track API usage in api_usage table

## Full reference
- See PRODUCT_BIBLE.md for complete product spec, features, marketing, and roadmap
```

Then when prompting Claude Code on a task, start with:
```
Read CONVENTIONS.md. Then [your task here].
```

Or for bigger features:
```
Read CONVENTIONS.md and section 6 of PRODUCT_BIBLE.md. Then [your task here].