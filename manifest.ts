import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    theme_color: '#8936FF',
    background_color: '#2EC6FE',
    icons: [
      {
        purpose: 'maskable',
        sizes: '512x512',
        src: '/icon512_maskable.png',
        type: 'image/png',
      },
      {
        purpose: 'any',
        sizes: '512x512',
        src: 'icon512_rounded.png',
        type: 'image/png',
      },
       // ✅ Add these:
      {
        purpose: 'any',
        sizes: '192x192',
        src: '/icon192_rounded.png',
        type: 'image/png',
      },
      {
        purpose: 'maskable',
        sizes: '192x192',
        src: '/icon192_maskable.png',
        type: 'image/png',
      },
    ],
    orientation: 'any',
    display: 'standalone',
    dir: 'auto',
    lang: 'en-US',
    name: 'HiManga',
    short_name: 'HiManga',
    start_url: '/',  // Relative to scope (use '/' not full URL)
    scope: '/',      // Full app scope
    description: 'Discover and read your favorite manga with a beautiful, anime-inspired interface. Thousands of manga titles, infinite scroll, and community discussions.',
    id: 'hi-manga',
  }
}