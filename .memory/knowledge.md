# Skill Master - Knowledge Base

## Schema Gotchas

### GOTCHA-001: Indirect Student Relationships
**Category**: gotcha
**Tags**: database, schema, student-portal
**Date**: 2026-01-31

Many tables don't have direct `student_id` - they go through `enrollments`:

```
grades.enrollment_id → enrollments.id → enrollments.student_id
attendance.enrollment_id → enrollments.id → enrollments.student_id
```

**WRONG:**
```javascript
.from('grades').eq('student_id', studentId)  // ❌ column doesn't exist
.from('attendance').eq('student_id', studentId)  // ❌ column doesn't exist
```

**CORRECT:**
```javascript
.from('grades')
.select(`*, enrollment:enrollments!inner(id, student_id, class:classes(...))`)
.eq('enrollment.student_id', studentId)  // ✅ join via enrollments

.from('attendance')
.select(`*, enrollment:enrollments!inner(id, student_id, class:classes(...))`)
.eq('enrollment.student_id', studentId)  // ✅ join via enrollments
```

**Citations**:
- `database/01_schema.sql` lines 116-154 (enrollments, attendance tables)
- `database/05_grades_tables.sql` lines 32-52 (grades table)

---

### GOTCHA-002: Schedule Field is JSON String
**Category**: gotcha
**Tags**: database, json, parsing
**Date**: 2026-01-31

The `schedule` field in `classes` table is stored as JSON string, not array.

**WRONG:**
```javascript
const schedule = classData.schedule;  // ❌ might be string
schedule.forEach(...)  // ❌ crashes if string
```

**CORRECT:**
```javascript
const parseSchedule = (schedule) => {
  if (!schedule) return [];
  if (Array.isArray(schedule)) return schedule;
  if (typeof schedule === 'string') {
    try { return JSON.parse(schedule); } catch { return []; }
  }
  return [];
};
const schedule = parseSchedule(classData.schedule);  // ✅ always array
```

**Citations**:
- `backend/src/index.js` lines 19160-19170 (parseSchedule helper)

---

### GOTCHA-003: Radix UI Select Empty Value
**Category**: gotcha
**Tags**: frontend, radix-ui, select
**Date**: 2026-01-31

Radix UI `<SelectItem>` does NOT allow empty string `value=""` - causes crash.

**WRONG:**
```jsx
<SelectItem value="">All Items</SelectItem>  // ❌ crashes
const [filter, setFilter] = useState('');
```

**CORRECT:**
```jsx
<SelectItem value="all">All Items</SelectItem>  // ✅ use "all"
const [filter, setFilter] = useState('all');

// Filter logic
const filtered = filter && filter !== 'all' 
  ? items.filter(x => x.id === filter) 
  : items;
```

**Citations**:
- `frontend/src/features/student-portal/pages/StudentGrades.jsx`
- `frontend/src/features/student-portal/pages/StudentSchedule.jsx`
- `frontend/src/features/student-portal/pages/StudentAttendance.jsx`

---

### GOTCHA-004: .toFixed() on Already-Formatted Strings
**Category**: gotcha
**Tags**: frontend, javascript, type-safety
**Date**: 2026-01-31

Backend may return numbers already formatted as strings. Calling `.toFixed()` on string crashes.

**WRONG:**
```javascript
{value?.toFixed(1)}  // ❌ crashes if value is "8.5" string
```

**CORRECT:**
```javascript
// Option 1: Type check
{typeof value === 'number' ? value.toFixed(1) : (value ?? 'N/A')}

// Option 2: Just display (if backend already formats)
{value ?? 'N/A'}
```

**Citations**:
- `frontend/src/features/student-portal/pages/StudentGrades.jsx`
- `frontend/src/features/student-portal/pages/StudentAttendance.jsx`

---

## Patterns

### PATTERN-001: Backend Response Transformation
**Category**: pattern
**Tags**: backend, api, frontend-integration
**Date**: 2026-01-31

When backend data structure differs from frontend expectations, transform in backend:

```javascript
// Transform records for frontend (add fields at top level)
const transformedRecords = dbRecords.map(r => ({
  id: r.id,
  status: r.status,
  // Flatten nested data for easier frontend access
  class_id: r.session?.class?.id || r.enrollment?.class?.id,
  class_name: r.session?.class?.name || r.enrollment?.class?.name,
  // Keep original nested for advanced use
  session: r.session
}));

res.json({ success: true, data: { records: transformedRecords } });
```

---

### PATTERN-002: Field Naming Conventions
**Category**: pattern
**Tags**: api, naming, frontend
**Date**: 2026-01-31

Frontend expects specific field names. Always check component usage:

| Frontend Expects | Backend Must Provide |
|------------------|---------------------|
| `totalSessions` | Not just `total` |
| `presentCount` | Not just `present` |
| `absentCount` | Not just `absent` |
| `attendanceRate` | Number, not string |
| `class_id` | At top level, not nested |
| `class_name` | At top level, not nested |

---

## Day Mapping

### CONFIG-001: Day Number Convention
**Category**: config
**Tags**: schedule, calendar
**Date**: 2026-01-31

Day mapping follows Vietnamese convention:
- 2 = Monday (Thứ 2)
- 3 = Tuesday (Thứ 3)
- 4 = Wednesday (Thứ 4)
- 5 = Thursday (Thứ 5)
- 6 = Friday (Thứ 6)
- 7 = Saturday (Thứ 7)
- 8 = Sunday (Chủ nhật)

**NOT** JavaScript's `getDay()` (0=Sunday, 1=Monday, etc.)

---

### GOTCHA-005: Non-Existent Columns in Select
**Category**: gotcha
**Tags**: database, supabase, schema
**Date**: 2026-01-31

Backend queries may reference columns that don't exist in the actual schema.

**Examples found:**
- `courses.color` - doesn't exist (use frontend color generation instead)
- `invoices.invoice_type` - doesn't exist
- `payments.status` - doesn't exist
- `certificates.certificate_code` - should be `certificate_number`
- `certificates.issue_date` - should be `issued_at`

**Best Practice:**
Always verify column names against actual SQL schema files before writing queries:
```bash
grep -n "column_name" database/*.sql
```

**Citations**:
- `database/01_schema.sql` (courses table lines 67-85 - no color field)
- `database/04_invoices.sql` (invoices/payments tables)
- `database/18_documents_certificates_support.sql` (certificates table)
