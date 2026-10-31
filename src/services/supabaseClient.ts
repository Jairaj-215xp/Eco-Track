import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
// Sanitize URL by removing trailing slash and /rest/v1 if accidentally included
export const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
export const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

// Fallback dummy client if credentials aren't provided yet
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  }
);

/**
 * Uploads an image file to Supabase Storage bucket
 */
export async function uploadImageToStorage(
  file: File | Blob, 
  bucket: 'reports' | 'proofs',
  fileNamePrefix: string = 'img'
): Promise<string> {
  if (!isSupabaseConfigured) {
    // Return a base64 or object URL fallback when Supabase storage isn't configured yet
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  const fileExt = file instanceof File ? file.name.split('.').pop() || 'jpg' : 'jpg';
  const filePath = `${fileNamePrefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.warn(`Error uploading to ${bucket} storage:`, uploadError.message);
    // Graceful fallback to data URL if bucket permissions restrict or bucket isn't created yet
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}
