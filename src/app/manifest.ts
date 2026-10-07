import { MetadataRoute } from 'next';
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ApparelFlow ERP - Cutting Operations & Gatekeeper Terminal',
    short_name: 'ApparelFlow ERP',
    description: 'Enterprise cutting floor operations, BOM calculation, and gatekeeper verification terminal.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#ea580c',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
