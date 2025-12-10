# Dashboard Feature - Skill Master

## 📋 Tổng quan

Dashboard Admin là trung tâm điều khiển chính của hệ thống Skill Master, cung cấp cái nhìn tổng quan về:
- Doanh thu và tài chính
- Học viên và ghi danh
- Lớp học đang hoạt động
- Thanh toán và công nợ
- Lịch dạy hôm nay
- Hoạt động gần đây

## 🏗️ Cấu trúc

```
dashboard/
├── components/          # UI Components
│   ├── StatsSection.jsx           # 4 thẻ thống kê chính
│   ├── ChartsSection.jsx          # Biểu đồ doanh thu + phân bố
│   ├── PaymentOverviewCard.jsx    # Tổng quan thanh toán
│   ├── TodayScheduleCard.jsx      # Lịch dạy hôm nay
│   ├── RecentStudentsList.jsx     # Danh sách sinh viên mới
│   ├── QuickActionsCard.jsx       # Các thao tác nhanh
│   ├── GettingStartedCard.jsx     # Hướng dẫn cho admin mới
│   ├── DashboardHeader.jsx        # Header với refresh/export
│   ├── CenterSelector.jsx         # Chọn trung tâm (SUPER_ADMIN)
│   ├── DateRangeSelector.jsx      # Chọn khoảng thời gian
│   ├── ErrorAlert.jsx             # Hiển thị lỗi
│   ├── SimpleAreaChart.jsx        # Biểu đồ doanh thu
│   ├── SimplePieChart.jsx         # Biểu đồ phân bố
│   ├── LiveActivityStream.jsx     # Stream hoạt động realtime
│   └── StatusBadges.jsx           # Các badge trạng thái
├── hooks/
│   ├── useDashboard.js            # Hook chính quản lý data
│   └── index.js
├── pages/
│   ├── DashboardPage.jsx          # Trang dashboard chính
│   └── index.js
├── utils/
│   ├── constants.js               # Constants và config
│   ├── formatters.js              # Hàm format dữ liệu
│   ├── export.js                  # Export CSV/JSON
│   └── index.js
└── index.js                       # Barrel export

```

## 🔌 API Endpoints

Dashboard sử dụng các API sau:

### 1. Unified API (Giảm số lượng request)
```
GET /api/dashboard/all?centerId={id}
Response: {
  stats: { revenue, newStudents, activeClasses, debt, summary }
  payments: { counts, amounts, overdueAlert }
  recentStudents: []
  todaySchedule: { sessions, summary }
}
```

### 2. Revenue Chart
```
GET /api/dashboard/revenue-chart?centerId={id}
Response: [{ month, label, revenue }]
```

### 3. Course Distribution
```
GET /api/dashboard/course-distribution?centerId={id}
Response: [{ name, value }]
```

## 📊 Components chính

### StatsSection
4 thẻ thống kê KPI chính:
- **Doanh thu**: Tổng doanh thu tháng (có trend so với tháng trước)
- **Học viên**: Số học viên ghi danh mới (có trend)
- **Lớp học**: Số lớp đang hoạt động
- **Công nợ**: Tổng công nợ cần thu (có cảnh báo nếu > 0)

### ChartsSection
2 biểu đồ:
- **Revenue Chart**: Biểu đồ doanh thu 12 tháng (area chart)
- **Distribution Chart**: Phân bố học viên theo khóa học (progress bars)

### PaymentOverviewCard
Tổng quan thanh toán:
- Đã thanh toán
- Chờ thanh toán
- Quá hạn (có cảnh báo)

### TodayScheduleCard
Lịch dạy hôm nay:
- Danh sách buổi học
- Trạng thái (scheduled/completed)
- Thông tin lớp, giáo viên, phòng

### GettingStartedCard
Hướng dẫn setup cho admin mới:
- Thiết lập trung tâm
- Thêm nhân viên
- Tạo khóa học
- Mở lớp học
- Cấu hình hệ thống

Progress tracking tự động, có thể dismiss.

## 🎯 Features

### ✅ Đã hoàn thành
- [x] Dashboard layout responsive
- [x] Stats cards với trend indicators
- [x] Revenue chart với tooltip
- [x] Course distribution chart
- [x] Payment overview
- [x] Today schedule
- [x] Recent students list
- [x] Quick actions
- [x] Error handling & retry
- [x] Loading states
- [x] Export to CSV
- [x] Center selector (SUPER_ADMIN)
- [x] Date range filter
- [x] Getting started guide

### 🔄 Cần cải thiện
- [ ] Realtime updates (WebSocket)
- [ ] Activity stream
- [ ] More date range options
- [ ] Advanced filters
- [ ] Custom dashboard widgets
- [ ] Drag & drop layout

## 🚀 Usage

```jsx
import { DashboardPage } from '@/features/dashboard';

// Sử dụng trong routing
<Route path="dashboard" element={<DashboardPage />} />
```

## 🔐 Permissions

- **SUPER_ADMIN**: Xem tất cả trung tâm, có thể filter theo center
- **CENTER_MANAGER**: Chỉ xem center của mình

## 📱 Responsive Design

- **Desktop (>= 1024px)**: Full layout với 2-3 columns
- **Tablet (768px - 1023px)**: 2 columns layout
- **Mobile (< 768px)**: Single column, stacked layout

## 🎨 Design System

Dashboard tuân theo design system của Skill Master:
- **Primary color**: Orange (#f97316)
- **Border radius**: 1rem (rounded-2xl)
- **Shadows**: Subtle box-shadow
- **Spacing**: Consistent 8px grid

## 📝 Notes

- Dashboard tự động refresh data mỗi lần mount
- Export CSV bao gồm tất cả data hiện tại
- Getting Started card có thể dismiss, lưu vào localStorage
- Error states có retry button

