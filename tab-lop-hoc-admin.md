KẾ HOẠCH PHÁT TRIỂN NÂNG CẤP TÍNH NĂNG QUẢN LÝ LỚP HỌC

## I. TỔNG QUAN KẾ HOẠCH

### 1.1 Mục tiêu
Nâng cấp toàn diện hệ thống quản lý lớp học của Skill Master để:
- Cải thiện trải nghiệm người dùng với UI/UX hiện đại
- Tăng cường khả năng phân tích và báo cáo
- Tự động hóa các tác vụ lặp lại
- Hỗ trợ quản lý hiệu quả cho trung tâm vừa và lớn (100-500+ học viên)

### 1.2 Phạm vi Dự án
**Modules chính cần nâng cấp:**
1. **Classes List Page** - Danh sách lớp học
2. **Class Detail Page** - Chi tiết lớp học (3 tabs: Students, Schedule, Grades)
3. **Analytics & Reports** - Thống kê và báo cáo

**Không bao gồm:**
- Thay đổi database schema (tận dụng structure hiện tại)
- Mobile app development
- Third-party integrations (LMS, payment gateways)

### 1.3 Nguyên tắc Phát triển
- ✅ **Simplicity First**: Giải pháp đơn giản, dễ maintain
- ✅ **Reuse Existing Patterns**: Tận dụng components và patterns có sẵn
- ✅ **Progressive Enhancement**: Nâng cấp từng phần, không rebuild toàn bộ
- ✅ **Backward Compatible**: Đảm bảo tương thích với code hiện tại

---

## II. PHASE 1: CẢI TIẾN CƠ BẢN (Ưu tiên CAO)

### Phase 1.1: Advanced Filters cho Classes List

**Mục tiêu**: Nâng cấp hệ thống lọc từ 2 filters hiện tại (search + status) lên 6+ filters.

**Current State Analysis: // Hiện tại chỉ có:
- Search input (tìm theo tên, mã lớp)
- Status filter dropdown (active, scheduled, completed, cancelled)
Proposed Solution:// New ClassesFilter Component Structure

interface ClassFiltersState {
  search: string;           // Existing
  status: string;           // Existing
  courseId: string;         // NEW - Filter by course
  teacherId: string;        // NEW - Filter by teacher
  centerId: string;         // NEW - Filter by center (SUPER_ADMIN only)
  dateStart: string;        // NEW - Start date range
  dateEnd: string;          // NEW - End date range
  capacity: 'full' | 'available' | 'all';  // NEW - Capacity status
}

// Components to create:
1. AdvancedFiltersDrawer.jsx  - Slide-in panel với tất cả filters
2. FilterChips.jsx             - Hiển thị active filters dạng chips
3. SavedFiltersDropdown.jsx    - Lưu và load filter presets
Implementation Tasks:**

1. **Create AdvancedFiltersDrawer Component**
   - Slide-in panel from right
   - Grouped filters (Basic, Advanced, Date Range)
   - Apply/Reset buttons
   - Responsive mobile support

2. **Extend useClassesList Hook**
   ```javascript
   // Add new filter state and logic
   const [filters, setFilters] = useState<ClassFiltersState>({...});
   const updateFilter = (key, value) => {...};
   const clearFilters = () => {...};
   const saveFilterPreset = (name) => {...};
   ```

3. **Backend API Enhancement**
   - Modify `/api/classes` endpoint to support new query params
   - Add indexing for course_id, teacher_id for performance

4. **UI Components**
   - Filter chips showing active filters
   - Clear individual filter button
   - Filter preset dropdown (Saved filters)

**Acceptance Criteria:**
- [ ] Users can filter by 6+ criteria simultaneously
- [ ] Active filters are clearly visible with chips
- [ ] Filter state persists during session (localStorage)
- [ ] Performance: Filter results in < 500ms with 1000+ classes
- [ ] Mobile-responsive filter drawer

---

### Phase 1.2: Calendar View cho Schedule

**Mục tiêu**: Thêm Calendar View vào ScheduleTab để visualize lịch dạy trực quan hơn.

**Current State Analysis:**
```javascript
// ScheduleTab hiện tại chỉ có List View
// CalendarView đã tồn tại trong SchedulePage (global)
// Cần tái sử dụng CalendarView component cho ClassDetailPage
```

**Reuse Existing Component:**

Skill Master đã có `CalendarView` component hoàn chỉnh trong `frontend/src/features/schedule/components/CalendarView.jsx` với:
- Week view và Month view
- Session cards với color coding theo status
- Click vào session để xem detail
- Responsive design

**Proposed Solution:**

```typescript
// Simple integration approach:

// 1. Import CalendarView vào ScheduleTab
import { CalendarView } from '@/features/schedule/components';

// 2. Add view toggle
const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

// 3. Render conditional
{viewMode === 'list' ? (
  <SessionsList sessions={sessions} />
) : (
  <CalendarView 
    sessions={sessions}
    onSessionClick={onAttendanceClick}
  />
)}
```

**Implementation Tasks:**

1. **Add View Mode Toggle**
   - Button group: List / Calendar icons
   - Save preference to localStorage
   - Smooth transition between views

2. **Customize CalendarView for Class Context**
   - Filter sessions by current class only
   - Simplify action menu (không cần change teacher/room từ class detail)
   - Show attendance status directly

3. **Mobile Optimization**
   - Calendar collapses to agenda view on mobile
   - Swipe gestures for navigation

**Acceptance Criteria:**
- [ ] Users can toggle between List and Calendar view
- [ ] Calendar shows all sessions of current class
- [ ] Click on session opens attendance modal
- [ ] View preference persists
- [ ] Mobile-friendly agenda view

---

### Phase 1.3: Recurring Sessions Builder

**Mục tiêu**: Tạo tool để bulk create sessions theo pattern lặp lại (hàng tuần).

**Current State Analysis:**
```javascript
// Hiện tại: Admin phải tạo từng session một bằng tay
// CreateClassModal có schedule input nhưng chỉ là text
// Backend không có auto-generate sessions từ schedule pattern
```

**Proposed Solution:**

```typescript
// RecurringSessionBuilder Component

interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'biweekly';
  daysOfWeek: number[];      // [1, 3, 5] = Monday, Wednesday, Friday
  startTime: string;         // "14:00"
  endTime: string;           // "16:00"
  startDate: string;         // "2025-01-15"
  endDate: string;           // "2025-06-30"
  excludeDates: string[];    // Holidays to skip
}

// Preview modal showing all sessions to be created
// User can review and edit before confirming
```

**Implementation Tasks:**

1. **Create RecurringSessionBuilder Component**
   - Step 1: Choose frequency and days
   - Step 2: Set time and date range
   - Step 3: Preview sessions (table/calendar)
   - Step 4: Confirm and create

2. **Backend API Endpoint**
   ```javascript
   POST /api/classes/:classId/sessions/bulk
   Body: {
     pattern: RecurringPattern,
     preview: boolean  // true = dry run, false = actual create
   }
   ```

3. **Conflict Detection**
   - Check room availability
   - Check teacher availability
   - Highlight conflicts in preview

4. **Integration Points**
   - Add button in ScheduleTab: "Create Multiple Sessions"
   - Also add in CreateClassModal workflow

**Acceptance Criteria:**
- [ ] Users can define weekly patterns
- [ ] Preview shows exact sessions to be created
- [ ] Conflicts are detected and highlighted
- [ ] Bulk create is atomic (all or nothing)
- [ ] Maximum 100 sessions per bulk operation

---

### Phase 1.4: Class Analytics Dashboard

**Mục tiêu**: Thêm trang Analytics overview cho Classes với charts và stats.

**Current State Analysis:**
```javascript
// Dashboard chính có stats tổng quan
// Thiếu analytics chi tiết cho classes
// Không có insights về class performance
```

**Reuse Existing Patterns:**

```javascript
// Tận dụng dashboard components hiện có:
import {
  SimpleAreaChart,      // Trend charts
  SimplePieChart,       // Distribution
  HorizontalBarChart,   // Rankings
  StatsSection,         // KPI cards
} from '@/features/dashboard/components';
```

**Proposed Solution:**

```typescript
// New page: /admin/classes/analytics

// KPI Cards
- Total Classes by Status
- Average Class Size (current / max)
- Upcoming Start Dates (next 7 days)
- Completion Rate

// Charts
1. Class Creation Trend (last 12 months) - LineChart
2. Distribution by Course - PieChart
3. Top Teachers by Class Count - BarChart
4. Capacity Utilization - BarChart (% full)

// Tables
- Classes Needing Attention (low enrollment, near start date)
- Most Popular Courses
```

**Implementation Tasks:**

1. **Create ClassAnalytics Page**
   - Reuse dashboard layout structure
   - 4 KPI cards at top
   - 2x2 chart grid
   - Tables at bottom

2. **New Backend Endpoint**
   ```javascript
   GET /api/classes/analytics
   Query: ?centerId=xxx&dateRange=this_month
   
   Response: {
     stats: { total, byStatus, avgSize, upcomingStarts },
     trends: { creationTrend, completionTrend },
     distributions: { byCourse, byTeacher, byCapacity },
     alerts: { lowEnrollment, soonStarting }
   }
   ```

3. **Navigation Integration**
   - Add link in AdminSidebar
   - Add button in ClassesPage header

**Acceptance Criteria:**
- [ ] Dashboard loads in < 2s
- [ ] All charts are interactive (hover tooltips)
- [ ] Data refreshes every 5 minutes
- [ ] Export analytics to PDF
- [ ] Responsive on all devices

---

### Phase 1.5: Export/Import Features

**Mục tiêu**: Enable bulk operations với Excel import/export.

**Current State Analysis:**
```javascript
// Dashboard có export CSV nhưng chỉ cho summary data
// Không có import functionality
// Classes page không có export
```

**Proposed Solution:**

```typescript
// Export Features
1. Export Classes List to Excel
   - All fields including nested data (course name, teacher name, etc.)
   - Apply current filters
   - Custom column selection

2. Export Class Detail Report
   - Student list with payment status
   - Attendance summary
   - Grade report
   - Combined PDF report

// Import Features
1. Import Classes from Excel Template
   - Download template with required columns
   - Validate data before import
   - Preview import results
   - Bulk create with conflict resolution
```

**Implementation Tasks:**

1. **Install Export Library**
   ```bash
   npm install xlsx @tanstack/react-table
   ```

2. **Create ExportButton Component**
   ```javascript
   <ExportButton
     data={filteredClasses}
     filename="classes_export"
     columns={selectedColumns}
     format="xlsx" // or "csv"
   />
   ```

3. **Create ImportModal Component**
   - File upload input
   - Template download button
   - Validation results table
   - Import progress bar

4. **Backend API**
   ```javascript
   POST /api/classes/import
   Body: FormData with Excel file
   
   Response: {
     success: number,
     failed: number,
     errors: [{row, field, message}]
   }
   ```

**Acceptance Criteria:**
- [ ] Export includes all visible columns
- [ ] Import validates all fields
- [ ] Error messages are clear and actionable
- [ ] Large files (1000+ rows) handled efficiently
- [ ] Transaction safety (rollback on critical errors)

---

## III. PHASE 2: NÂNG CAO (Ưu tiên TRUNG BÌNH)

### Phase 2.1: Student Performance Tracking

**Mục tiêu**: Thêm analytics chi tiết cho từng học viên trong lớp.

**Proposed Features:**
```typescript
// StudentPerformanceCard Component

interface StudentPerformance {
  attendanceRate: number;     // 85%
  averageGrade: number;        // 7.5/10
  rank: number;                // #15/30
  trend: 'improving' | 'declining' | 'stable';
  alerts: {
    lowAttendance: boolean;    // < 80%
    failingGrade: boolean;     // < 5.0
    noPayment: boolean;
  };
  recentActivity: {
    lastAttendance: Date;
    lastGradeUpdate: Date;
  };
}
```

**Implementation:**
- Add "Performance" subtab in StudentsTab
- Individual student performance modal
- Batch alerts for students at risk

---

### Phase 2.2: Grade Analytics & Visualization

**Mục tiêu**: Visual analytics cho điểm số của lớp.

**Proposed Charts:**
1. **Grade Distribution Histogram** - Phân bố điểm
2. **Component Breakdown** - So sánh các component điểm
3. **Top Performers List** - Học viên xuất sắc
4. **Trend Over Time** - Xu hướng điểm qua các kỳ

**Implementation:**
- New subtab "Analytics" in GradesTab
- Interactive charts with drill-down
- Export grade analytics report

---

### Phase 2.3: Communication Tools

**Mục tiêu**: Gửi thông báo và email hàng loạt.

**Features:**
```typescript
// AnnouncementModal Component

interface Announcement {
  subject: string;
  message: string;
  recipients: 'all' | 'selected' | 'filtered';
  channels: ('email' | 'sms' | 'in-app')[];
  attachments?: File[];
  scheduleTime?: Date;
}
```

**Implementation:**
- Announcement composer with rich text editor
- Recipient selection (all students, selected, or filtered)
- Email templates library
- Send history and delivery status

---

### Phase 2.4: Document Management

**Mục tiêu**: Quản lý tài liệu lớp học.

**Features:**
1. Class documents folder
2. Session-specific materials
3. Shared resources library
4. Version control for syllabus

**Implementation:**
- Integrate với features/documents module hiện có
- Add documents subtab to ClassDetailPage
- Upload/download/preview functionality

---

### Phase 2.5: Comprehensive Reports

**Mục tiêu**: Hệ thống báo cáo toàn diện.

**Report Types:**
1. **Attendance Report** - Weekly/monthly attendance summary
2. **Grade Report** - Final grades with breakdown
3. **Financial Report** - Payment status by class
4. **Progress Report** - Overall class progress

**Implementation:**
- Report template system
- PDF generation với charts
- Automated email reports (scheduled)
- Report history archive

---

## IV. TIMELINE & RESOURCE ESTIMATE

### Phase 1 (6-8 weeks)
- **Week 1-2**: Advanced Filters + Backend APIs
- **Week 3-4**: Calendar View + Recurring Builder
- **Week 5-6**: Analytics Dashboard
- **Week 7-8**: Export/Import + Testing

### Phase 2 (8-10 weeks)
- **Week 1-3**: Student Performance + Grade Analytics
- **Week 4-6**: Communication Tools + Document Management
- **Week 7-10**: Reports System + Integration Testing

### Resource Requirements
- 1 Full-stack Developer (primary)
- 1 Frontend Developer (Phase 1)
- 1 UI/UX Designer (consultation)
- 1 QA Engineer (testing phase)

---

## V. TECHNICAL SPECIFICATIONS

### Frontend Stack (Unchanged)
- React 18+ with hooks
- Tailwind CSS for styling
- Existing component library
- React Router for navigation

### New Dependencies (Minimal)
```json
{
  "xlsx": "^0.18.5",          // Excel export/import
  "date-fns": "^2.30.0",      // Date manipulation (might exist)
  "recharts": "^2.10.0"       // Alternative if needed (but prefer existing charts)
}
```

### Backend Enhancements
- New API endpoints (documented above)
- Database indexes for performance
- Caching for analytics queries

### Performance Targets
- Page load: < 2s
- Filter/search: < 500ms
- Export 1000 records: < 5s
- Calendar render: < 1s

---

## VI. RISK MITIGATION

### Technical Risks
1. **Calendar Performance with 1000+ sessions**
   - Mitigation: Virtual scrolling, pagination
   
2. **Excel Import Data Validation**
   - Mitigation: Comprehensive server-side validation, dry-run mode

3. **Chart Rendering Performance**
   - Mitigation: Data sampling for large datasets, lazy loading

### Business Risks
1. **User Adoption of New Features**
   - Mitigation: Gradual rollout, training videos, in-app guides
   
2. **Data Migration**
   - Mitigation: No schema changes required, backward compatible

---

## VII. SUCCESS METRICS

### Quantitative KPIs
- 80% of users adopt Calendar View within 1 month
- 50% reduction in manual session creation time
- 90% of classes use analytics dashboard monthly
- 100+ bulk imports successfully completed

### Qualitative Goals
- Improved user satisfaction scores
- Reduced support tickets for class management
- Faster class setup workflow

---

## VIII. NEXT STEPS

### Immediate Actions
1. ✅ Review and approve this development plan
2. ⏳ Finalize Phase 1 detailed specifications
3. ⏳ Set up development environment and task tracking
4. ⏳ Begin Phase 1.1 (Advanced Filters) implementation