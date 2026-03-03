import { useChat } from '../context/ChatContext';

const VISITOR_CHIPS = {
  default: [
    'Có những khóa học nào?',
    'Học phí bao nhiêu?',
    'Lịch học như thế nào?',
    'Chính sách hoàn tiền?'
  ],
  'course-detail': [
    'Khóa này học gì?',
    'Có lớp nào sắp mở?',
    'Học phí và ưu đãi?',
    'Đầu ra sau khóa học?'
  ]
};

const STUDENT_CHIPS = [
  'Lịch học tuần này?',
  'Kết quả học tập?',
  'Chính sách bảo lưu?',
  'Liên hệ giáo viên?'
];

export default function SuggestionChips({ pageContext }) {
  const { sendMessage, messages, isStreaming } = useChat();
  const { mode } = useChat();

  // Only show if no messages yet
  if (messages.length > 0 || isStreaming) return null;

  const chips = mode === 'student'
    ? STUDENT_CHIPS
    : (pageContext?.includes('course') ? VISITOR_CHIPS['course-detail'] : VISITOR_CHIPS.default);

  return (
    <div className="flex flex-wrap gap-2 px-1">
      {chips.map((chip, index) => (
        <button
          key={chip}
          onClick={() => sendMessage(chip)}
          className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-all hover:bg-primary/10 hover:border-primary/30 animate-in fade-in duration-200"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
