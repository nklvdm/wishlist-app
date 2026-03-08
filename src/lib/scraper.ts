export interface UrlMeta {
  title?: string;
  image?: string;
  price?: number;
}

async function tryMicrolink(url: string): Promise<UrlMeta> {
  const res = await fetch(
    `https://api.microlink.io?url=${encodeURIComponent(url)}`,
    { signal: AbortSignal.timeout(6000) }
  );
  const data = await res.json();
  if (data.status !== "success") return {};
  return {
    title: data.data?.title ?? undefined,
    image: data.data?.image?.url ?? undefined,
    price: data.data?.price?.amount ? Math.round(data.data.price.amount) : undefined,
  };
}

async function tryJsonlink(url: string): Promise<UrlMeta> {
  const res = await fetch(
    `https://jsonlink.io/api/extract?url=${encodeURIComponent(url)}`,
    { signal: AbortSignal.timeout(6000) }
  );
  const data = await res.json();
  return {
    title: data.title ?? undefined,
    image: Array.isArray(data.images) && data.images[0] ? data.images[0] : undefined,
  };
}

async function tryDirectOG(url: string): Promise<UrlMeta> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Accept-Language": "ru-RU,ru;q=0.9",
    },
    signal: AbortSignal.timeout(5000),
  });
  const html = await res.text();

  const get = (patterns: RegExp[]) => {
    for (const p of patterns) {
      const m = html.match(p);
      if (m?.[1]) return m[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"').trim();
    }
  };

  const title = get([
    /<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i,
    /<meta[^>]+content="([^"]+)"[^>]+property="og:title"/i,
    /<title>([^<]{3,})<\/title>/i,
  ]);

  const image = get([
    /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i,
    /<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i,
  ]);

  const priceRaw = get([
    /<meta[^>]+property="product:price:amount"[^>]+content="([^"]+)"/i,
    /<meta[^>]+itemprop="price"[^>]+content="([^"]+)"/i,
    /"price"\s*:\s*"?(\d+(?:[.,]\d+)?)"?/i,
    /(\d[\d\s]{2,6})\s*₽/,
  ]);
  const price = priceRaw
    ? Math.round(parseFloat(priceRaw.replace(/\s/g, "").replace(",", ".")))
    : undefined;

  return { title, image, price: price && price < 10_000_000 ? price : undefined };
}

export async function scrapeUrlMeta(url: string): Promise<UrlMeta> {
  const results = await Promise.allSettled([
    tryMicrolink(url),
    tryJsonlink(url),
    tryDirectOG(url),
  ]);

  const merge = (a: UrlMeta, b: UrlMeta): UrlMeta => ({
    title: a.title || b.title,
    image: a.image || b.image,
    price: a.price || b.price,
  });

  return results
    .filter((r) => r.status === "fulfilled")
    .map((r) => (r as PromiseFulfilledResult<UrlMeta>).value)
    .reduce(merge, {});
}
