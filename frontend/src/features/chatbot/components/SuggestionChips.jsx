import { useChat } from '../context/ChatContext';

const PUBLIC_CHIPS = {
  default: [
    'Tư vấn khóa học',
    'Lộ trình học',
    'Kiểm tra nhanh đầu vào',
    'Học phí bao nhiêu?',
  ],
  'course-detail': [
    'Tư vấn khóa học này',
    'Lộ trình phù hợp',
    'Kiểm tra nhanh đầu vào',
    'Học phí và ưu đãi?',
    'Đầu ra sau khóa học?'
  ]
};

const STUDENT_CHIPS = [
  'Lộ trình học',
  'Kiểm tra nhanh đầu vào',
  'Lịch học tuần này?',
  'Kết quả học tập?',
  'Liên hệ giáo viên?'
];

const PARENT_CHIPS = [
  'Tư vấn khóa học',
  'Lộ trình học',
  'Kiểm tra nhanh đầu vào',
  'Con đang học thế nào?'
];

export default function SuggestionChips({ pageContext }) {
  const { sendMessage, messages, isStreaming, chatMode } = useChat();

  // Only show if no messages yet
  if (messages.length > 0 || isStreaming) return null;

  const chips = chatMode === 'student-guidance'
    ? STUDENT_CHIPS
    : chatMode === 'parent-guidance'
      ? PARENT_CHIPS
      : (pageContext?.includes('course') ? PUBLIC_CHIPS['course-detail'] : PUBLIC_CHIPS.default);

  const label = chatMode === 'student-guidance'
    ? 'Bắt đầu nhanh'
    : chatMode === 'parent-guidance'
      ? 'Gợi ý cho phụ huynh'
      : 'Khám phá nhanh cùng Molly';

  return (
    <div className="px-1">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
      {chips.map((chip, index) => (
        <button
          key={chip}
          onClick={() => sendMessage(chip)}
          className="rounded-full border border-border bg-white px-3 py-1.5 text-xs text-foreground transition-all hover:bg-primary/10 hover:border-primary/30 animate-in fade-in duration-200"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {chip}
        </button>
      ))}
      </div>
    </div>
  );
}
