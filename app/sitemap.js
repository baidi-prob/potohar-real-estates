import { getAllListingIds } from '../lib/listings.server';
import { getSiteUrl } from '../lib/site';

export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const baseUrl = getSiteUrl();

  const urls = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  try {
    const ids = await getAllListingIds();
    for (const id of ids) {
      urls.push({
        url: `${baseUrl}/listings/${id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  } catch (err) {
    console.error('Sitemap generation failed:', err);
  }

  return urls;
}
