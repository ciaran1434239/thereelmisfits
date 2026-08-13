import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

// POST /api/admin/upload
// FormData: file (File), bucket? (string, default 'list-images')
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const bucket = (formData.get('bucket') as string | null) ?? 'list-images';

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPG, PNG, WEBP accepted' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 8 MB)' }, { status: 400 });
  }

  const ext = (file.type.split('/')[1] ?? 'jpg').replace('jpeg', 'jpg');
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const bytes = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filename, bytes, { contentType: file.type, upsert: false });

  if (error) {
    return NextResponse.json(
      { error: `Storage error: ${error.message}. Ensure bucket "${bucket}" exists and is public.` },
      { status: 500 }
    );
  }

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filename);
  return NextResponse.json({ url: publicUrl });
}
