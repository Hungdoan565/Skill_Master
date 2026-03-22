import { useState, useCallback, useEffect } from 'react';
import { useChat } from '../context/ChatContext';

const TIME_OPTIONS = [
  { value: 'morning', label: 'Sáng' },
  { value: 'afternoon', label: 'Chiều' },
  { value: 'evening', label: 'Tối' }
];

const TIME_LABELS = Object.fromEntries(TIME_OPTIONS.map(option => [option.value, option.label]));

export default function LeadCaptureCard() {
  const { submitLead, dismissLead, userName, leadTriggered, leadCaptured, allowLeadHandoff } = useChat();
  const [formData, setFormData] = useState({
    name: userName || '',
    phone: '',
    preferredTime: 'morning'
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    const result = await submitLead(formData);

    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error);
    }

    setSubmitting(false);
  }, [formData, submitting, submitLead]);

  // Auto-dismiss the success message after a few seconds
  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        dismissLead();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [submitted, dismissLead]);

  if (!allowLeadHandoff || !leadTriggered || leadCaptured) return null;


  if (submitted) {
    return (
      <div className="mx-2 my-2 rounded-xl border border-green-200 bg-green-50 p-4 animate-in fade-in duration-300 dark:border-green-800 dark:bg-green-950/30">
        <p className="text-sm font-medium text-green-800 dark:text-green-200">
          Tư vấn viên sẽ liên hệ bạn sớm nhất!
        </p>
        <p className="mt-1 text-xs text-green-600 dark:text-green-400">
          Cảm ơn bạn đã quan tâm đến Skill Master Academy.
        </p>
        <p className="mt-2 text-xs font-medium text-green-700 dark:text-green-300">
          Khung giờ mong muốn: {TIME_LABELS[formData.preferredTime] || 'Chưa chọn'}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-2 my-2 rounded-xl border border-border bg-white dark:bg-zinc-900 p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      <p className="mb-3 text-sm font-medium text-foreground">
        Muốn được tư vấn chi tiết hơn?
      </p>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <input
          type="text"
          placeholder="Họ tên *"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
          className="w-full rounded-lg border border-border bg-white dark:bg-zinc-800 px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
        />

        <input
          type="tel"
          placeholder="Số điện thoại *"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          required
          pattern="^0[3-9]\d{8}$"
          className="w-full rounded-lg border border-border bg-white dark:bg-zinc-800 px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
        />

        <div className="flex gap-2">
          {TIME_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, preferredTime: opt.value }))}
              className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                formData.preferredTime === opt.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/30'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? 'Đang gửi...' : 'Gửi cho tư vấn viên'}
          </button>
          <button
            type="button"
            onClick={dismissLead}
            className="px-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Không, cảm ơn
          </button>
        </div>
      </form>
    </div>
  );
}
