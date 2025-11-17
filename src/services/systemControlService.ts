import { supabase } from '../lib/supabase';

export interface SystemFeatures {
  chat: boolean;
  quiz: boolean;
  englishTest: boolean;
  profileEdit: boolean;
  openDayModule: boolean;
}

export interface SystemAnnouncement {
  active: boolean;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string | null;
}

export interface SystemControl {
  features: SystemFeatures;
  announcement: SystemAnnouncement;
  updated_by: string | null;
  updated_at: string;
}

const SYSTEM_CONTROL_ID = 'status';

export const getSystemControl = async (): Promise<SystemControl | null> => {
  try {
    const { data, error } = await supabase
      .from('system_control')
      .select('*')
      .eq('id', SYSTEM_CONTROL_ID)
      .maybeSingle();

    if (error) {
      console.error('Error fetching system control:', error);
      return null;
    }

    if (!data) {
      console.log('No system control entry found');
      return null;
    }

    return {
      features: data.features,
      announcement: data.announcement,
      updated_by: data.updated_by,
      updated_at: data.updated_at
    };
  } catch (error) {
    console.error('Error fetching system control:', error);
    return null;
  }
};

export const updateSystemControl = async (
  updates: Partial<{ features?: SystemFeatures; announcement?: SystemAnnouncement }>,
  userId: string
): Promise<SystemControl | null> => {
  try {
    const updateData: any = {
      ...updates,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('system_control')
      .update(updateData)
      .eq('id', SYSTEM_CONTROL_ID)
      .select()
      .single();

    if (error) {
      console.error('Error updating system control:', error);
      throw error;
    }

    return {
      features: data.features,
      announcement: data.announcement,
      updated_by: data.updated_by,
      updated_at: data.updated_at
    };
  } catch (error) {
    console.error('Error updating system control:', error);
    throw error;
  }
};

export const updateAnnouncement = async (
  announcement: Partial<SystemAnnouncement>,
  userId: string
): Promise<void> => {
  try {
    const systemControl = await getSystemControl();
    if (!systemControl) throw new Error('System control not found');

    const updatedAnnouncement = {
      ...systemControl.announcement,
      ...announcement,
    };

    await updateSystemControl({ announcement: updatedAnnouncement }, userId);
  } catch (error) {
    console.error('Error updating announcement:', error);
    throw error;
  }
};

export const subscribeToSystemControl = (
  callback: (control: SystemControl | null) => void
): (() => void) => {
  const channel = supabase
    .channel('system_control_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'system_control',
        filter: `id=eq.${SYSTEM_CONTROL_ID}`
      },
      async (payload) => {
        console.log('System control changed:', payload);
        const control = await getSystemControl();
        callback(control);
      }
    )
    .subscribe();

  getSystemControl().then(callback);

  return () => {
    supabase.removeChannel(channel);
  };
};
