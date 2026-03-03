import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { gooeyToast } from 'goey-toast';

const ChatContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Default center ID - will be overridden by auth context
const DEFAULT_CENTER_ID = import.meta.env.VITE_DEFAULT_CENTER_ID || null;

export function ChatProvider({ children }) {
  const { user, session, profile } = useAuth();

  // --- Core state ---
  const [messages, setMessages] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(() => sessionStorage.getItem('molly_session_id'));
  const [visitorId] = useState(() => {
    let vid = sessionStorage.getItem('molly_visitor_id');
    if (!vid) {
      vid = crypto.randomUUID();
      sessionStorage.setItem('molly_visitor_id', vid);
    }
    return vid;
  });
  const [isOpen, setIsOpen] = useState(() => sessionStorage.getItem('molly_is_open') === 'true');
  const [isStreaming, setIsStreaming] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(() => sessionStorage.getItem('molly_lead_captured') === 'true');
  const [leadTriggered, setLeadTriggered] = useState(false);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [resolvedCenterId, setResolvedCenterId] = useState(null);

  // --- Multi-conversation state (student mode) ---
  const [conversations, setConversations] = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  const abortControllerRef = useRef(null);
  const loadedSessionsRef = useRef(new Set());

  const mode = user ? 'student' : 'visitor';

  // --- Auth headers helper ---
  const getAuthHeaders = useCallback(() => {
    const headers = { 'Content-Type': 'application/json' };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return headers;
  }, [session]);

  // --- CenterId resolution chain ---
  useEffect(() => {
    const fromProfile = profile?.center_id || profile?.centers?.id || null;
    if (fromProfile) {
      setResolvedCenterId(fromProfile);
      return;
    }
    if (DEFAULT_CENTER_ID) {
      setResolvedCenterId(DEFAULT_CENTER_ID);
      return;
    }
    let cancelled = false;
    fetch(`${API_URL}/api/chatbot/default-center`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!cancelled && data?.success && data?.data?.centerId) {
          setResolvedCenterId(data.data.centerId);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [profile]);

  const centerId = resolvedCenterId;

  // --- Persist isOpen ---
  useEffect(() => {
    sessionStorage.setItem('molly_is_open', String(isOpen));
  }, [isOpen]);

  // --- Persist leadCaptured ---
  useEffect(() => {
    if (leadCaptured) {
      sessionStorage.setItem('molly_lead_captured', 'true');
    }
  }, [leadCaptured]);

  // --- Persist activeSessionId (visitor mode uses sessionStorage) ---
  useEffect(() => {
    if (activeSessionId) {
      sessionStorage.setItem('molly_session_id', activeSessionId);
    }
  }, [activeSessionId]);

  // --- Online/Offline detection ---
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- Load conversations on mount (student mode) ---
  const loadConversationList = useCallback(async () => {
    if (mode !== 'student' || !session?.access_token) return;
    setIsLoadingConversations(true);
    try {
      const response = await fetch(`${API_URL}/api/chatbot/conversations?limit=20&offset=0`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data?.success) {
        setConversations(data.data.conversations || []);
        // If no active session but conversations exist, activate latest
        if (!activeSessionId && data.data.conversations?.length > 0) {
          const latest = data.data.conversations[0];
          setActiveSessionId(latest.id);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [mode, session, getAuthHeaders, activeSessionId]);

  useEffect(() => {
    if (mode === 'student' && session?.access_token) {
      loadConversationList();
    }
  }, [mode, session?.access_token]);

  // --- Load message history for active session ---
  const loadSessionMessages = useCallback(async (sessionIdToLoad) => {
    if (!sessionIdToLoad) return;

    // Skip if already loaded
    if (loadedSessionsRef.current.has(sessionIdToLoad)) return;

    setIsLoadingHistory(true);
    try {
      const response = await fetch(`${API_URL}/api/chatbot/messages/${sessionIdToLoad}`, {
        headers: getAuthHeaders()
      });
      const data = await response.ok ? await response.json() : null;
      if (data?.success && data?.data?.messages?.length > 0) {
        const loadedMessages = data.data.messages.map(msg => ({
          id: msg.id || crypto.randomUUID(),
          role: msg.role,
          content: msg.content,
          rating: msg.rating || null,
          timestamp: msg.created_at || new Date().toISOString(),
          isHistory: true
        }));
        setMessages(loadedMessages);
      } else {
        setMessages([]);
      }
      loadedSessionsRef.current.add(sessionIdToLoad);
    } catch (err) {
      console.error('Failed to load session messages:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [getAuthHeaders]);

  // Load messages when activeSessionId changes
  useEffect(() => {
    if (activeSessionId) {
      loadSessionMessages(activeSessionId);
    }
  }, [activeSessionId, loadSessionMessages]);

  // --- Actions ---
  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const minimize = useCallback(() => {
    setIsOpen(false);
  }, []);

  const resetSession = useCallback(() => {
    setMessages([]);
    setActiveSessionId(null);
    setLeadCaptured(false);
    setLeadTriggered(false);
    setError(null);
    loadedSessionsRef.current.clear();
    sessionStorage.removeItem('molly_session_id');
    sessionStorage.removeItem('molly_lead_captured');
  }, []);

  // --- Multi-conversation actions (student mode) ---
  const createConversation = useCallback(async () => {
    if (mode === 'visitor') {
      resetSession();
      return;
    }
    if (!centerId) return;

    try {
      const response = await fetch(`${API_URL}/api/chatbot/conversations`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ centerId })
      });
      const data = await response.json();
      if (data?.success) {
        const newConv = {
          id: data.data.id,
          title: data.data.title || 'Cuộc trò chuyện mới',
          lastMessageAt: data.data.startedAt,
          messageCount: 0,
          preview: null
        };
        setConversations(prev => [newConv, ...prev]);
        setActiveSessionId(data.data.id);
        setMessages([]);
        loadedSessionsRef.current.add(data.data.id);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  }, [mode, centerId, getAuthHeaders, resetSession]);

  const switchConversation = useCallback(async (targetSessionId) => {
    if (targetSessionId === activeSessionId) return;

    setActiveSessionId(targetSessionId);
    setError(null);

    // Messages will be loaded by the useEffect watching activeSessionId
    // If already loaded, it returns from cache (loadedSessionsRef)
    if (!loadedSessionsRef.current.has(targetSessionId)) {
      setMessages([]); // Clear while loading
    } else {
      // Need to re-fetch since we don't cache message arrays per session
      loadedSessionsRef.current.delete(targetSessionId);
    }
  }, [activeSessionId]);

  const deleteConversation = useCallback(async (targetSessionId) => {
    try {
      const response = await fetch(`${API_URL}/api/chatbot/conversations/${targetSessionId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data?.success) {
        setConversations(prev => prev.filter(c => c.id !== targetSessionId));
        loadedSessionsRef.current.delete(targetSessionId);

        // If deleted active conversation, switch to next available
        if (targetSessionId === activeSessionId) {
          const remaining = conversations.filter(c => c.id !== targetSessionId);
          if (remaining.length > 0) {
            setActiveSessionId(remaining[0].id);
            loadedSessionsRef.current.delete(remaining[0].id);
            setMessages([]);
          } else {
            setActiveSessionId(null);
            setMessages([]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  }, [activeSessionId, conversations, getAuthHeaders]);

  const renameConversation = useCallback(async (targetSessionId, newTitle) => {
    try {
      const response = await fetch(`${API_URL}/api/chatbot/conversations/${targetSessionId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title: newTitle })
      });
      const data = await response.json();
      if (data?.success) {
        setConversations(prev =>
          prev.map(c => c.id === targetSessionId ? { ...c, title: newTitle } : c)
        );
      }
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    }
  }, [getAuthHeaders]);

  // --- Message actions ---
  const copyMessage = useCallback((content) => {
    navigator.clipboard.writeText(content).then(() => {
      gooeyToast.success('Đã sao chép!');
    }).catch(() => {
      gooeyToast.error('Không thể sao chép');
    });
  }, []);

  const rateMessage = useCallback(async (messageId, rating) => {
    // Optimistic update
    setMessages(prev =>
      prev.map(msg => msg.id === messageId ? { ...msg, rating } : msg)
    );

    try {
      const response = await fetch(`${API_URL}/api/chatbot/messages/${messageId}/rate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ rating })
      });
      const data = await response.json();
      if (!data?.success) {
        // Revert on failure
        setMessages(prev =>
          prev.map(msg => msg.id === messageId ? { ...msg, rating: null } : msg)
        );
      }
    } catch (err) {
      // Revert
      setMessages(prev =>
        prev.map(msg => msg.id === messageId ? { ...msg, rating: null } : msg)
      );
    }
  }, [getAuthHeaders]);

  const regenerateResponse = useCallback(async (messageId) => {
    if (isStreaming) return;

    // Find the message to regenerate and the preceding user message
    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex < 0 || messages[msgIndex].role !== 'assistant') return;

    // Find preceding user message
    let userMsg = null;
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userMsg = messages[i];
        break;
      }
    }
    if (!userMsg) return;

    // Remove the assistant message from UI
    setMessages(prev => prev.filter(m => m.id !== messageId));

    // Re-send the same user message (backend will handle via history)
    await sendMessage(userMsg.content, true);
  }, [isStreaming, messages]);

  const editAndResend = useCallback(async (messageId, newText) => {
    if (isStreaming) return;

    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex < 0) return;

    // Remove all messages after the edited one
    const remainingMessages = messages.slice(0, msgIndex);

    // Update the edited message
    const editedMsg = { ...messages[msgIndex], content: newText };
    setMessages([...remainingMessages, editedMsg]);

    // Send as new message
    await sendMessage(newText, true);
  }, [isStreaming, messages]);

  // --- Main send message ---
  const sendMessage = useCallback(async (text, isResend = false) => {
    if (!text?.trim() || isStreaming) return;

    if (!navigator.onLine) {
      setError('Mất kết nối mạng. Vui lòng kiểm tra và thử lại.');
      return;
    }

    if (!centerId) {
      setError('Không thể kết nối. Vui lòng thử lại sau.');
      return;
    }

    // Only add user message bubble if not a resend (resend already has it in state)
    if (!isResend) {
      const userMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text.trim(),
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);
    }

    setIsStreaming(true);
    setError(null);

    const assistantId = crypto.randomUUID();
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true
    }]);

    try {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const headers = getAuthHeaders();

      const response = await fetch(`${API_URL}/api/chatbot/message`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: text.trim(),
          sessionId: activeSessionId,
          centerId,
          visitorId: !user ? visitorId : undefined,
          pageContext: window.location.pathname
        }),
        signal: controller.signal
      });

      if (!response.ok && !response.headers.get('content-type')?.includes('text/event-stream')) {
        const errorData = await response.json().catch(() => ({}));

        if (errorData.code === 'session_cap') {
          setMessages(prev => prev.map(msg =>
            msg.id === assistantId
              ? { ...msg, content: '', isStreaming: false, isSessionCap: true }
              : msg
          ));
          setIsStreaming(false);
          return;
        }

        throw new Error(errorData.error || 'Đã xảy ra lỗi');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);

            switch (event.type) {
              case 'session':
                setActiveSessionId(event.sessionId);
                break;

              case 'token':
                setMessages(prev => prev.map(msg =>
                  msg.id === assistantId
                    ? { ...msg, content: msg.content + event.content }
                    : msg
                ));
                break;

              case 'done':
                setMessages(prev => prev.map(msg =>
                  msg.id === assistantId
                    ? { ...msg, isStreaming: false, tokensUsed: event.tokensUsed }
                    : msg
                ));
                break;

              case 'title':
                // Update conversation title from AI auto-title
                if (event.title && event.sessionId) {
                  setConversations(prev =>
                    prev.map(c => c.id === event.sessionId ? { ...c, title: event.title } : c)
                  );
                }
                break;

              case 'lead_trigger':
                if (!leadCaptured) {
                  setLeadTriggered(true);
                }
                break;

              case 'error':
                setMessages(prev => prev.map(msg =>
                  msg.id === assistantId
                    ? {
                        ...msg,
                        content: event.error,
                        isStreaming: false,
                        isError: true,
                        errorCode: event.code
                      }
                    : msg
                ));
                break;
            }
          } catch (e) {
            // Skip malformed events
          }
        }
      }

      // After stream completes, refresh conversation list to get updated preview/count
      if (mode === 'student') {
        loadConversationList();
      }
    } catch (err) {
      if (err.name === 'AbortError') return;

      const errorMessage = err.message || 'Không thể kết nối. Vui lòng thử lại!';
      setMessages(prev => prev.map(msg =>
        msg.id === assistantId
          ? { ...msg, content: errorMessage, isStreaming: false, isError: true, isNetworkError: true }
          : msg
      ));
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [isStreaming, activeSessionId, centerId, visitorId, user, session, leadCaptured, getAuthHeaders, mode, loadConversationList]);

  const submitLead = useCallback(async (leadData) => {
    try {
      const response = await fetch(`${API_URL}/api/chatbot/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...leadData,
          sessionId: activeSessionId,
          centerId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error };
      }

      setLeadCaptured(true);
      setLeadTriggered(false);
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, error: 'Không thể gửi. Vui lòng thử lại!' };
    }
  }, [activeSessionId, centerId]);

  const dismissLead = useCallback(() => {
    setLeadTriggered(false);
    setLeadCaptured(true);
  }, []);

  const retryLastMessage = useCallback(() => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      setMessages(prev => prev.filter(m => !m.isError || m.role !== 'assistant'));
      sendMessage(lastUserMsg.content);
    }
  }, [messages, sendMessage]);

  const value = {
    // Core state
    messages,
    sessionId: activeSessionId,
    activeSessionId,
    isOpen,
    isStreaming,
    isOffline,
    isLoadingHistory,
    mode,
    leadCaptured,
    leadTriggered,
    error,
    centerId,
    userName: profile?.full_name || null,

    // Multi-conversation state
    conversations,
    isLoadingConversations,

    // Basic actions
    toggle,
    close,
    minimize,
    sendMessage,
    submitLead,
    dismissLead,
    retryLastMessage,
    resetSession,

    // Conversation management (student mode)
    createConversation,
    switchConversation,
    deleteConversation,
    renameConversation,
    loadConversationList,

    // Message actions
    copyMessage,
    rateMessage,
    regenerateResponse,
    editAndResend
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

export default ChatContext;
