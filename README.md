```txt
npm install
npm run dev
```

```txt
npm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
pnpm wrangler types
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>();
```

## Project

[x] Comments
[x] Consistent site titles
[x] Robots.txt
[x] Edit links
[x] AI curation
[x] View count
[x] OG images

feature
[ ] Terms page
[ ] Proper tags
[ ] Upvoting
[ ] sorting

code
[ ] restyling the notification banner
[ ] restyling the empty state
[ ] restyling the layout on the recipe page
[ ] slug length validation
[ ] Featured banner redo

chore
[ ] Caching and rate limits
[ ] Injection safeguards
[ ] favicon
[ ] Meta updates
[ ] Cookie consent
