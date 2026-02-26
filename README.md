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
[ ] OG images
[ ] Caching and rate limits
[ ] View count
[ ] Terms page
[ ] Injection safeguards
[ ] favicon
[ ] Proper tags
[ ] Featured banner redo
[ ] Upvoting
[ ] Meta updates
[ ] restyling the notification banner
[ ] restyling the empty state
[ ] restyling the layout on the recipe page
[ ] slug length validation
[ ] sorting
