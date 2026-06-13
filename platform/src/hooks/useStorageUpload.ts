import { useState } from 'react';
import { supabase } from '../lib/supabase';
import imageCompression from 'browser-image-compression';
import { useToast } from '../components/Toast';

export function useStorageUpload(bucket: string) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File, prefix: string = 'img'): Promise<string | null> => {
    setUploading(true);
    
    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/webp' as any // Convert to webp
      };
      
      const compressedFile = await imageCompression(file, options);
      const fileName = `${prefix}_${crypto.randomUUID()}.webp`;

      const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, compressedFile, {
        contentType: 'image/webp'
      });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
      return publicUrlData.publicUrl;
      
    } catch (error: any) {
      showToast('Error uploading image: ' + error.message, 'error');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadImage, uploading };
}
