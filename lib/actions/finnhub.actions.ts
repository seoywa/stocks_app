'use server';

import { getDateRange } from '@/lib/utils';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

interface FinnhubArticle {
  id?: string;
  url?: string;
  headline?: string;
  summary?: string;
  image?: string;
  source?: string;
  category?: string;
  datetime?: number;
}

interface FormattedArticle {
  headline: string;
  summary: string;
  source: string;
  url: string;
  image?: string;
  datetime: number;
}

const fetchJSON = async (
  url: string,
  revalidateSeconds?: number
): Promise<unknown> => {
  const options: RequestInit = revalidateSeconds
    ? {
        cache: 'force-cache',
        next: { revalidate: revalidateSeconds },
      }
    : {
        cache: 'no-store',
      };

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(
      `Finnhub API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
};

const isValidArticle = (article: unknown): article is FinnhubArticle => {
  if (!article || typeof article !== 'object') return false;
  const a = article as Record<string, unknown>;
  return (
    typeof a.headline === 'string' &&
    typeof a.summary === 'string' &&
    typeof a.source === 'string' &&
    typeof a.url === 'string'
  );
};

const formatArticle = (article: FinnhubArticle): FormattedArticle | null => {
  if (
    !article.headline ||
    !article.summary ||
    !article.source ||
    !article.url
  ) {
    return null;
  }

  return {
    headline: article.headline,
    summary: article.summary,
    source: article.source,
    url: article.url,
    image: article.image,
    datetime: article.datetime || Date.now(),
  };
};

export const getNews = async (symbols?: string[]): Promise<FormattedArticle[]> => {
  try {
    if (!FINNHUB_API_KEY) {
      throw new Error('FINNHUB_API_KEY is not configured');
    }

    const { from, to } = getDateRange(5); // Last 5 days

    // If symbols provided, fetch company news
    if (symbols && symbols.length > 0) {
      const cleanedSymbols = symbols
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);

      if (cleanedSymbols.length === 0) {
        return [];
      }

      const maxRounds = Math.ceil(6 / cleanedSymbols.length);
      const collected: FormattedArticle[] = [];
      const used = new Set<string>();

      for (let round = 0; round < maxRounds && collected.length < 6; round++) {
        for (const symbol of cleanedSymbols) {
          if (collected.length >= 6) break;

          try {
            const url = `${FINNHUB_BASE_URL}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = (await fetchJSON(url, 3600)) as any;
            const articles = Array.isArray(data) ? data : [];

            for (const article of articles) {
              if (collected.length >= 6) break;
              if (!isValidArticle(article)) continue;

              const articleKey = `${article.url || article.headline}`;
              if (!used.has(articleKey)) {
                const formatted = formatArticle(article);
                if (formatted) {
                  collected.push(formatted);
                  used.add(articleKey);
                  break; // One per round per symbol
                }
              }
            }
          } catch (error) {
            console.error(`Error fetching news for symbol ${symbol}:`, error);
            continue;
          }
        }
      }

      return collected
        .sort((a, b) => b.datetime - a.datetime)
        .slice(0, 6);
    }

    // Fallback: general market news
    try {
      const url = `${FINNHUB_BASE_URL}/news?category=general&token=${FINNHUB_API_KEY}`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (await fetchJSON(url, 3600)) as any;
      const articles = Array.isArray(data) ? data : [];

      const seen = new Set<string>();
      const formatted: FormattedArticle[] = [];

      for (const article of articles) {
        if (!isValidArticle(article)) continue;

        // Deduplicate by id, url, or headline
        const key = article.id || article.url || article.headline;
        if (!key || seen.has(key)) continue;
        seen.add(key);

        const result = formatArticle(article);
        if (result) {
          formatted.push(result);
          if (formatted.length >= 6) break;
        }
      }

      return formatted;
    } catch (error) {
      console.error('Error fetching general market news:', error);
      throw new Error('Failed to fetch news');
    }
  } catch (error) {
    console.error('Error in getNews:', error);
    throw new Error('Failed to fetch news');
  }
};
