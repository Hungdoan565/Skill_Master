# 🛡️ MASTER CHECKLIST - COMMON PITFALLS

> Đây là tổng hợp các lỗi thường gặp trong dự án Skill Master LMS.
> Luôn review checklist này trước khi code và commit.

---

## 🔴 CRITICAL BUGS CATALOG

### BUG #1: API Endpoint Mismatch
```javascript
// ❌ WRONG: Frontend gọi /bulk, backend chỉ có /batch
await api.post('/api/admin/enrollments/bulk');

// ✅ FIX: Grep backend trước
await api.post('/api/admin/enrollments/batch');
```
**Checklist:** `grep -r "enrollments/" backend/src` trước khi code

---

### BUG #2: Object Key Mismatch
```javascript
// ❌ WRONG: Assume plural
classItem.teachers?.full_name

// ✅ FIX: Multi-key fallback
classItem.teacher?.full_name || 
classItem.teachers?.full_name || 
classItem.users?.full_name || 
'Chưa phân công'
```
**Checklist:** Log API response để confirm structure

---

### BUG #3: Filter Quá Chặt
```javascript
// ❌ WRONG: Filter cố định
params.append('status', 'active');

// ✅ FIX: Exclude thay vì include
const classes = data.filter(c => 
  c.status !== 'cancelled' && 
  c.status !== 'completed'
);
```
**Checklist:** Test với data thật trong DB

---

### BUG #4: Race Condition
```javascript
// ❌ WRONG: Không cleanup
useEffect(() => {
  fetchData();
}, []);

// ✅ FIX: AbortController
useEffect(() => {
  const controller = new AbortController();
  fetchData(controller.signal);
  return () => controller.abort();
}, []);
```

---

### BUG #5: Silent Fail
```javascript
// ❌ WRONG: Chỉ log
catch (error) {
  console.log(error);
}

// ✅ FIX: Notify user + log
catch (error) {
  toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
  logger.error('API Error:', error);
}
```

---

### BUG #6: N+1 Query
```javascript
// ❌ WRONG: Query trong loop
students.forEach(async s => {
  const classes = await getClassesByStudent(s.id);
});

// ✅ FIX: Eager loading
const studentsWithClasses = await getStudentsWithClasses();
```

---

### BUG #7: Timezone Issues
```javascript
// ❌ WRONG: Local time
new Date(data.start_date)

// ✅ FIX: ISO format
new Date(data.start_date).toISOString()
// Hoặc dùng dayjs/date-fns
```

---

## ✅ MASTER CHECKLIST

### Phase 1: Design
- [ ] Vẽ flow diagram (user journey)
- [ ] List tất cả edge cases
- [ ] Thiết kế error handling strategy
- [ ] Review API contract với backend

### Phase 2: Implementation

#### API Integration
- [ ] Grep backend tìm exact endpoint
- [ ] Log response structure trong dev
- [ ] Handle tất cả HTTP status codes (400, 401, 403, 404, 409, 500)
- [ ] Implement retry logic cho network errors

#### Data Handling
- [ ] Multi-key fallback cho API response
- [ ] Type checking trước khi access nested props
- [ ] Null/undefined checks
- [ ] Default values cho optional fields

#### State Management
- [ ] Cleanup useEffect (AbortController)
- [ ] Handle race conditions
- [ ] Optimistic updates cho UX
- [ ] Loading/error states

#### Validation
- [ ] Frontend validation (UX - nhanh)
- [ ] Backend validation (Security - bắt buộc)
- [ ] Sanitize user input
- [ ] Check permissions

#### Performance
- [ ] Pagination cho list lớn (>100 items)
- [ ] Debounce search/filter (300-500ms)
- [ ] Lazy loading components
- [ ] Memoize expensive calculations

### Phase 3: Testing
- [ ] Test với data thật (không chỉ mock)
- [ ] Test edge cases (empty, null, special chars)
- [ ] Test concurrent actions
- [ ] Test trên nhiều browsers
- [ ] Test responsive trên mobile

### Phase 4: Security
- [ ] Không log sensitive data (password, token)
- [ ] Sanitize user input (XSS prevention)
- [ ] Check permissions trước render
- [ ] HTTPS trong production
- [ ] Rate limiting cho API calls

### Phase 5: UX
- [ ] Loading indicators
- [ ] Error messages rõ ràng (không technical jargon)
- [ ] Success confirmations
- [ ] Keyboard accessibility
- [ ] Mobile-friendly

---

## 📋 CODE REVIEW TEMPLATE

```markdown
## PR Review Checklist:
- [ ] API endpoints match với backend?
- [ ] Error handling đầy đủ?
- [ ] Có test cases không?
- [ ] UX messages rõ ràng?
- [ ] Performance có vấn đề không?
- [ ] Security có lỗ hổng không?
```

---

## 📊 EXPECTED RESULTS

| Metric | Before | After Checklist |
|--------|--------|-----------------|
| Bug rate | High | -80% |
| Debug time | Long | -50% |
| Code quality | 6/10 | 9/10 |
| UX quality | Basic | Professional |

---

---

*Last updated: 2026-01-05*

---

## 🎨 FRONTEND UI/UX CRITICAL BUGS

### BUG #8: Layout Shift (CLS)
```jsx
// ❌ Image không có width/height → layout nhảy
<img src={avatar} alt="Avatar" />

// ✅ Reserve space + skeleton
<img src={avatar} width={40} height={40} className="object-cover" />
{loading && <Skeleton className="w-10 h-10" />}
```

### BUG #9: No Loading State
```jsx
// ❌ List hiện blank khi loading
return students.map(s => <Card {...s} />);

// ✅ Loading state đầy đủ
if (loading) return <Skeleton />;
if (!students.length) return <EmptyState />;
return students.map(s => <Card {...s} />);
```

### BUG #10: Form Submit Without Feedback
```jsx
// ❌ User không biết form đang submit
await api.create(data);

// ✅ Disable button + loading text + toast
<button disabled={submitting}>
  {submitting ? 'Đang lưu...' : 'Lưu'}
</button>
```

### BUG #11: No Empty State
```jsx
// ❌ List rỗng hiện blank
{students.map(...)}

// ✅ Empty state với CTA
{students.length === 0 ? (
  <EmptyState title="Chưa có học viên" action={<Button>Thêm mới</Button>} />
) : students.map(...)}
```

### BUG #12: Poor Error Display
```jsx
// ❌ Generic message
toast.error('Có lỗi');

// ✅ Specific theo HTTP code
const messages = {
  409: 'Email đã tồn tại',
  403: 'Không có quyền',
  500: 'Lỗi hệ thống'
};
toast.error(messages[error.status] || 'Có lỗi');
```

### BUG #13: No Confirmation
```jsx
// ❌ Delete trực tiếp
<button onClick={delete}>Xóa</button>

// ✅ Confirm dialog
<AlertDialog>
  <AlertDialogTrigger>Xóa</AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
    <AlertDialogAction onClick={delete}>Xóa</AlertDialogAction>
  </AlertDialogContent>
</AlertDialog>
```

### BUG #14-19: Mobile & Table Issues
- **BUG #14**: Desktop-only layout → `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- **BUG #15**: No keyboard nav → `tabIndex={0} onKeyDown`
- **BUG #16**: Modal không focus → `useRef + autofocus`
- **BUG #17**: Raw ISO date → `format(date, 'dd/MM/yyyy', {locale: vi})`
- **BUG #18**: No search feedback → "Tìm thấy {n} kết quả"
- **BUG #19**: Table overflow → `overflow-x-auto` + card view mobile

### BUG #20-25: UX Polish
- **BUG #20**: No optimistic UI → Update ngay, rollback nếu lỗi
- **BUG #21**: No undo → Toast với "Hoàn tác" button
- **BUG #22**: No labels → `<label htmlFor>` + error message
- **BUG #23**: Full page spinner → Skeleton phù hợp layout
- **BUG #24**: Poor contrast → ≥ 4.5:1 ratio
- **BUG #25**: No transition → CSS transition 200ms

---

## ✅ UI/UX CHECKLIST (Phases 6-11)

### Phase 6: Visual Design
- [ ] **Loading**: Skeleton cho lists, spinner cho pages, inline cho buttons
- [ ] **Empty**: Icon + title + CTA button
- [ ] **Error**: Specific messages + action
- [ ] **Success**: Toast + animation

### Phase 7: Interactions
- [ ] **Form**: Labels + inline validation + disabled submit
- [ ] **Confirm**: Dialog cho destructive actions + undo option
- [ ] **Keyboard**: Tab order + Enter/Esc + arrows

### Phase 8: Responsive
- [ ] **Breakpoints**: mobile 640px / tablet 1024px / desktop
- [ ] **Mobile**: Touch 44px / hamburger / bottom sheet
- [ ] **Layout**: Responsive grid + font + padding

### Phase 9: Performance
- [ ] **Images**: lazy + WebP + srcset + dimensions
- [ ] **Code**: Route splitting + dynamic imports
- [ ] **Optimize**: memo + virtualize + debounce

### Phase 10: Accessibility
- [ ] **Semantic**: `<button>` not `<div onClick>`
- [ ] **ARIA**: aria-label, aria-required, role=alert
- [ ] **Focus**: trap + autofocus + visible
- [ ] **Color**: ≥ 4.5:1 contrast

### Phase 11: Micro-interactions
- [ ] **Hover**: color change, shadow lift
- [ ] **Transitions**: fade in/out ≤ 300ms
- [ ] **Loading**: shimmer effect

---

## 📋 COMPLETE CODE REVIEW TEMPLATE

```markdown
## Logic Review:
- [ ] API endpoints match backend?
- [ ] Error handling đầy đủ?
- [ ] Race conditions handled?
- [ ] Validation double-layer?

## UI/UX Review:
- [ ] Loading/empty/error states?
- [ ] Destructive action confirm?
- [ ] Mobile responsive (375px)?
- [ ] Touch targets ≥ 44px?
- [ ] Keyboard navigation?
- [ ] Color contrast pass?
- [ ] Transitions smooth?
```

---

## 📊 FINAL METRICS

| Metric | Before | After Full Checklist |
|--------|--------|----------------------|
| Logic bug rate | High | -80% |
| UI/UX bug rate | High | -90% |
| Lighthouse score | 60 | 95+ |
| A11y score | 60 | 95+ |
| Mobile usability | 4/10 | 9/10 |

---

## 🛠️ RECOMMENDED TOOLS

- **Lighthouse** - Performance + A11y
- **axe DevTools** - Accessibility
- **React DevTools** - Re-renders
- **Storybook** - Component library
- **Chromatic** - Visual regression

---

## 🎭 ROLE-BASED UX INCONSISTENCIES

> **Chi tiết xem:** [docs/ROLE_UX_ISSUES.md](./docs/ROLE_UX_ISSUES.md)

### ROLE #1: QR Code Logic Mismatch
```jsx
// ❌ WRONG: Admin PaymentModal shows QR for admin to scan
// Admin là người THU tiền, không phải người CHUYỂN tiền
<VietQRSection qrUrl={...} /> // Trong PaymentModal.jsx

// ✅ CORRECT: QR chỉ nên hiển thị cho Student/Parent
// Student/Parent quét QR → Chuyển tiền → Upload proof
// Admin chỉ cần form xác nhận đã thu tiền
```
**Locations:** `PaymentModal.jsx`, `BulkPaymentModal.jsx`

### ROLE #2: Missing Parent Role
```jsx
// ❌ MISSING: Không có isParent() trong auth-context
const isParent = () => profile?.roles?.code === 'PARENT';

// ❌ MISSING: Không có ParentRoute
export function ParentRoute({ children }) {
  return <ProtectedRoute allowedRoles={['PARENT']}>{children}</ProtectedRoute>;
}
```
**Impact:** 1/5 user groups chưa được implement

### ROLE #3: Dashboard Not Role-Aware
```jsx
// ❌ PROBLEM: CENTER_MANAGER thấy UI giống SUPER_ADMIN
{isSuperAdmin?.() && <CenterSelector />}

// ✅ BETTER: Differentiate by role
{isSuperAdmin?.() && <CenterSelector />}
{isManager?.() && <SingleCenterHeader centerId={user.centerId} />}
```

### ROLE #4: Admin Can Access Teacher Pages
```jsx
// ⚠️ BY DESIGN but can cause confusion
allowedRoles={['TEACHER', 'SUPER_ADMIN', 'CENTER_MANAGER']}
// Admin vào trang teacher thấy UI design cho teacher workflow
```

### ROLE #5: Email-Based Role Detection (INSECURE)
```jsx
// ❌ DANGEROUS: Email không = database role
const isAdminEmail = user?.email?.includes('admin');
if (isAdminEmail && isAdminRoute) return children; // BYPASS!

// ✅ ALWAYS use database role
const isAdmin = profile?.roles?.code === 'SUPER_ADMIN';
```

---

### ✅ ROLE-BASED CHECKLIST

| Check | Question |
|-------|----------|
| [ ] | Component có check role trước khi render sensitive UI? |
| [ ] | QR/Payment flow đúng logic thực tế? (ai trả tiền, ai thu tiền) |
| [ ] | Dashboard hiển thị phù hợp với role? |
| [ ] | Admin features không bị exposed cho non-admin? |
| [ ] | Email-based detection đã được loại bỏ? |

---

*Total: 25 bug patterns | 11 phases | 5 role issues | 50+ checklist items*
