import { useChat } from '../context/ChatContext';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import ConversationDrawer from './ConversationDrawer';
import { useCallback, useEffect, useState } from 'react';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isMobile;
}

function DesktopPanel() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleDrawer = useCallback(() => setDrawerOpen(prev => !prev), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <div className="fixed bottom-24 right-6 z-[9999] flex h-[min(600px,calc(100vh-8rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/10 isolate animate-in fade-in slide-in-from-bottom-4 duration-300">
      <ConversationDrawer isOpen={drawerOpen} onClose={closeDrawer} />
      <ChatHeader onToggleDrawer={toggleDrawer} />
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <ChatMessages />
        <ChatInput />
      </div>
    </div>
  );
}

function MobilePanel() {
  const { isOpen, close } = useChat();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleDrawer = useCallback(() => setDrawerOpen(prev => !prev), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) close(); }}>
      <SheetContent side="bottom" className="h-[100dvh] p-0 flex flex-col [&>button]:hidden">
        <ConversationDrawer isOpen={drawerOpen} onClose={closeDrawer} />
        <ChatHeader onToggleDrawer={toggleDrawer} />
        <div className="relative flex flex-1 flex-col overflow-hidden">
          <ChatMessages />
          <ChatInput />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function ChatPanel() {
  const { isOpen } = useChat();
  const isMobile = useIsMobile();

  if (!isOpen) return null;

  return isMobile ? <MobilePanel /> : <DesktopPanel />;
}
