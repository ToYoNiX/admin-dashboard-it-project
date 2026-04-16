import { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import {
  SendIcon,
  MoreVerticalIcon,
  XIcon } from
'lucide-react';
import {
  closeConversation,
  listAdvisorConversations,
  listConversationMessages,
  sendConversationMessage,
  startOrGetConversationByStudentIdentifier,
  type ConversationRecord,
  type MessageRecord } from
'../services/messagesService';

interface MessagesProps {
  advisorId: string;
}

function formatTimeLabel(timestamp: string | null): string {
  if (!timestamp) {
    return '';
  }

  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getConversationName(conversation: ConversationRecord): string {
  return conversation.student_full_name || conversation.student_email;
}

function getConversationIdLabel(conversation: ConversationRecord): string {
  if (conversation.student_id) {
    return conversation.student_id;
  }

  return conversation.student_email.split('@')[0];
}

export function Messages({ advisorId }: MessagesProps) {
  const [newConversationTarget, setNewConversationTarget] = useState('');
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [draftMessage, setDraftMessage] = useState('');
  const [menuConversationId, setMenuConversationId] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  );

  const loadConversations = async (preferredConversationId?: string) => {
    setIsLoadingConversations(true);

    try {
      const data = await listAdvisorConversations(advisorId);
      setConversations(data);

      const fallbackId = data[0]?.id ?? null;
      const nextSelectedId = preferredConversationId ?? selectedConversationId ?? fallbackId;
      const selectedStillExists = nextSelectedId && data.some((conversation) => conversation.id === nextSelectedId);
      setSelectedConversationId(selectedStillExists ? nextSelectedId : fallbackId);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load conversations.';
      setErrorMessage(message);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    setIsLoadingMessages(true);

    try {
      const data = await listConversationMessages(advisorId, conversationId);
      setMessages(data);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load messages.';
      setErrorMessage(message);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    setErrorMessage(null);
    void loadConversations();
  }, [advisorId]);

  useEffect(() => {
    setErrorMessage(null);
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    void loadMessages(selectedConversationId);
  }, [advisorId, selectedConversationId]);

  const handleStartConversation = async () => {
    setErrorMessage(null);

    if (!newConversationTarget.trim()) {
      setErrorMessage('Enter a student email or ID to start a conversation.');
      return;
    }

    try {
      setIsStartingConversation(true);
      const conversation = await startOrGetConversationByStudentIdentifier(advisorId, newConversationTarget);
      setNewConversationTarget('');
      await loadConversations(conversation.id);
      await loadMessages(conversation.id);
    } catch (startError) {
      const message = startError instanceof Error ? startError.message : 'Failed to start conversation.';
      if (message.toLowerCase().includes('student not found')) {
        setToastMessage('Student not found. Please enter a valid student ID or email.');
      } else {
        setErrorMessage(message);
      }
    } finally {
      setIsStartingConversation(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation) {
      return;
    }

    setErrorMessage(null);

    try {
      setIsSendingMessage(true);
      await sendConversationMessage(advisorId, selectedConversation.id, draftMessage);
      setDraftMessage('');
      await loadConversations(selectedConversation.id);
      await loadMessages(selectedConversation.id);
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : 'Failed to send message.';
      setErrorMessage(message);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleCloseConversation = async () => {
    if (!selectedConversation) {
      return;
    }

    setErrorMessage(null);
    setMenuConversationId(null);

    try {
      await closeConversation(advisorId, selectedConversation.id);
      await loadConversations(selectedConversation.id);
    } catch (closeError) {
      const message = closeError instanceof Error ? closeError.message : 'Failed to close conversation.';
      setErrorMessage(message);
    }
  };

  const isCurrentConversationClosed = selectedConversation?.status === 'closed';

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToastMessage(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  return (
    <div className="h-[calc(100vh-140px)] animate-in fade-in duration-500 flex flex-col">
      <h1 className="text-2xl font-bold text-must-text-primary mb-4 shrink-0">
        Messages
      </h1>

      {errorMessage ?
      <div className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </div> :
      null}

      {toastMessage ?
      <div className="fixed right-6 top-20 z-[60] rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg">
          {toastMessage}
        </div> :
      null}

      <Card className="flex-1 flex overflow-hidden">
        <div className="w-full md:w-1/3 border-r border-must-border flex flex-col bg-must-surface">
          <div className="p-4 border-b border-must-border space-y-3">
            <Input
              value={newConversationTarget}
              onChange={(event) => setNewConversationTarget(event.target.value)}
              placeholder="Student email or ID"
              disabled={isStartingConversation} />

            <Button
              onClick={() => {
                void handleStartConversation();
              }}
              disabled={isStartingConversation || !newConversationTarget.trim()}
              className="w-full inline-flex items-center justify-center gap-2">

              {isStartingConversation ?
              <XIcon className="w-4 h-4" /> :
              null}
              {isStartingConversation ? 'Starting...' : 'Start Conversation'}
            </Button>

          </div>
          <div className="flex-1 overflow-y-auto scrollbar-custom">
            {isLoadingConversations ?
            <p className="p-4 text-sm text-must-text-secondary">Loading conversations...</p> :
            null}

            {!isLoadingConversations && conversations.length === 0 ?
            <p className="p-4 text-sm text-must-text-secondary">
                No conversations yet. Start one using a student email or ID.
              </p> :
            null}

            {conversations.map((conversation) =>
            <div
              key={conversation.id}
              onClick={() => setSelectedConversationId(conversation.id)}
              className={`p-4 border-b border-must-border cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${selectedConversationId === conversation.id ? 'bg-slate-50 dark:bg-slate-800/80' : ''}`}>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-must-navy text-white flex items-center justify-center font-bold">
                    {getConversationName(conversation).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-semibold text-sm text-must-text-primary truncate">
                        {getConversationName(conversation)} ({getConversationIdLabel(conversation)})
                      </h3>
                      <span className="text-xs text-must-text-secondary shrink-0">
                        {formatTimeLabel(conversation.last_message_at)}
                      </span>
                    </div>
                    <p className="text-sm truncate text-must-text-secondary">
                      {conversation.last_message_text || 'No messages yet.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="hidden md:flex flex-1 flex-col bg-slate-50 dark:bg-[#0f172a]">
          {!selectedConversation ?
          <div className="h-full flex items-center justify-center text-must-text-secondary text-sm px-6 text-center">
              Select or start a conversation to view messages.
            </div> :
          <>
          <div className="h-16 border-b border-must-border bg-must-surface flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-must-navy text-white flex items-center justify-center font-bold">
                {getConversationName(selectedConversation).charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-semibold text-must-text-primary">
                  {getConversationName(selectedConversation)}
                </h2>
                <p className="text-xs text-must-text-secondary">{selectedConversation.student_email}</p>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setMenuConversationId((current) =>
                current === selectedConversation.id ? null : selectedConversation.id
                )}
                className="p-2 text-must-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">

                <MoreVerticalIcon className="w-5 h-5" />
              </button>

              {menuConversationId === selectedConversation.id ?
              <div className="absolute right-0 mt-2 w-48 rounded-md border border-must-border bg-must-surface shadow-lg z-20">
                  <button
                    onClick={() => {
                      void handleCloseConversation();
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-must-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60"
                    disabled={isCurrentConversationClosed}>

                    {isCurrentConversationClosed ? 'Conversation Closed' : 'Close Conversation'}
                  </button>
                </div> :
              null}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-custom">
            {isLoadingMessages ?
            <p className="text-sm text-must-text-secondary">Loading messages...</p> :
            null}

            {!isLoadingMessages && messages.length === 0 ?
            <p className="text-sm text-must-text-secondary">No messages yet. Send the first message below.</p> :
            null}

            {messages.map((message) => {
              const sentByAdvisor = message.sender_role === 'advisor';

              return (
                <div key={message.id} className={`flex ${sentByAdvisor ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`rounded-2xl px-4 py-2 max-w-[70%] shadow-sm ${sentByAdvisor ? 'bg-must-navy text-white rounded-tr-sm' : 'bg-must-surface border border-must-border text-must-text-primary rounded-tl-sm'}`}>

                    <p className="text-sm whitespace-pre-wrap">{message.message_text}</p>
                    <span
                      className={`text-[10px] mt-1 block text-right ${sentByAdvisor ? 'text-blue-200' : 'text-must-text-secondary'}`}>

                      {formatTimeLabel(message.created_at)}
                    </span>
                  </div>
                </div>);
            })}
          </div>

          <div className="p-4 bg-must-surface border-t border-must-border shrink-0">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-must-border rounded-full px-4 py-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={draftMessage}
                onChange={(event) => setDraftMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void handleSendMessage();
                  }
                }}
                className="flex-1 bg-transparent outline-none text-sm text-must-text-primary px-2"
                disabled={!selectedConversation || isCurrentConversationClosed || isSendingMessage} />

              <button
                onClick={() => {
                  void handleSendMessage();
                }}
                disabled={!selectedConversation || !draftMessage.trim() || isCurrentConversationClosed || isSendingMessage}
                className="w-8 h-8 bg-must-green text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">

                <SendIcon className="w-4 h-4 ml-0.5" />
              </button>
            </div>
            {isCurrentConversationClosed ?
            <p className="mt-2 text-xs text-amber-700">This conversation is closed. Start a new conversation or reopen it by starting again.</p> :
            null}
          </div>
          </>
          }
        </div>
      </Card>
    </div>);

}