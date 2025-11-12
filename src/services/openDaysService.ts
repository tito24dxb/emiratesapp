import { supabase } from '../lib/supabase';

export interface OpenDay {
  id?: string;
  city: string;
  country: string;
  date: string;
  recruiter: string;
  description: string;
  created_by?: string;
  created_at?: string;
  last_updated?: string;
}

export async function getAllOpenDays(): Promise<OpenDay[]> {
  try {
    const { data, error } = await supabase
      .from('open_days')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching open days:', error);
    return [];
  }
}

export async function createOpenDay(openDay: OpenDay, userId: string): Promise<OpenDay | null> {
  try {
    const { data, error } = await supabase
      .from('open_days')
      .insert({
        ...openDay,
        created_by: userId,
        last_updated: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating open day:', error);
    return null;
  }
}

export async function updateOpenDay(id: string, updates: Partial<OpenDay>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('open_days')
      .update({
        ...updates,
        last_updated: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating open day:', error);
    return false;
  }
}

export async function deleteOpenDay(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('open_days')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting open day:', error);
    return false;
  }
}
