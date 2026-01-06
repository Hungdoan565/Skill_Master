/**
 * Notification templates with smart variables
 * Extracted from AdminNotificationsPage for reuse
 */

export const NOTIFICATION_TEMPLATES = [
    {
        id: 'payment_reminder',
        name: 'Nhắc nhở học phí',
        subject: 'Nhắc nhở học phí - {courseName}',
        content: `Kính gửi {studentName},

Trung tâm xin thông báo về tình hình học phí của bạn:

📚 Khóa học: {courseName}
🏫 Lớp: {className}
💰 Tổng học phí: {totalFee}
✅ Đã thanh toán: {paidAmount}
⚠️ Còn lại: {remainingAmount}
📅 Hạn thanh toán: {dueDate}

Xin vui lòng thanh toán trước hạn để đảm bảo quyền lợi học tập.

Thông tin chuyển khoản:
- Ngân hàng: {bankName}
- Số tài khoản: {bankAccount}
- Chủ tài khoản: {accountHolder}
- Nội dung: HP {studentName} - {className}

Trân trọng,
{centerName}`,
        fields: [
            { key: 'dueDate', label: '📅 Hạn thanh toán', type: 'date' },
            { key: 'bankName', label: '🏦 Ngân hàng', type: 'select', options: ['Vietcombank', 'Techcombank', 'BIDV', 'Agribank', 'MB Bank', 'VPBank', 'ACB', 'Sacombank', 'TPBank', 'Khác'] },
            { key: 'bankAccount', label: '💳 Số tài khoản', type: 'text', placeholder: 'VD: 1234567890' },
            { key: 'accountHolder', label: '👤 Chủ tài khoản', type: 'text', placeholder: 'VD: CONG TY ABC' },
        ],
        autoFields: ['studentName', 'courseName', 'className', 'totalFee', 'paidAmount', 'remainingAmount', 'centerName']
    },
    {
        id: 'class_reminder',
        name: 'Nhắc nhở buổi học',
        subject: 'Nhắc nhở buổi học - {className}',
        content: `Xin chào {studentName},

📚 Nhắc bạn về buổi học sắp tới:
- Lớp: {className}
- Khóa học: {courseName}
- Giáo viên: {teacherName}
- Phòng học: {roomName}

Hãy chuẩn bị bài và đến đúng giờ nhé!

Trân trọng,
{centerName}`,
        fields: [],
        autoFields: ['studentName', 'className', 'courseName', 'teacherName', 'roomName', 'centerName']
    },
    {
        id: 'general_announcement',
        name: 'Thông báo chung',
        subject: 'Thông báo từ {centerName}',
        content: `Kính gửi {studentName},

{customContent}

Trân trọng,
{centerName}`,
        fields: [
            { key: 'customContent', label: '📝 Nội dung thông báo', type: 'textarea', placeholder: 'Nhập nội dung thông báo...' }
        ],
        autoFields: ['studentName', 'centerName']
    },
    {
        id: 'course_completion',
        name: 'Chúc mừng hoàn thành khóa học',
        subject: 'Chúc mừng hoàn thành khóa học - {courseName}',
        content: `Kính gửi {studentName},

🎉 Chúc mừng bạn đã hoàn thành khóa học {courseName}!

Thông tin khóa học:
- Lớp: {className}
- Giáo viên: {teacherName}

Cảm ơn bạn đã tin tưởng và đồng hành cùng chúng tôi. Chúc bạn thành công trên con đường học tập!

Trân trọng,
{centerName}`,
        fields: [],
        autoFields: ['studentName', 'courseName', 'className', 'teacherName', 'centerName']
    }
];

// Format currency helper
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount || 0);
};

// Generate preview content for a student
export const generatePreviewContent = (student, template, templateFields) => {
    if (!template) return { subject: '', content: '' };

    let content = template.content;
    let subject = template.subject;

    // Replace auto fields
    const autoReplacements = {
        '{studentName}': student.full_name || '',
        '{courseName}': student.course_name || '',
        '{className}': student.class_name || '',
        '{teacherName}': student.teacher_name || '',
        '{roomName}': student.room_name || '',
        '{centerName}': student.center_name || 'Trung tâm',
        '{totalFee}': formatCurrency(student.total_fee),
        '{paidAmount}': formatCurrency(student.paid_amount),
        '{remainingAmount}': formatCurrency(student.remaining_amount),
    };

    Object.entries(autoReplacements).forEach(([key, value]) => {
        content = content.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
        subject = subject.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    // Replace custom fields
    template.fields?.forEach(field => {
        const value = templateFields[field.key] || `[${field.label}]`;
        const formattedValue = field.type === 'date' && templateFields[field.key]
            ? new Date(templateFields[field.key]).toLocaleDateString('vi-VN')
            : value;
        content = content.replace(new RegExp(`\\{${field.key}\\}`, 'g'), formattedValue);
        subject = subject.replace(new RegExp(`\\{${field.key}\\}`, 'g'), formattedValue);
    });

    return { subject, content };
};
