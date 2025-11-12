import { supabase } from '../lib/supabase';

export interface GroupMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'student' | 'mentor' | 'governor';
  text: string;
  created_at: string;
}

export interface PrivateMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: 'student' | 'mentor' | 'governor';
  text: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  participant_names: Record<string, string>;
  participant_roles: Record<string, string>;
  started_at: string;
  last_updated: string;
  last_message?: string;
}

export interface User {
  uid: string;
  name: string;
  email: string;
  role: 'student' | 'mentor' | 'governor';
  country?: string;
  isOnline?: boolean;
}

export const sendGroupMessage = async (
  senderId: string,
  senderName: string,
  senderRole: 'student' | 'mentor' | 'governor',
  text: string
): Promise<void> => {
  const { error } = await supabase
    .from('group_messages')
    .insert({
      sender_id: senderId,
      sender_name: senderName,
      sender_role: senderRole,
      text: text.trim(),
    });

  if (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const subscribeToGroupMessages = (
  callback: (messages: GroupMessage[]) => void
): (() => void) => {
  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('group_messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    callback(data || []);
  };

  fetchMessages();

  const subscription = supabase
    .channel('group_messages_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'group_messages',
      },
      () => {
        fetchMessages();
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

export const getOrCreateConversation = async (
  currentUserId: string,
  currentUserName: string,
  currentUserRole: string,
  targetUserId: string,
  targetUserName: string,
  targetUserRole: string
): Promise<string> => {
  const conversationId = [currentUserId, targetUserId].sort().join('_');

  const { data: existingConv } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .maybeSingle();

  if (existingConv) {
    return existingConv.id;
  }

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      id: conversationId,
      participants: [currentUserId, targetUserId],
      participant_names: {
        [currentUserId]: currentUserName,
        [targetUserId]: targetUserName,
      },
      participant_roles: {
        [currentUserId]: currentUserRole,
        [targetUserId]: targetUserRole,
      },
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }

  return data.id;
};

export const sendPrivateMessage = async (
  conversationId: string,
  senderId: string,
  senderRole: 'student' | 'mentor' | 'governor',
  text: string
): Promise<void> => {
  const { error: messageError } = await supabase
    .from('private_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      sender_role: senderRole,
      text: text.trim(),
    });

  if (messageError) {
    console.error('Error sending message:', messageError);
    throw messageError;
  }

  const { error: updateError } = await supabase
    .from('conversations')
    .update({
      last_updated: new Date().toISOString(),
      last_message: text.trim().substring(0, 50),
    })
    .eq('id', conversationId);

  if (updateError) {
    console.error('Error updating conversation:', updateError);
  }
};

export const subscribeToPrivateMessages = (
  conversationId: string,
  callback: (messages: PrivateMessage[]) => void
): (() => void) => {
  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('private_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    callback(data || []);
  };

  fetchMessages();

  const subscription = supabase
    .channel(`private_messages_${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'private_messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      () => {
        fetchMessages();
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

export const subscribeToUserConversations = (
  userId: string,
  callback: (conversations: Conversation[]) => void
): (() => void) => {
  const fetchConversations = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .contains('participants', [userId])
      .order('last_updated', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return;
    }

    callback(data || []);
  };

  fetchConversations();

  const subscription = supabase
    .channel('conversations_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
      },
      () => {
        fetchConversations();
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

export const getAllUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  return (data || []).map((user) => ({
    uid: user.id,
    name: user.name || user.display_name || 'Unknown User',
    email: user.email,
    role: user.role || 'student',
    country: user.country,
    isOnline: false,
  }));
};
