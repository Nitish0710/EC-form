/**
 * Blob Storage Utilities
 * 
 * Handles file uploads to Vercel Blob storage
 */

interface UploadResult {
  url: string;
  pathname: string;
  contentType: string;
  contentDisposition: string;
}

/**
 * Upload a file to Vercel Blob storage
 * 
 * @param file - The file to upload
 * @param filename - Optional custom filename
 * @returns Promise with the Blob URL
 */
export async function uploadToBlob(
  file: File,
  filename?: string
): Promise<UploadResult> {
  try {
    // Use Vercel Blob's client-side upload
    // This requires @vercel/blob package
    
    const actualFilename = filename || file.name;
    
    // Create FormData for upload
    const formData = new FormData();
    formData.append('file', file);
    
    // Call Vercel Blob upload endpoint
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Upload failed: ${error}`);
    }
    
    const result: UploadResult = await response.json();
    
    return result;
  } catch (error) {
    console.error('Blob upload error:', error);
    throw error;
  }
}

/**
 * Generate a unique EC ID from filename and timestamp
 * 
 * @param filename - Original filename
 * @returns Unique EC ID
 */
export function generateEcId(filename: string): string {
  const timestamp = Date.now();
  const sanitized = filename.replace(/[^a-zA-Z0-9]/g, '_').replace(/\.pdf$/i, '');
  return `${sanitized}_${timestamp}`;
}

/**
 * Validate EC PDF file
 * 
 * @param file - File to validate
 * @returns True if valid, throws error if invalid
 */
export function validateEcFile(file: File): boolean {
  // Check file type
  if (file.type !== 'application/pdf') {
    throw new Error('Only PDF files are supported');
  }
  
  // Check file size (max 25MB for Vercel Blob)
  const maxSize = 25 * 1024 * 1024; // 25MB
  if (file.size > maxSize) {
    throw new Error('File size exceeds 25MB limit');
  }
  
  // Check file name
  if (!file.name || file.name.length === 0) {
    throw new Error('Invalid file name');
  }
  
  return true;
}
