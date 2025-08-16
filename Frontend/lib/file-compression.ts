/**
 * Utilidades para compresión de archivos
 * Maneja compresión de imágenes y PDFs para reducir tamaño de almacenamiento
 */

interface CompressionOptions {
  maxSizeKB: number;
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
}

interface CompressedFile {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Comprime una imagen manteniendo buena calidad visual
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {
    maxSizeKB: 800, // 800KB máximo
    quality: 0.85,  // 85% calidad
    maxWidth: 1920,
    maxHeight: 1080
  }
): Promise<CompressedFile> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calcular dimensiones manteniendo aspect ratio
      let { width, height } = img;
      
      if (options.maxWidth && width > options.maxWidth) {
        height = (height * options.maxWidth) / width;
        width = options.maxWidth;
      }
      
      if (options.maxHeight && height > options.maxHeight) {
        width = (width * options.maxHeight) / height;
        height = options.maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // Dibujar imagen en canvas
      ctx?.drawImage(img, 0, 0, width, height);

      // Comprimir iterativamente hasta alcanzar el tamaño deseado
      let quality = options.quality;
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Error al comprimir imagen'));
              return;
            }

            const sizeKB = blob.size / 1024;
            
            // Si el tamaño es aceptable o la calidad ya es muy baja, usar este resultado
            if (sizeKB <= options.maxSizeKB || quality <= 0.1) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });

              resolve({
                compressedFile,
                originalSize: file.size,
                compressedSize: blob.size,
                compressionRatio: Math.round(((file.size - blob.size) / file.size) * 100)
              });
            } else {
              // Reducir calidad y reintentar
              quality -= 0.1;
              tryCompress();
            }
          },
          file.type,
          quality
        );
      };

      tryCompress();
    };

    img.onerror = () => reject(new Error('Error al cargar imagen'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Comprime un PDF utilizando técnicas de optimización
 * Nota: Para PDFs grandes, se puede implementar splitting y compresión más avanzada
 */
export async function compressPDF(file: File): Promise<CompressedFile> {
  // Para PDFs, por ahora implementamos una compresión básica
  // En el futuro se puede integrar PDF-lib para compresión más avanzada
  
  // Si el PDF ya es pequeño, no lo procesamos
  const sizeKB = file.size / 1024;
  if (sizeKB <= 1000) { // 1MB o menos
    return {
      compressedFile: file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 0
    };
  }

  // Para PDFs grandes, por ahora retornamos el archivo original
  // TODO: Implementar compresión avanzada de PDFs usando PDF-lib
  console.warn('PDF compression not fully implemented yet. File will be uploaded as-is.');
  
  return {
    compressedFile: file,
    originalSize: file.size,
    compressedSize: file.size,
    compressionRatio: 0
  };
}

/**
 * Función principal para comprimir archivos según su tipo
 */
export async function compressFile(file: File): Promise<CompressedFile> {
  const fileType = file.type.toLowerCase();
  
  if (fileType.startsWith('image/')) {
    return await compressImage(file);
  } else if (fileType === 'application/pdf') {
    return await compressPDF(file);
  } else {
    // Para otros tipos de archivo, retornar sin comprimir
    return {
      compressedFile: file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 0
    };
  }
}

/**
 * Valida que un archivo sea compatible con el sistema de pagos
 */
export function validatePaymentFile(file: File): { isValid: boolean; error?: string } {
  const maxSizeMB = 10; // Aumentamos a 10MB ya que vamos a comprimir
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'application/pdf'
  ];

  // Validar tipo
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return {
      isValid: false,
      error: 'Formato no soportado. Use: JPG, PNG, WebP o PDF'
    };
  }

  // Validar tamaño (antes de compresión)
  if (file.size > maxSizeMB * 1024 * 1024) {
    return {
      isValid: false,
      error: `El archivo es demasiado grande. Máximo ${maxSizeMB}MB`
    };
  }

  return { isValid: true };
}

/**
 * Formatea el tamaño de archivo para mostrar al usuario
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Genera un preview URL optimizado para mostrar archivos
 */
export function createOptimizedPreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.type.startsWith('image/')) {
      // Para imágenes, crear un preview comprimido
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Crear thumbnail pequeño para preview
        const maxSize = 300;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };

      img.onerror = () => reject(new Error('Error al crear preview'));
      img.src = URL.createObjectURL(file);
    } else {
      // Para PDFs y otros, usar URL del archivo original
      resolve(URL.createObjectURL(file));
    }
  });
}
