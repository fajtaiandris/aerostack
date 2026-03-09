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
[x] favicon
[x] Proper tags
[x] sorting

feature
[ ] Terms page
[ ] Featured banner copies
[ ] Upvoting

code
[ ] refactoring the css
[ ] slug length validation

chore
[ ] Caching and rate limits
[ ] Injection safeguards
[ ] Meta updates
[ ] Cookie consent
