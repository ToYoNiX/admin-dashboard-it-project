import {
  supabase,
  supabaseAdvisorStudentConversationsTable,
  supabaseConversationMessagesTable,
  supabaseStudentsTable
} from '../lib/supabase';

export type ConversationStatus = 'open' | 'closed';

export interface ConversationRecord {
  id: string;
  advisor_id: string;
  student_id: string | null;
  student_email: string;
  student_full_name: string | null;
  status: ConversationStatus;
  last_message_text: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageRecord {
  id: string;
  conversation_id: string;
  sender_role: 'advisor' | 'student' | 'system';
  sender_id: string | null;
  message_text: string;
  created_at: string;
}

interface StudentLookup {
  student_id: string;
  full_name: string;
}

function normalizeIdentifier(raw: string): string {
  return raw.trim().toLowerCase();
}

function isMissingMessagingTables(error: { code?: string; message?: string }): boolean {
  if (error.code === 'PGRST205' || error.code === '42P01') {
    return true;
  }

  const message = error.message ?? '';
  return /conversation|advisor_student_conversations|conversation_messages/i.test(message);
}

function assertSupabase(): asserts supabase is NonNullable<typeof supabase> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }
}

export async function listAdvisorConversations(advisorId: string): Promise<ConversationRecord[]> {
  assertSupabase();

  const { data, error } = await supabase
    .from(supabaseAdvisorStudentConversationsTable)
    .select('*')
    .eq('advisor_id', advisorId)
    .eq('status', 'open')
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false });

  if (error) {
    if (isMissingMessagingTables(error)) {
      return [];
    }

    throw new Error(`Failed to load conversations: ${error.message}`);
  }

  return (data ?? []) as ConversationRecord[];
}

export async function listConversationMessages(
  advisorId: string,
  conversationId: string
): Promise<MessageRecord[]> {
  assertSupabase();

  const { data: conversation, error: conversationError } = await supabase
    .from(supabaseAdvisorStudentConversationsTable)
    .select('id')
    .eq('id', conversationId)
    .eq('advisor_id', advisorId)
    .maybeSingle();

  if (conversationError) {
    throw new Error(`Failed to validate conversation: ${conversationError.message}`);
  }

  if (!conversation) {
    return [];
  }

  const { data, error } = await supabase
    .from(supabaseConversationMessagesTable)
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    if (isMissingMessagingTables(error)) {
      return [];
    }

    throw new Error(`Failed to load messages: ${error.message}`);
  }

  return (data ?? []) as MessageRecord[];
}

async function lookupStudentById(studentId: string): Promise<StudentLookup | null> {
  const { data, error } = await supabase
    .from(supabaseStudentsTable)
    .select('student_id, full_name')
    .eq('student_id', studentId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return (data as StudentLookup | null) ?? null;
}

export async function startOrGetConversationByStudentIdentifier(
  advisorId: string,
  identifier: string
): Promise<ConversationRecord> {
  assertSupabase();

  const normalized = normalizeIdentifier(identifier);
  if (!normalized) {
    throw new Error('Student email or ID is required.');
  }

  const isEmail = normalized.includes('@');
  const inferredStudentId = isEmail ? normalized.split('@')[0] : normalized;
  const studentEmail = isEmail ? normalized : `${normalized}@must.edu.eg`;

  const student = await lookupStudentById(inferredStudentId);
  if (!student) {
    throw new Error('Student not found.');
  }

  const { data: existing, error: existingError } = await supabase
    .from(supabaseAdvisorStudentConversationsTable)
    .select('*')
    .eq('advisor_id', advisorId)
    .eq('student_email', studentEmail)
    .maybeSingle();

  if (existingError) {
    if (isMissingMessagingTables(existingError)) {
      throw new Error('Messaging backend is not initialized yet. Run the SQL setup script first.');
    }

    throw new Error(`Failed to start conversation: ${existingError.message}`);
  }

  if (existing) {
    if (existing.status === 'closed') {
      const { data: reopened, error: reopenError } = await supabase
        .from(supabaseAdvisorStudentConversationsTable)
        .update({
          status: 'open',
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .eq('advisor_id', advisorId)
        .select('*')
        .single();

      if (reopenError) {
        throw new Error(`Failed to reopen conversation: ${reopenError.message}`);
      }

      return reopened as ConversationRecord;
    }

    return existing as ConversationRecord;
  }

  const now = new Date().toISOString();
  const { data: inserted, error: insertError } = await supabase
    .from(supabaseAdvisorStudentConversationsTable)
    .insert({
      advisor_id: advisorId,
      student_id: student.student_id,
      student_email: studentEmail,
      student_full_name: student.full_name,
      status: 'open',
      created_at: now,
      updated_at: now
    })
    .select('*')
    .single();

  if (insertError) {
    if (isMissingMessagingTables(insertError)) {
      throw new Error('Messaging backend is not initialized yet. Run the SQL setup script first.');
    }

    throw new Error(`Failed to start conversation: ${insertError.message}`);
  }

  return inserted as ConversationRecord;
}

export async function sendConversationMessage(
  advisorId: string,
  conversationId: string,
  messageText: string
): Promise<void> {
  assertSupabase();

  const content = messageText.trim();
  if (!content) {
    throw new Error('Message cannot be empty.');
  }

  const { data: conversation, error: conversationError } = await supabase
    .from(supabaseAdvisorStudentConversationsTable)
    .select('id, status')
    .eq('id', conversationId)
    .eq('advisor_id', advisorId)
    .maybeSingle();

  if (conversationError) {
    throw new Error(`Failed to validate conversation: ${conversationError.message}`);
  }

  if (!conversation) {
    throw new Error('Conversation not found.');
  }

  if (conversation.status === 'closed') {
    throw new Error('This conversation is closed.');
  }

  const now = new Date().toISOString();
  const { error: insertError } = await supabase
    .from(supabaseConversationMessagesTable)
    .insert({
      conversation_id: conversationId,
      sender_role: 'advisor',
      sender_id: advisorId,
      message_text: content,
      created_at: now
    });

  if (insertError) {
    throw new Error(`Failed to send message: ${insertError.message}`);
  }

  const { error: conversationUpdateError } = await supabase
    .from(supabaseAdvisorStudentConversationsTable)
    .update({
      last_message_text: content,
      last_message_at: now,
      updated_at: now
    })
    .eq('id', conversationId)
    .eq('advisor_id', advisorId);

  if (conversationUpdateError) {
    throw new Error(`Message sent, but conversation update failed: ${conversationUpdateError.message}`);
  }
}

export async function closeConversation(advisorId: string, conversationId: string): Promise<void> {
  assertSupabase();

  const { error } = await supabase
    .from(supabaseAdvisorStudentConversationsTable)
    .update({
      status: 'closed',
      updated_at: new Date().toISOString()
    })
    .eq('id', conversationId)
    .eq('advisor_id', advisorId);

  if (error) {
    throw new Error(`Failed to close conversation: ${error.message}`);
  }
}

export async function getUnreadStudentMessageCount(
  advisorId: string,
  clearedAfterIso: string | null
): Promise<number> {
  assertSupabase();

  const { data: conversations, error: conversationsError } = await supabase
    .from(supabaseAdvisorStudentConversationsTable)
    .select('id')
    .eq('advisor_id', advisorId);

  if (conversationsError) {
    if (isMissingMessagingTables(conversationsError)) {
      return 0;
    }

    throw new Error(`Failed to load conversations for notifications: ${conversationsError.message}`);
  }

  const conversationIds = (conversations ?? []).map((item) => item.id as string);
  if (conversationIds.length === 0) {
    return 0;
  }

  let query = supabase
    .from(supabaseConversationMessagesTable)
    .select('id', { count: 'exact', head: true })
    .in('conversation_id', conversationIds)
    .eq('sender_role', 'student');

  if (clearedAfterIso) {
    query = query.gt('created_at', clearedAfterIso);
  }

  const { count, error } = await query;

  if (error) {
    if (isMissingMessagingTables(error)) {
      return 0;
    }

    throw new Error(`Failed to load unread notifications: ${error.message}`);
  }

  return count ?? 0;
}
