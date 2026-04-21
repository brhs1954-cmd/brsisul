
/**
 * 이미지 압축 및 리사이징 유틸리티
 */
export const compressImage = (dataUrl: string, maxWidth = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context is null'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = (err) => reject(err);
  });
};

/**
 * 구글 드라이브 링크를 직접 표시 가능한 URL로 변환
 */
export const getDisplayImageUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  if (url.startsWith('data:')) return url; // Base64 데이터는 그대로 유지
  if (url.includes('drive.google.com')) {
    const match = url.match(/[-\w]{25,}/);
    if (match) return `https://lh3.googleusercontent.com/d/${match[0]}`;
  }
  return url;
};
