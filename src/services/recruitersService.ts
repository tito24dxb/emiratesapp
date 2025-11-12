import { supabase } from '../lib/supabase';

export interface Recruiter {
  id?: string;
  name: string;
  country: string;
  airline: string;
  notes: string;
  created_by?: string;
  created_at?: string;
  last_updated?: string;
}

export async function getAllRecruiters(): Promise<Recruiter[]> {
  try {
    const { data, error } = await supabase
      .from('recruiters')
      .select('*')
      .order('last_updated', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching recruiters:', error);
    return [];
  }
}

export async function createRecruiter(recruiter: Recruiter, userId: string): Promise<Recruiter | null> {
  try {
    const { data, error } = await supabase
      .from('recruiters')
      .insert({
        ...recruiter,
        created_by: userId,
        last_updated: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating recruiter:', error);
    return null;
  }
}

export async function updateRecruiter(id: string, updates: Partial<Recruiter>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('recruiters')
      .update({
        ...updates,
        last_updated: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating recruiter:', error);
    return false;
  }
}

export async function deleteRecruiter(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('recruiters')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting recruiter:', error);
    return false;
  }
}
