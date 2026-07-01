import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return new Response('Missing url param', { status: 400 });
  }

  // Only allow Vercel Blob URLs
  if (!url.startsWith('https://') || !url.includes('blob.vercel-storage.com')) {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const upstream = await fetch(url);
    if (!upstream.ok) {
      return new Response('PDF not found', { status: 404 });
    }

    return new Response(upstream.body, {
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    console.error('[pdf-proxy] Fetch error:', err);
    return new Response('Failed to fetch PDF', { status: 502 });
  }
}
