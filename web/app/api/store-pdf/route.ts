import { put } from '@vercel/blob';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get('pdf') as File;
    const ecId = form.get('ecId') as string;

    if (!file || !ecId) {
      return Response.json({ error: 'Missing pdf or ecId' }, { status: 400 });
    }

    const blob = await put(`pdfs/${ecId}.pdf`, file, {
      access: 'public',
      contentType: 'application/pdf',
    });

    return Response.json({ url: blob.url });
  } catch (err) {
    console.error('[store-pdf] Error:', err);
    return Response.json({ error: 'Failed to store PDF' }, { status: 500 });
  }
}
