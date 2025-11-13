import { supabase } from '../lib/supabase';
import { uploadPDFToStorage, deletePDFFromStorage } from './storageService';

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  thumbnail: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  plan: 'free' | 'pro' | 'vip';
  category: 'grooming' | 'service' | 'safety' | 'interview' | 'language';
  lessons: number;
  coach_id: string;
  pdf_url?: string;
  pdf_path?: string;
  allow_download: boolean;
  content_type: 'pdf' | 'video' | 'text';
  created_at: string;
  updated_at: string;
}

export interface CreateCourseData {
  title: string;
  description: string;
  instructor: string;
  thumbnail: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  plan: 'free' | 'pro' | 'vip';
  category: 'grooming' | 'service' | 'safety' | 'interview' | 'language';
  lessons?: number;
  pdfFile?: File;
  allow_download: boolean;
  content_type: 'pdf' | 'video' | 'text';
}

export const createCourse = async (data: CreateCourseData, coachId: string): Promise<Course> => {
  try {
    const courseId = crypto.randomUUID();
    let pdfUrl: string | undefined;
    let pdfPath: string | undefined;

    if (data.pdfFile) {
      const uploadResult = await uploadPDFToStorage(data.pdfFile, courseId);
      pdfUrl = uploadResult.url;
      pdfPath = uploadResult.path;
    }

    const { data: course, error } = await supabase
      .from('courses')
      .insert({
        id: courseId,
        title: data.title,
        description: data.description,
        instructor: data.instructor,
        thumbnail: data.thumbnail,
        duration: data.duration,
        level: data.level,
        plan: data.plan,
        category: data.category,
        lessons: data.lessons || 1,
        coach_id: coachId,
        pdf_url: pdfUrl,
        pdf_path: pdfPath,
        allow_download: data.allow_download,
        content_type: data.content_type,
      })
      .select()
      .single();

    if (error) throw error;
    return course;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

export const updateCourse = async (
  courseId: string,
  data: Partial<CreateCourseData>,
  existingPdfPath?: string
): Promise<Course> => {
  try {
    let pdfUrl: string | undefined;
    let pdfPath: string | undefined;

    if (data.pdfFile) {
      if (existingPdfPath) {
        await deletePDFFromStorage(existingPdfPath);
      }

      const uploadResult = await uploadPDFToStorage(data.pdfFile, courseId);
      pdfUrl = uploadResult.url;
      pdfPath = uploadResult.path;
    }

    const updateData: any = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    if (pdfUrl) updateData.pdf_url = pdfUrl;
    if (pdfPath) updateData.pdf_path = pdfPath;

    delete updateData.pdfFile;

    const { data: course, error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', courseId)
      .select()
      .single();

    if (error) throw error;
    return course;
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
};

export const deleteCourse = async (courseId: string, pdfPath?: string): Promise<void> => {
  try {
    if (pdfPath) {
      await deletePDFFromStorage(pdfPath);
    }

    const { error } = await supabase.from('courses').delete().eq('id', courseId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
};

export const getCoursesByCoach = async (coachId: string): Promise<Course[]> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
};

export const getAllCourses = async (): Promise<Course[]> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all courses:', error);
    return [];
  }
};

export const getCourseById = async (courseId: string): Promise<Course | null> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching course:', error);
    return null;
  }
};
