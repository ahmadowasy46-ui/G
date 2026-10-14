/**
 * Image processing utilities for Luna AI
 * Provides client-side optimization, canvas filters, instant previews, and export helpers.
 */

export interface CanvasFilterOptions {
  brightness?: number; // 0 to 200 (100 = normal)
  contrast?: number; // 0 to 200 (100 = normal)
  saturation?: number; // 0 to 200 (100 = normal)
  sharpness?: number; // 0 to 10
  temperature?: number; // -100 to 100
  sepia?: number;
  grayscale?: number;
  tintColor?: string; // hex color for tint overlay
}

export const imageProcessor = {
  /**
   * Reads a File and converts to a base64 Data URL with optional downscaling
   */
  async fileToDataUrl(file: File, maxDimension = 1920, quality = 0.9): Promise<{ dataUrl: string; width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;

          // Downscale if exceeds maxDimension
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ dataUrl: e.target?.result as string, width: img.width, height: img.height });
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(mimeType, quality);
          resolve({ dataUrl, width, height });
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  /**
   * Applies custom image filters and color grading onto a base64 image via HTML5 Canvas
   */
  async applyFilter(
    sourceDataUrl: string,
    filters: CanvasFilterOptions
  ): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(sourceDataUrl);
          return;
        }

        // Apply CSS canvas filter pipeline
        const b = filters.brightness ?? 100;
        const c = filters.contrast ?? 100;
        const s = filters.saturation ?? 100;
        const sepia = filters.sepia ?? 0;
        const gray = filters.grayscale ?? 0;

        ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%) sepia(${sepia}%) grayscale(${gray}%)`;
        ctx.drawImage(img, 0, 0);

        // Optional tint overlay (e.g. "change color to blue/warm/golden")
        if (filters.tintColor) {
          ctx.filter = 'none';
          ctx.fillStyle = filters.tintColor;
          ctx.globalCompositeOperation = 'overlay';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.globalCompositeOperation = 'source-over';
        }

        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(sourceDataUrl);
      img.src = sourceDataUrl;
    });
  },

  /**
   * Client-side background removal helper using smart edge and chroma segmentation
   */
  async extractSubjectBackground(sourceDataUrl: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(sourceDataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Sample corner colors as candidate background
        const samplePoints = [
          [0, 0],
          [canvas.width - 1, 0],
          [0, canvas.height - 1],
          [canvas.width - 1, canvas.height - 1],
        ];

        let avgR = 0, avgG = 0, avgB = 0;
        for (const [x, y] of samplePoints) {
          const idx = (y * canvas.width + x) * 4;
          avgR += data[idx];
          avgG += data[idx + 1];
          avgB += data[idx + 2];
        }
        avgR /= 4;
        avgG /= 4;
        avgB /= 4;

        // Threshold distance
        const threshold = 55;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const dist = Math.sqrt(
            Math.pow(r - avgR, 2) + Math.pow(g - avgG, 2) + Math.pow(b - avgB, 2)
          );

          if (dist < threshold) {
            // Set alpha to 0 (transparent)
            data[i + 3] = 0;
          } else if (dist < threshold + 25) {
            // Soft feather edge
            data[i + 3] = Math.round(((dist - threshold) / 25) * 255);
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(sourceDataUrl);
      img.src = sourceDataUrl;
    });
  },

  /**
   * Triggers browser download of an image
   */
  downloadImage(dataUrl: string, filename = 'luna-ai-creation.png') {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Share image via Web Share API or copy to clipboard
   */
  async shareImage(dataUrl: string, title = 'Luna Nova Creation'): Promise<'shared' | 'copied' | 'unsupported'> {
    if (navigator.share) {
      try {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'luna-creation.png', { type: blob.type });
        await navigator.share({
          title,
          text: 'Created with Luna Nova - Create. Edit. Ask. Imagine.',
          files: [file],
        });
        return 'shared';
      } catch (e) {
        // User canceled or failed share
      }
    }

    // Fallback: Copy link/image to clipboard
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        return 'copied';
      }
    } catch {
      // Ignored
    }

    return 'unsupported';
  },
};
