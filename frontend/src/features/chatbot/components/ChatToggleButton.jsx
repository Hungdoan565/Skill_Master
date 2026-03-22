import { MessageCircle, X } from 'lucide-react';
import { useChat } from '../context/ChatContext';

export default function ChatToggleButton() {
  const { isOpen, toggle } = useChat();

  return (
    <button
      onClick={toggle}
      className="fixed bottom-6 right-6 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground dark:text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
      aria-label={isOpen ? 'Đóng chat' : 'Chat với Molly'}
    >
      <div className="relative h-6 w-6">
        <MessageCircle
          className={`absolute inset-0 h-6 w-6 transition-all duration-200 ${
            isOpen ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
        />
        <X
          className={`absolute inset-0 h-6 w-6 transition-all duration-200 ${
            isOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>
    </button>
  );
}
