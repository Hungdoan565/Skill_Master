const DEFAULT_CENTER_NAME = '{{CENTER_NAME}}';

function formatCurrency(value) {
  const amount = Number(value || 0);
  return `${amount.toLocaleString('vi-VN')}đ`;
}

function formatDate(value) {
  if (!value) {
    return 'Chưa cập nhật';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString('vi-VN');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildLayout({ centerName, title, intro, bodyHtml, footerNote }) {
  const safeCenterName = escapeHtml(centerName || DEFAULT_CENTER_NAME);
  const safeTitle = escapeHtml(title);
  const safeIntro = escapeHtml(intro);
  const safeFooterNote = escapeHtml(
    footerNote || 'Vui lòng không trả lời email tự động này. Nếu cần hỗ trợ, hãy liên hệ trung tâm.'
  );

  return `
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6f8;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:20px 24px;background:linear-gradient(135deg,#0f4c81,#1f7ab8);color:#ffffff;">
                <div style="font-size:22px;font-weight:700;line-height:1.3;">${safeCenterName}</div>
                <div style="font-size:13px;opacity:0.92;margin-top:4px;">Hệ thống quản lý đào tạo Skill Master</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.35;color:#111827;">${safeTitle}</h1>
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#374151;">${safeIntro}</p>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#6b7280;">${safeFooterNote}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildDetailTable(rows) {
  const rowHtml = rows
    .map(
      (row) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#4b5563;width:38%;">${escapeHtml(row.label)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;font-weight:600;">${escapeHtml(row.value)}</td>
      </tr>`
    )
    .join('');

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      ${rowHtml}
    </table>
  `;
}

export function enrollmentConfirmation(data = {}) {
  const subject = `Xác nhận ghi danh - ${data.className || 'Lớp học'}`;
  const html = buildLayout({
    centerName: data.centerName,
    title: 'Xác nhận ghi danh thành công',
    intro: `Chào ${data.studentName || 'học viên'}, bạn đã được ghi danh vào lớp học tại trung tâm.`,
    bodyHtml: buildDetailTable([
      { label: 'Học viên', value: data.studentName || 'Chưa cập nhật' },
      { label: 'Khóa học', value: data.courseName || 'Chưa cập nhật' },
      { label: 'Lớp học', value: data.className || 'Chưa cập nhật' },
      { label: 'Ngày ghi danh', value: formatDate(data.enrolledAt || new Date().toISOString()) },
      { label: 'Học phí tạm tính', value: formatCurrency(data.finalAmount) }
    ]),
    footerNote: 'Trung tâm sẽ liên hệ nếu có thay đổi lịch học. Cảm ơn bạn đã đồng hành cùng Skill Master.'
  });

  return { subject, html };
}

export function invoiceCreated(data = {}) {
  const subject = `Hóa đơn mới ${data.invoiceCode || ''}`.trim();
  const html = buildLayout({
    centerName: data.centerName,
    title: 'Thông báo tạo hóa đơn',
    intro: `Chào ${data.studentName || 'học viên'}, trung tâm vừa tạo một hóa đơn mới cho bạn.`,
    bodyHtml: buildDetailTable([
      { label: 'Mã hóa đơn', value: data.invoiceCode || 'Đang cập nhật' },
      { label: 'Loại phí', value: data.invoiceTypeLabel || 'Học phí' },
      { label: 'Nội dung', value: data.description || 'Không có mô tả' },
      { label: 'Tổng tiền cần thanh toán', value: formatCurrency(data.finalAmount) },
      { label: 'Hạn thanh toán', value: formatDate(data.dueDate) }
    ]),
    footerNote: 'Vui lòng thanh toán đúng hạn để tránh gián đoạn quá trình học tập.'
  });

  return { subject, html };
}

export function paymentReceived(data = {}) {
  const subject = `Đã nhận thanh toán ${data.invoiceCode || ''}`.trim();
  const html = buildLayout({
    centerName: data.centerName,
    title: 'Biên lai thanh toán học phí',
    intro: `Chào ${data.studentName || 'học viên'}, trung tâm đã ghi nhận thanh toán của bạn.`,
    bodyHtml: buildDetailTable([
      { label: 'Học viên', value: data.studentName || 'Chưa cập nhật' },
      { label: 'Mã hóa đơn', value: data.invoiceCode || 'Đang cập nhật' },
      { label: 'Số tiền đã thu', value: formatCurrency(data.amountPaid) },
      { label: 'Phương thức thanh toán', value: data.paymentMethodLabel || 'Khác' },
      { label: 'Ngày thanh toán', value: formatDate(data.paymentDate || new Date().toISOString()) },
      { label: 'Còn lại', value: formatCurrency(data.remainingAmount) }
    ]),
    footerNote: 'Cảm ơn bạn đã thanh toán. Mọi thông tin chi tiết đã được cập nhật trên hệ thống.'
  });

  return { subject, html };
}

export function leaveStatusUpdate(data = {}) {
  const statusLabelMap = {
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Từ chối'
  };

  const statusLabel = statusLabelMap[data.status] || 'Đã cập nhật';
  const subject = `Đơn xin nghỉ: ${statusLabel}`;
  const html = buildLayout({
    centerName: data.centerName,
    title: 'Cập nhật trạng thái đơn xin nghỉ',
    intro: `Chào ${data.teacherName || 'giáo viên'}, đơn xin nghỉ của bạn đã được cập nhật.`,
    bodyHtml: buildDetailTable([
      { label: 'Giáo viên', value: data.teacherName || 'Chưa cập nhật' },
      { label: 'Loại nghỉ', value: data.leaveTypeLabel || data.leaveType || 'Khác' },
      { label: 'Thời gian', value: `${formatDate(data.startDate)} - ${formatDate(data.endDate)}` },
      { label: 'Trạng thái', value: statusLabel },
      { label: 'Ghi chú', value: data.reviewNote || data.reason || 'Không có' }
    ]),
    footerNote: 'Nếu cần hỗ trợ thêm, vui lòng liên hệ quản lý trung tâm.'
  });

  return { subject, html };
}

export function gradePublished(data = {}) {
  const subject = `Đã công bố điểm ${data.className || ''}`.trim();
  const html = buildLayout({
    centerName: data.centerName,
    title: 'Thông báo công bố điểm',
    intro: `Chào ${data.studentName || 'học viên'}, điểm của bạn vừa được công bố trên hệ thống.`,
    bodyHtml: buildDetailTable([
      { label: 'Học viên', value: data.studentName || 'Chưa cập nhật' },
      { label: 'Khóa học', value: data.courseName || 'Chưa cập nhật' },
      { label: 'Lớp học', value: data.className || 'Chưa cập nhật' },
      { label: 'Điểm trung bình', value: data.averageScore ?? 'Đang cập nhật' },
      { label: 'Ngày công bố', value: formatDate(data.publishedAt || new Date().toISOString()) }
    ]),
    footerNote: 'Bạn có thể đăng nhập hệ thống để xem chi tiết từng đầu điểm.'
  });

  return { subject, html };
}
