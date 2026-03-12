import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ChatProvider } from './context/ChatContext';
import ChatToggleButton from './components/ChatToggleButton';
import ChatPanel from './components/ChatPanel';
import { getRoleCode, shouldSuppressChatWidget } from './utils/mode-policy';

const LOCATION_CHANGE_EVENT = 'molly:locationchange';

function patchHistoryEvents() {
  if (typeof window === 'undefined' || window.__mollyHistoryPatched) {
    return;
  }

  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  const dispatchLocationChange = () => {
    window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT));
  };

  window.history.pushState = function pushState(...args) {
    const result = originalPushState.apply(this, args);
    dispatchLocationChange();
    return result;
  };

  window.history.replaceState = function replaceState(...args) {
    const result = originalReplaceState.apply(this, args);
    dispatchLocationChange();
    return result;
  };

  window.__mollyHistoryPatched = true;
}

export default function ChatWidget() {
  const { user, profile } = useAuth();
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    patchHistoryEvents();

    const handleLocationChange = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener(LOCATION_CHANGE_EVENT, handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener(LOCATION_CHANGE_EVENT, handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const roleCode = getRoleCode(profile);
  const suppressWidget = shouldSuppressChatWidget({
    pathname,
    roleCode,
    isAuthenticated: Boolean(user)
  });

  if (suppressWidget) {
    return null;
  }

  return (
    <ChatProvider pathname={pathname}>
      <ChatToggleButton />
      <ChatPanel />
    </ChatProvider>
  );
}
