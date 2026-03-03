import { ChatProvider } from './context/ChatContext';
import ChatToggleButton from './components/ChatToggleButton';
import ChatPanel from './components/ChatPanel';

export default function ChatWidget() {
  return (
    <ChatProvider>
      <ChatToggleButton />
      <ChatPanel />
    </ChatProvider>
  );
}
