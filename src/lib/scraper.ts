export interface UrlMeta {
  title?: string;
  image?: string;
  price?: number;
  description?: string;
}

export async function scrapeUrlMeta(url: string): Promise<UrlMeta> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; WishlistBot/1.0; +https://wishlist.app)",
      },
      signal: AbortSignal.timeout(5000),
    });

    const html = await res.text();

    const get = (patterns: RegExp[]): string | undefined => {
      for (const p of patterns) {
        const m = html.match(p);
        if (m?.[1]) return m[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"').trim();
      }
    };

    const title = get([
      /<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i,
      /<meta[^>]+content="([^"]+)"[^>]+property="og:title"/i,
      /<title>([^<]+)<\/title>/i,
    ]);

    const image = get([
      /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i,
      /<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i,
    ]);

    // Try to extract price — works on many Russian e-commerce sites
    const priceRaw = get([
      /<meta[^>]+property="product:price:amount"[^>]+content="([^"]+)"/i,
      /<meta[^>]+itemprop="price"[^>]+content="([^"]+)"/i,
      /"price"\s*:\s*"?(\d+(?:[.,]\d+)?)"?/i,
    ]);
    const price = priceRaw ? Math.round(parseFloat(priceRaw.replace(",", "."))) : undefined;

    return { title, image, price };
  } catch {
    return {};
  }
}
