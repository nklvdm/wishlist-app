export interface UrlMeta {
  title?: string;
  image?: string;
  price?: number;
}

export async function scrapeUrlMeta(url: string): Promise<UrlMeta> {
  try {
    const apiUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=false`;
    const res = await fetch(apiUrl, {
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return {};

    const data = await res.json();
    if (data.status !== "success") return {};

    const { title, image, price } = data.data;

    return {
      title: title ?? undefined,
      image: image?.url ?? undefined,
      price: price?.amount ? Math.round(price.amount) : undefined,
    };
  } catch {
    return {};
  }
}
