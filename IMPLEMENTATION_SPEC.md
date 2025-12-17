# 🎯 SKILL MASTER - IMPLEMENTATION SPECIFICATION
**Version:** 1.0  
**Date:** 2025-12-15  
**Timeline:** 6 weeks (1.5 months)  
**Mode:** Solo Development  
**Deployment:** Internal Use (Non-SaaS)  
**Infrastructure:** Supabase Free Tier

---

## 📋 EXECUTIVE SUMMARY

### Project Goal
Transform Skill Master from a **generic management system** into a **specialized training center platform** with domain-aware features for language and IT training centers.

### Core Problem
Current system lacks domain-specific logic:
- ❌ Courses have no type/category structure (Language vs IT vs Office)
- ❌ Teachers have no specialization tracking
- ❌ Students have no learning profiles or placement tests
- ❌ No prerequisite validation for course enrollment
- ❌ Certificate eligibility is manually checked
- ❌ Enrollment workflow has duplicate entry points

### Solution Approach
Implement **SIMPLE, DIRECT** domain logic enhancements following **KISS** and **YAGNI** principles:
- ✅ Add 4 columns to courses table (course_type, sub_category, skill_level, prerequisite_course_id)
- ✅ Add 1 JSONB column to users table for teacher specializations
- ✅ Add 2 columns to users table for student profiles (learning_goal, placement_test_result)
- ✅ Create simple validation APIs (no complex AI or over-engineering)
- ✅ Update frontend forms with new fields

---

## 🎯 EARS-FORMATTED REQUIREMENTS

### R1: Course Taxonomy
**WHEN** an admin creates or edits a course  
**THE SYSTEM SHALL** require selection of course_type (language/office/programming/soft_skill), sub_category (ielts/toeic/excel/word/python), and skill_level (beginner/intermediate/advanced)

**WHEN** an admin selects a prerequisite course  
**THE SYSTEM SHALL** only allow selection of courses with lower or equal skill_level in the same sub_category

### R2: Teacher Specializations
**WHEN** an admin views a teacher profile  
**THE SYSTEM SHALL** display a list of specializations with proficiency levels stored in JSONB format

**WHEN** an admin creates a class  
**THE SYSTEM SHALL** filter the teacher dropdown to show only teachers with matching specializations for the selected course type

### R3: Student Learning Profiles
**WHEN** an admin views a student profile  
**THE SYSTEM SHALL** display learning_goal (text) and placement_test_result (JSONB with skill assessments)

**WHEN** an admin enrolls a student in a course  
**THE SYSTEM SHALL** suggest appropriate courses based on placement test results and completed prerequisites

### R4: Prerequisite Validation
**WHEN** an admin attempts to enroll a student in a course with prerequisites  
**THE SYSTEM SHALL** check if the student has completed the prerequisite course and display a warning if not

**WHEN** a prerequisite warning is displayed  
**THE SYSTEM SHALL** allow admin to override and proceed with enrollment (soft validation)

### R5: Certificate Eligibility
**WHEN** an admin attempts to issue a certificate  
**THE SYSTEM SHALL** auto-calculate attendance rate and average grade and display eligibility status

**WHEN** eligibility requirements are not met  
**THE SYSTEM SHALL** display clear warning with actual vs required values and allow admin override

---

## 🗄️ DATABASE SCHEMA CHANGES

### Migration 22: Course Taxonomy
```sql
ALTER TABLE courses 
  ADD COLUMN course_type TEXT CHECK (course_type IN ('language', 'office', 'programming', 'soft_skill')),
  ADD COLUMN sub_category TEXT,
  ADD COLUMN skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
  ADD COLUMN prerequisite_course_id UUID REFERENCES courses(id);

CREATE INDEX idx_courses_type ON courses(course_type);
CREATE INDEX idx_courses_subcategory ON courses(sub_category);
CREATE INDEX idx_courses_level ON courses(skill_level);
```

### Migration 23: Teacher Specializations
```sql
ALTER TABLE users 
  ADD COLUMN specializations JSONB DEFAULT '[]';

-- Example structure:
-- [
--   {"code": "ielts_speaking", "proficiency": "advanced"},
--   {"code": "toeic_listening", "proficiency": "intermediate"}
-- ]
```

### Migration 24: Student Profiles
```sql
ALTER TABLE users 
  ADD COLUMN learning_goal TEXT,
  ADD COLUMN placement_test_result JSONB;

-- Example placement_test_result:
-- {
--   "english_level": "intermediate",
--   "target_score": "IELTS 7.0",
--   "test_date": "2025-12-01",
--   "skills": {
--     "speaking": 5.5,
--     "listening": 6.0,
--     "reading": 6.5,
--     "writing": 5.0
--   }
-- }
```

---

## 🔌 API SPECIFICATIONS

### Updated Endpoints

#### POST /api/courses
**New Fields:**
- `course_type` (required): "language" | "office" | "programming" | "soft_skill"
- `sub_category` (optional): string (e.g., "ielts", "excel")
- `skill_level` (required): "beginner" | "intermediate" | "advanced"
- `prerequisite_course_id` (optional): UUID

#### PUT /api/courses/:id
**Same new fields as POST**

#### GET /api/courses/:id/prerequisites
**Response:**
```json
{
  "has_prerequisite": true,
  "prerequisite": {
    "id": "uuid",
    "title": "Basic Excel",
    "code": "EXCEL-101"
  }
}
```

#### GET /api/teachers/by-specialization
**Query Params:**
- `course_type`: string
- `specialization`: string (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "specializations": [
        {"code": "ielts_speaking", "proficiency": "advanced"}
      ]
    }
  ]
}
```

#### GET /api/students/:id/recommended-courses
**Response:**
```json
{
  "success": true,
  "data": {
    "recommended": [
      {
        "id": "uuid",
        "title": "IELTS Intermediate",
        "reason": "Matches your placement test level (intermediate)",
        "priority": "high"
      }
    ],
    "prerequisites_needed": [
      {
        "id": "uuid",
        "title": "Advanced Excel",
        "missing_prerequisite": "Basic Excel"
      }
    ]
  }
}
```

#### GET /api/students/:id/certificate-eligibility/:certificateId
**Response:**
```json
{
  "success": true,
  "data": {
    "eligible": false,
    "attendance_rate": 75.5,
    "required_attendance": 80.0,
    "average_grade": 6.8,
    "required_grade": 7.0,
    "warnings": [
      "Attendance rate below requirement (75.5% < 80%)",
      "Average grade below requirement (6.8 < 7.0)"
    ]
  }
}
```

---

## 🎨 FRONTEND CHANGES

### Course Management

#### CreateCourseModal.jsx / EditCourseModal.jsx
**New Form Fields:**
1. **Course Type** (dropdown)
   - Options: Language, Office Software, Programming, Soft Skills
   - Required field

2. **Sub-Category** (text input)
   - Placeholder: "e.g., IELTS, TOEIC, Excel, Python"
   - Optional field

3. **Skill Level** (dropdown)
   - Options: Beginner, Intermediate, Advanced
   - Required field

4. **Prerequisite Course** (searchable dropdown)
   - Shows courses with same/lower skill level
   - Optional field

#### CourseTable.jsx
**New Display Columns:**
- Course Type badge (colored by type)
- Skill Level badge
- Prerequisite indicator (if exists)

### Teacher Management

#### StaffDetailPage.jsx
**New Section: Specializations**
- Display list of specializations with proficiency badges
- Add/Edit button opens modal
- Each specialization shows: code, proficiency level, actions

**SpecializationsModal Component:**
- Form to add new specialization
- Dropdown for specialization code
- Dropdown for proficiency (beginner/intermediate/advanced/all)
- List of existing specializations with delete option

### Student Management

#### StudentDetailPage.jsx
**New Section: Learning Profile**
- Learning Goal (textarea, editable)
- Placement Test Results (display only, edit via modal)
- Button to "Record Placement Test"

**PlacementTestModal Component:**
- Test date picker
- Target goal input (e.g., "IELTS 7.0")
- Skill assessments (speaking, listening, reading, writing)
- Overall level dropdown (beginner/intermediate/advanced)

### Enrollment Workflow

#### NewEnrollmentPage.jsx
**Enhanced Flow:**
1. Select Student → Show placement test summary
2. Select Class → Show course details with prerequisites
3. **NEW: Prerequisite Check Panel**
   - Green check: Prerequisites met
   - Yellow warning: Prerequisites not met (allow override)
   - Course recommendations based on profile
4. Confirm Enrollment

---

## 🔒 SECURITY CONSIDERATIONS

### Research Findings
1. **JSONB Performance**: Supabase/PostgreSQL handles JSONB efficiently for < 1000 records
2. **RLS Compatibility**: New columns automatically inherit existing RLS policies
3. **Input Validation**: All new fields validated server-side with Joi schemas
4. **SQL Injection**: Using parameterized queries for all new endpoints

### Security Measures
- ✅ All new columns have CHECK constraints
- ✅ Foreign key constraints for prerequisite_course_id
- ✅ JSONB validation in backend before insert/update
- ✅ CENTER_MANAGER role filters apply to all new queries
- ✅ No sensitive data in JSONB fields

---

## 📊 IMPLEMENTATION PRIORITY

### Week 1: Requirements & Research ⭐⭐⭐⭐⭐
- Complete EARS requirements for all features
- Research security best practices
- Analyze existing codebase patterns

### Week 2: Database Migrations ⭐⭐⭐⭐⭐
- Create all migration files
- Test locally
- Create rollback scripts

### Week 3-4: Backend APIs ⭐⭐⭐⭐
- Update course CRUD endpoints
- Create validation endpoints
- Update teacher/student profile endpoints

### Week 4-5: Frontend UI ⭐⭐⭐⭐
- Update course forms
- Update teacher/student profile pages
- Enhance enrollment workflow

### Week 6: Testing & Deployment ⭐⭐⭐⭐⭐
- Comprehensive testing
- Bug fixes
- Documentation updates
- Production deployment

---

## 🎯 SUCCESS METRICS

### Functional Metrics
- ✅ All courses have course_type and skill_level
- ✅ All teachers have at least 1 specialization
- ✅ Prerequisite validation works for 100% of enrollments
- ✅ Certificate eligibility auto-check has < 1% error rate

### Performance Metrics
- ✅ Course filtering by type: < 200ms response time
- ✅ Teacher filtering by specialization: < 300ms response time
- ✅ Prerequisite validation: < 500ms response time
- ✅ Certificate eligibility check: < 1s response time

### User Experience Metrics
- ✅ Course creation time reduced by 0% (same fields, just organized)
- ✅ Enrollment error rate reduced by 80% (prerequisite warnings)
- ✅ Certificate issuance errors reduced by 90% (auto-check)

---

## 🚨 RISK MITIGATION

### Risk 1: Data Migration Issues
**Mitigation:**
- Backup database before migration
- Test migrations on staging first
- Create rollback scripts for all changes
- Document rollback procedure

### Risk 2: JSONB Performance
**Mitigation:**
- Start with JSONB for MVP (< 100 teachers)
- Monitor query performance
- Plan migration to separate table if needed (> 500 teachers)

### Risk 3: User Adoption
**Mitigation:**
- Keep UI changes minimal and intuitive
- Provide clear labels and help text
- Create user guide with screenshots
- Offer training session for admins

### Risk 4: Prerequisite Complexity
**Mitigation:**
- Start with single-level prerequisites only
- Use soft validation (warnings, not errors)
- Allow admin override for special cases
- Document prerequisite chains clearly

---

## 📝 NEXT STEPS

1. ✅ Review this specification with stakeholders
2. ⏳ Begin Phase 1: Requirements Analysis (Week 1)
3. ⏳ Create database migration files (Week 2)
4. ⏳ Implement backend APIs (Week 3-4)
5. ⏳ Update frontend UI (Week 4-5)
6. ⏳ Test and deploy (Week 6)

---

**Status:** ✅ SPECIFICATION COMPLETE - READY FOR IMPLEMENTATION
**Next Action:** Begin Phase 1 - Requirements Analysis & Research


