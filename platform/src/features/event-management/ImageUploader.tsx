import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';
import imageCompression from 'browser-image-compression';

export default function ImageUploader({ eventId, event, updateEvent, theme, setTheme, subscriptionTier }: { eventId: string, event: any, updateEvent: any, theme: any, setTheme: any, subscriptionTier: string }) {
  const { showToast } = useToast();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [initialImages, setInitialImages] = useState<string[]>(event.images || []);
  const [initialThumbnailPosition, setInitialThumbnailPosition] = useState(theme.thumbnailPosition || '50% 50%');
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);

  const currentImages = event?.images || [];
  const maxImages = subscriptionTier === 'pro' ? 10 : 3;

  const isPicturesDirty = 
    JSON.stringify(currentImages) !== JSON.stringify(initialImages) ||
    theme.thumbnailPosition !== initialThumbnailPosition;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (currentImages.length >= maxImages) {
      showToast(`Your ${subscriptionTier} tier allows a maximum of ${maxImages} images.`, 'error');
      return;
    }

    setUploadingImage(true);
    
    try {
      // Compress the image to minimize hosting costs while retaining reasonable quality
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/webp' as any // Convert to webp to save massive bandwidth
      };
      
      const compressedFile = await imageCompression(file, options);
      
      const fileName = `${eventId}_${crypto.randomUUID()}.webp`;

      const { error: uploadError } = await supabase.storage.from('event_images').upload(fileName, compressedFile, {
        contentType: 'image/webp'
      });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('event_images').getPublicUrl(fileName);
      const updatedImages = [...currentImages, publicUrlData.publicUrl];
      updateEvent({ images: updatedImages });
    } catch (error: any) {
      showToast('Error uploading image: ' + error.message, 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const moveImage = (index: number, direction: number) => {
    const newImages = [...currentImages];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    
    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;
    
    updateEvent({ images: newImages });
  };

  const savePicturesAndPreview = async () => {
    const { error } = await updateEvent({ images: currentImages, theme_customization: theme });
    if (!error) {
      showToast("Pictures and Thumbnail Preview saved successfully!", "success");
      setInitialImages(currentImages);
      setInitialThumbnailPosition(theme.thumbnailPosition);
    } else {
      showToast("Failed to save pictures.", "error");
    }
  };

  const handleThumbnailDrag = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaY = e.clientY - dragStartY;
    setDragStartY(e.clientY);
    
    let currentY = 50;
    if (theme.thumbnailPosition) {
       const match = theme.thumbnailPosition.match(/50% (\d+(?:\.\d+)?)%/);
       if (match) currentY = parseFloat(match[1]);
    }
    
    const newY = Math.max(0, Math.min(100, currentY - (deltaY * 0.5)));
    setTheme({...theme, thumbnailPosition: `50% ${newY}%`});
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Event Images</h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{currentImages.length} / {maxImages} uploaded</span>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '16px', marginBottom: '16px' }}>
        {currentImages.map((img: string, idx: number) => (
          <div key={idx} style={{ position: 'relative', width: '100%', aspectRatio: '1' }}>
            <img src={img} alt={`Event ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
            <div style={{ position: 'absolute', bottom: '8px', left: '8px', right: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <button 
                onClick={() => moveImage(idx, -1)} 
                disabled={idx === 0}
                style={{ background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', borderRadius: '4px', padding: '4px 8px', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.3 : 1 }}
              >←</button>
              <button 
                onClick={() => moveImage(idx, 1)} 
                disabled={idx === currentImages.length - 1}
                style={{ background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', borderRadius: '4px', padding: '4px 8px', cursor: idx === currentImages.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === currentImages.length - 1 ? 0.3 : 1 }}
              >→</button>
            </div>
            {idx === 0 && <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'var(--accent)', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', pointerEvents: 'none' }}>Thumbnail</div>}
          </div>
        ))}
        {currentImages.length < maxImages && (
          <label style={{ width: '100%', aspectRatio: '1', border: '2px dashed var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: 'rgba(0,0,0,0.1)' }}>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} disabled={uploadingImage} />
            <span style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>{uploadingImage ? '...' : '+'}</span>
          </label>
        )}
      </div>
      {subscriptionTier === 'free' && (
        <p style={{ fontSize: '0.85rem', color: 'var(--accent)', margin: 0 }}>Upgrade to Pro to upload up to 10 images!</p>
      )}

      {currentImages.length > 0 && (
        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
          <h4 style={{ marginBottom: '8px' }}>Card Thumbnail Preview</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Click and drag the image vertically to adjust its position on the public discovery cards. Remember to click "Save Theme" below!
          </p>
          <div 
            style={{ width: '100%', height: '180px', overflow: 'hidden', borderRadius: '8px', cursor: isDragging ? 'grabbing' : 'grab', position: 'relative' }}
            onMouseDown={(e) => { setIsDragging(true); setDragStartY(e.clientY); }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onMouseMove={handleThumbnailDrag}
          >
            <img 
              src={currentImages[0]} 
              alt="Thumbnail preview" 
              draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: theme.thumbnailPosition, pointerEvents: 'none' }} 
            />
            <div style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', color: 'white', pointerEvents: 'none' }}>
              {theme.thumbnailPosition}
            </div>
          </div>
        </div>
      )}
      
      {currentImages.length > 0 && (
        <button 
          onClick={savePicturesAndPreview}
          disabled={!isPicturesDirty}
          className="btn-primary"
          style={{ width: '100%', marginTop: '24px', opacity: isPicturesDirty ? 1 : 0.5, cursor: isPicturesDirty ? 'pointer' : 'not-allowed' }}
        >
          Save Pictures & Preview
        </button>
      )}
    </div>
  );
}
