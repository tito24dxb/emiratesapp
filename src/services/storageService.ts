import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';

export const uploadPDFToStorage = async (file: File, courseId: string): Promise<{ url: string; path: string }> => {
  try {
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `courses/${courseId}/${timestamp}_${sanitizedFileName}`;
    const storageRef = ref(storage, path);

    await uploadBytes(storageRef, file, {
      contentType: 'application/pdf',
    });

    const url = await getDownloadURL(storageRef);

    return { url, path };
  } catch (error) {
    console.error('Error uploading PDF to Firebase Storage:', error);
    throw new Error('Failed to upload PDF. Please try again.');
  }
};

export const deletePDFFromStorage = async (path: string): Promise<void> => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting PDF from Firebase Storage:', error);
  }
};

export const validatePDFFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 50 * 1024 * 1024;

  if (file.type !== 'application/pdf') {
    return { valid: false, error: 'Only PDF files are allowed' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 50MB' };
  }

  return { valid: true };
};
