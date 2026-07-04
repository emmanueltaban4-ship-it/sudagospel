# Website Feed — Pagination ("Load More")

The `public-feed` edge function already supports `?limit=1-200&offset=0` and returns
`{ data, count, limit, offset }`. Below are drop-in snippets for your Verpex
cPanel website (PHP + vanilla JS) that render a list of **songs** or **articles**
with a "Load more" button.

Replace:
- `FEED_BASE` — your edge function base URL
- `WEBSITE_FEED_KEY` — the secret configured in Lovable Cloud

---

## 1. PHP proxy (`feed.php`)

Keeps the API key server-side. The browser calls `feed.php?resource=songs&offset=0&limit=12`.

```php
<?php
// feed.php
header('Content-Type: application/json');

$FEED_BASE = 'https://cmzugtsxgoaigrcrdiff.supabase.co/functions/v1/public-feed';
$FEED_KEY  = getenv('WEBSITE_FEED_KEY'); // set in cPanel > Environment Variables

$allowed  = ['songs', 'articles', 'artists', 'events', 'videos'];
$resource = $_GET['resource'] ?? '';
if (!in_array($resource, $allowed, true)) {
  http_response_code(400);
  echo json_encode(['error' => 'invalid resource']); exit;
}

$limit  = max(1, min(50, (int)($_GET['limit']  ?? 12)));
$offset = max(0, (int)($_GET['offset'] ?? 0));

$url = "$FEED_BASE/$resource?limit=$limit&offset=$offset";
$ch  = curl_init($url);
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER     => ["x-api-key: $FEED_KEY"],
  CURLOPT_TIMEOUT        => 15,
]);
$body = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

http_response_code($code ?: 502);
echo $body ?: json_encode(['error' => 'upstream error']);
```

---

## 2. HTML + JS "Load more" (songs)

```html
<section id="songs-section">
  <h2>Latest Songs</h2>
  <div id="songs-grid" class="grid"></div>
  <button id="songs-more" type="button" hidden>Load more</button>
  <p id="songs-status" class="muted"></p>
</section>

<script>
(function () {
  const PAGE_SIZE = 12;
  const grid   = document.getElementById('songs-grid');
  const more   = document.getElementById('songs-more');
  const status = document.getElementById('songs-status');
  let offset = 0, total = null, loading = false;

  function card(s) {
    const artist = (s.artists && s.artists.name) || '';
    return `
      <article class="song-card">
        <img loading="lazy" src="${s.cover_url || ''}" alt="${s.title}">
        <h3>${s.title}</h3>
        <p>${artist}</p>
      </article>`;
  }

  async function load() {
    if (loading) return;
    loading = true;
    more.disabled = true;
    status.textContent = 'Loading…';
    try {
      const r = await fetch(`/feed.php?resource=songs&limit=${PAGE_SIZE}&offset=${offset}`);
      const { data = [], count } = await r.json();
      total = count ?? total;
      grid.insertAdjacentHTML('beforeend', data.map(card).join(''));
      offset += data.length;
      const done = total != null ? offset >= total : data.length < PAGE_SIZE;
      more.hidden = done;
      status.textContent = done ? `All ${offset} loaded` : `${offset}${total ? ' of ' + total : ''}`;
    } catch (e) {
      status.textContent = 'Failed to load. Try again.';
      more.hidden = false;
    } finally {
      loading = false;
      more.disabled = false;
    }
  }

  more.addEventListener('click', load);
  load(); // initial page
})();
</script>
```

---

## 3. HTML + JS "Load more" (articles)

Same pattern, different resource + card fields:

```html
<section id="news-section">
  <h2>News</h2>
  <div id="news-list"></div>
  <button id="news-more" type="button" hidden>Load more</button>
  <p id="news-status" class="muted"></p>
</section>

<script>
(function () {
  const PAGE_SIZE = 9;
  const list   = document.getElementById('news-list');
  const more   = document.getElementById('news-more');
  const status = document.getElementById('news-status');
  let offset = 0, total = null, loading = false;

  function card(a) {
    const date = a.published_at ? new Date(a.published_at).toLocaleDateString() : '';
    return `
      <article class="news-card">
        ${a.cover_url ? `<img loading="lazy" src="${a.cover_url}" alt="${a.title}">` : ''}
        <div>
          <small>${a.category || ''} ${date ? '· ' + date : ''}</small>
          <h3>${a.title}</h3>
          <p>${a.excerpt || ''}</p>
        </div>
      </article>`;
  }

  async function load() {
    if (loading) return;
    loading = true; more.disabled = true;
    status.textContent = 'Loading…';
    try {
      const r = await fetch(`/feed.php?resource=articles&limit=${PAGE_SIZE}&offset=${offset}`);
      const { data = [], count } = await r.json();
      total = count ?? total;
      list.insertAdjacentHTML('beforeend', data.map(card).join(''));
      offset += data.length;
      const done = total != null ? offset >= total : data.length < PAGE_SIZE;
      more.hidden = done;
      status.textContent = done ? `All ${offset} loaded` : `${offset}${total ? ' of ' + total : ''}`;
    } catch {
      status.textContent = 'Failed to load. Try again.';
      more.hidden = false;
    } finally {
      loading = false; more.disabled = false;
    }
  }

  more.addEventListener('click', load);
  load();
})();
</script>
```

---

## Notes

- The edge function returns `count` (total matching rows) — use it to hide the button when all rows are loaded.
- `limit` is capped server-side at 200; the UI uses 12 (songs) / 9 (articles) per page.
- Store `WEBSITE_FEED_KEY` in cPanel environment variables — never in JS.
- For infinite scroll instead of a button, swap the click handler for an `IntersectionObserver` on a sentinel div at the bottom of the grid.
