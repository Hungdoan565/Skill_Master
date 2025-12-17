# 📋 TỔNG HỢP VẤN ĐỀ & CÂU HỎI - SKILL MASTER

> **Ngày:** 15/12/2025  
> **Mục đích:** Tổng hợp 2 góc nhìn phân tích (Technical Workflow + Domain Logic) để xác định hướng phát triển

---

## 🔍 TÓM TẮT 2 GÓC NHÌN PHÂN TÍCH

### Góc nhìn 1️⃣: **Technical Workflow Review**
*Focus: Luồng dữ liệu, tính nhất quán, UX/UI*

**Phát hiện chính:**
- ✅ Các module cốt lõi hoàn chỉnh (Classes, Schedule, Invoices, Certificates, Payroll)
- ⚠️ Một số vấn đề về workflow consistency:
  - Enrollment → Invoice (2 entry points khác nhau)
  - Certificate eligibility check chưa tự động
  - Grades không liên kết với Sessions
  - Dashboard widgets cố định, chưa customizable

### Góc nhìn 2️⃣: **Domain-Specific Logic Review**
*Focus: Nghiệp vụ đặc thù trung tâm đào tạo Anh ngữ & Tin học*

**Phát hiện chính:**
- ✅ Technical implementation rất tốt
- ❌ **CRITICAL:** Thiếu logic nghiệp vụ đặc thù:
  - Courses không có phân loại rõ ràng (Language/IT, Level, Target)
  - Teachers không track specializations & certifications
  - Students không có placement test & learning goals
  - Không quản lý prerequisites giữa các khóa học

---

## 🚨 DANH SÁCH VẤN ĐỀ TỔNG HỢP

### 🔴 **CRITICAL PRIORITY** (Ảnh hưởng trực tiếp đến chất lượng đào tạo)

| # | Vấn đề | Tác động | Độ phức tạp |
|---|--------|----------|-------------|
| **1** | **Teacher Specializations** | GV có thể dạy sai chuyên môn → Chất lượng giảm | Medium |
| **2** | **Course Categories & Structure** | Không phân biệt được Anh ngữ/Tin học, Level | Low-Medium |
| **3** | **Course Prerequisites** | Học viên đăng ký sai cấp độ → Tỷ lệ bỏ học cao | Medium |

### 🟡 **HIGH PRIORITY** (Cải thiện UX/Workflow)

| # | Vấn đề | Tác động | Độ phức tạp |
|---|--------|----------|-------------|
| **4** | **Student Learning Profile** | Không tư vấn được khóa phù hợp | Medium |
| **5** | **Certificate Auto-Eligibility** | Admin có thể cấp CC sai điều kiện | Low |
| **6** | **Enrollment Workflow Consistency** | 2 entry points gây confusion | Low |
| **7** | **Document-Course Linkage** | Tài liệu không có cấu trúc Unit/Lesson | High |

### 🟢 **MEDIUM PRIORITY** (Nice to have)

| # | Vấn đề | Tác động | Độ phức tạp |
|---|--------|----------|-------------|
| **8** | **Session-Based Grades** | Không link điểm với buổi học cụ thể | Medium |
| **9** | **Dashboard Customization** | Widgets cố định, chưa linh hoạt | Medium |
| **10** | **Training-Specific Reports** | Thiếu Student Retention, Teacher Utilization | Low-Medium |

---

## 💡 CÁC GIẢI PHÁP ĐỀ XUẤT

### **Solution F: Domain-Aware Course Structure**
```sql
-- Thêm vào bảng courses
ALTER TABLE courses ADD COLUMN course_type TEXT; 
  -- 'language' | 'office' | 'programming' | 'design'
ALTER TABLE courses ADD COLUMN sub_category TEXT; 
  -- 'ielts', 'toeic', 'word', 'excel', 'python'...
ALTER TABLE courses ADD COLUMN skill_level TEXT;
  -- 'beginner' | 'intermediate' | 'advanced'
ALTER TABLE courses ADD COLUMN target_certificate TEXT;
  -- "IELTS 6.5", "MOS Expert", null
ALTER TABLE courses ADD COLUMN prerequisite_course_id UUID;
  -- Link đến khóa tiên quyết
```

**UI Impact:**
- Courses Page: Filter theo type, level
- Enrollment: Gợi ý khóa phù hợp với student profile
- Reports: Phân tích theo domain (Language vs IT)

---

### **Solution G: Teacher Specialization System**
```sql
-- Bảng mới
CREATE TABLE teacher_specializations (
  id UUID PRIMARY KEY,
  teacher_id UUID REFERENCES users(id),
  specialization TEXT NOT NULL,
    -- 'ielts_speaking', 'toeic_listening', 'excel_advanced'...
  proficiency_level TEXT,
    -- 'can_teach_beginner', 'can_teach_all'
  certification_name TEXT,
    -- 'TESOL', 'CELTA', 'MOS Master'
  certification_expiry DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**UI Impact:**
- Classes Page: Khi chọn course, filter teachers theo specialization
- Staff Page: Tab "Specializations" để quản lý
- Warning khi assign GV không match

---

### **Solution H: Student Learning Profile**
```sql
-- Thêm vào users/students
ALTER TABLE users ADD COLUMN learning_goal TEXT;
  -- "IELTS 7.0 for UK study", "Learn Python for job"
ALTER TABLE users ADD COLUMN placement_test_result JSONB;
  -- {"test_date": "2025-01-01", "english_level": "A2", ...}
ALTER TABLE users ADD COLUMN target_deadline DATE;
ALTER TABLE users ADD COLUMN recommended_course_ids UUID[];
```

**UI Impact:**
- Student Profile: Section "Learning Goals & Assessment"
- Enrollment: "Suggested Courses" dựa trên profile
- Reports: Track goal achievement rate

---

### **Solution C: Auto Certificate Eligibility Check** *(from previous analysis)*
```javascript
// Enhanced API validation
async function issueCertificate(studentId, certTypeId) {
  const certType = await getCertificateType(certTypeId);
  const requirements = certType.requirements;
  
  // Auto-check
  const attendanceRate = await getAttendanceRate(studentId);
  const avgGrade = await getAverageGrade(studentId);
  
  if (attendanceRate < requirements.min_attendance) {
    throw new Error(`Điểm danh chỉ ${attendanceRate}%, cần >= ${requirements.min_attendance}%`);
  }
  
  if (avgGrade < requirements.min_grade) {
    throw new Error(`Điểm TB chỉ ${avgGrade}, cần >= ${requirements.min_grade}`);
  }
  
  // Proceed if passed
}
```

---

### **Solution A: Smart Enrollment Wizard** *(from previous analysis)*
```
Step 1: Chọn/Tạo học viên
  └─ Nếu có placement_test_result → Gợi ý courses phù hợp

Step 2: Chọn lớp
  └─ Filter by: course type, level, schedule
  └─ Hiển thị: Prerequisites warning nếu chưa học khóa trước

Step 3: Confirm học phí
  └─ Auto-calculate from course.price
  └─ Apply discount rules

Step 4: Auto-create invoice
  └─ No checkbox, always create (enforced)

Step 5 (Optional): Quick payment
  └─ Thu tiền ngay sau enrollment
```

---

## ❓ CÂU HỎI CHO BẠN

### 📌 **PHẦN 1: VỀ NGHIỆP VỤ THỰC TẾ**

#### Q1. Course Prerequisites Enforcement
Khi học viên muốn đăng ký "IELTS Advanced" nhưng chưa học "IELTS Foundation":

- [ ] A. **Block cứng** - Không cho đăng ký, bắt buộc phải học Foundation trước
- [ ] B. **Warning nhưng cho phép** - Admin thấy cảnh báo nhưng vẫn có thể override
- [ ] C. **Chỉ recommend** - Chỉ hiển thị gợi ý, không enforce

**Trả lời:** ____

**Lý do/Bổ sung:** _______________________________________________

---

#### Q2. Teacher Assignment Logic
Khi tạo lớp "IELTS Speaking Advanced" nhưng không có GV nào có specialization = "ielts_speaking":

- [ ] A. **Block** - Không cho tạo lớp, bắt buộc phải có GV match
- [ ] B. **Warning** - Hiển thị warning nhưng vẫn cho chọn GV khác
- [ ] C. **Suggest closest** - Gợi ý GV có specialization gần nhất (VD: ielts_general)
- [ ] D. **Không cần check** - Tin tưởng Admin sẽ chọn đúng

**Trả lời:** ____

**Lý do/Bổ sung:** _______________________________________________

---

#### Q3. Student Placement Test Input
Kết quả placement test được nhập vào hệ thống bằng cách nào?

- [ ] A. **Admin nhập thủ công** sau khi test offline
- [ ] B. **Tích hợp online test** (future feature, cần build test module)
- [ ] C. **Import từ Excel** - Bulk import nhiều học viên
- [ ] D. **Học viên tự nhập** trên portal (self-service)

**Trả lời:** ____

**Workflow hiện tại:** _______________________________________________

---

#### Q4. Invoice Creation Policy
Hiện tại có 2 cách tạo enrollment:
1. Từ `/admin/enrollments/new` (có checkbox "Tạo invoice tự động")
2. Từ Class Detail page "Add Student" (cũng tạo invoice)

Bạn muốn:

- [ ] A. **Bắt buộc tạo invoice** mỗi khi enrollment (remove checkbox)
- [ ] B. **Giữ nguyên** - Vẫn có option (một số TH không cần invoice ngay)
- [ ] C. **Chuyển sang invoice status** - Luôn tạo nhưng để status="draft" nếu chưa confirm

**Trả lời:** ____

**Lý do:** _______________________________________________

---

#### Q5. Certificate Eligibility Enforcement
Khi Admin muốn cấp chứng chỉ cho học viên chưa đủ điểm danh/điểm số:

- [ ] A. **Block hoàn toàn** - Không cho cấp, hiển thị lý do cụ thể
- [ ] B. **Warning + require reason** - Cho phép override nhưng phải nhập lý do
- [ ] C. **Không check** - Tin tưởng Admin

**Trả lời:** ____

**Lý do:** _______________________________________________

---

#### Q6. Document Access Control
Tài liệu của khóa học nên được quản lý thế nào?

- [ ] A. **Public preview** - Học viên chưa đăng ký vẫn xem được để tham khảo
- [ ] B. **Enrolled only** - Chỉ học viên đã ghi danh mới xem được
- [ ] C. **Progressive unlock** - Unlock theo tiến độ (hoàn thành Unit 1 mới mở Unit 2)
- [ ] D. **Admin control** - Admin quyết định từng document

**Trả lời:** ____

**Lý do:** _______________________________________________

---

### 📌 **PHẦN 2: VỀ DỮ LIỆU HIỆN CÓ**

#### Q7. Teacher Specializations Data
Bạn có dữ liệu về chuyên môn của GV hiện tại không?

- [ ] A. **Có sẵn trong Excel/docs** - Cần import vào DB
- [ ] B. **Chưa có, cần thu thập** - Phải làm form cho GV điền
- [ ] C. **Biết sơ bộ** - VD: 3 GV dạy IELTS, 2 GV dạy Tin học

**Trả lời:** ____

**Số lượng GV hiện tại:** ____ người

**Phân bố sơ bộ:** _______________________________________________

---

#### Q8. Course Structure Hiện Tại
Hiện tại bạn có bao nhiêu khóa học, phân bố thế nào?

**Số lượng courses:** ____ khóa

**Phân bố theo lĩnh vực (ước lượng):**
- Anh ngữ: ____ khóa (IELTS/TOEIC/Giao tiếp/...)
- Tin học: ____ khóa (Office/Lập trình/Thiết kế/...)
- Khác: ____ khóa

**Có khóa nào cần prerequisites không?** 
VD: "Advanced Excel" cần học "Basic Excel" trước?

_______________________________________________

---

### 📌 **PHẦN 3: VỀ ƯU TIÊN TRIỂN KHAI**

#### Q9. Priority Ranking
Xếp thứ tự ưu tiên các giải pháp (1 = urgent nhất, 5 = có thể làm sau):

- [ ] **F. Course Categories & Prerequisites** - Thứ tự: ____
- [ ] **G. Teacher Specializations** - Thứ tự: ____
- [ ] **H. Student Learning Profile** - Thứ tự: ____
- [ ] **C. Auto Certificate Eligibility Check** - Thứ tự: ____
- [ ] **A. Smart Enrollment Wizard** - Thứ tự: ____

**Giải thích lý do ưu tiên:** _______________________________________________

---

#### Q10. Resource & Timeline
**Thời gian dự kiến cho Phase 1:**
- [ ] A. 1-2 tuần (làm nhanh, chấp nhận đơn giản hóa)
- [ ] B. 2-3 tuần (cân bằng speed vs quality)
- [ ] C. 3-4 tuần (làm kỹ, test kỹ)
- [ ] D. Không gấp, có thể kéo dài

**Trả lời:** ____

**Có dev khác hỗ trợ không?** 
- [ ] Solo
- [ ] Có 1-2 người
- [ ] Team lớn hơn

---

### 📌 **PHẦN 4: VẤN ĐỀ KHÁC**

#### Q11. Issues từ vận hành thực tế
Ngoài các vấn đề đã liệt kê, bạn có gặp khó khăn nào khác trong thực tế vận hành không?

VD:
- Admin hay quên điểm danh?
- Reports thiếu số liệu nào?
- Students/Parents hay hỏi về thông tin gì mà hệ thống chưa có?

_______________________________________________
_______________________________________________
_______________________________________________

---

#### Q12. Must-Have vs Nice-to-Have
Trong tất cả các tính năng đề xuất, **tính năng nào bạn cần NHẤT** để giải quyết vấn đề đang gặp?

**Top 1 Must-Have:** _______________________________________________

**Lý do:** _______________________________________________

---

## 📊 BẢNG TỔNG HỢP ĐỀ XUẤT

### Roadmap dựa trên Priority

```
┌──────────────────────────────────────────────────────────────────┐
│  PHASE 1: Critical Domain Logic (2-3 tuần)                      │
├──────────────────────────────────────────────────────────────────┤
│  ✅ Solution G: Teacher Specializations                         │
│     - DB: teacher_specializations table                         │
│     - UI: Staff page → Specializations tab                      │
│     - Logic: Filter teachers by course requirements            │
│                                                                  │
│  ✅ Solution F: Course Categories & Prerequisites               │
│     - DB: Add columns to courses table                          │
│     - UI: Course form with type/level selectors                │
│     - Logic: Prerequisites validation                           │
│                                                                  │
│  ✅ Solution H: Student Learning Profile                        │
│     - DB: Add columns to users table                            │
│     - UI: Student profile → Goals & Assessment section         │
│     - Logic: Course recommendations                             │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  PHASE 2: Workflow Enhancement (1-2 tuần)                       │
├──────────────────────────────────────────────────────────────────┤
│  ✅ Solution C: Auto Certificate Eligibility Check              │
│  ✅ Solution A: Smart Enrollment Wizard                         │
│  ✅ Enrollment-Invoice Consistency Fix                          │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  PHASE 3: Advanced Features (2-3 tuần)                          │
├──────────────────────────────────────────────────────────────────┤
│  ✅ Document-Course Linkage (Unit → Lesson structure)           │
│  ✅ Training-Specific Reports                                   │
│  ✅ Session-Based Grades (optional)                             │
│  ✅ Dashboard Customization (optional)                          │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🎯 NEXT STEPS

**Sau khi bạn trả lời các câu hỏi trên:**

1. Tôi sẽ tạo **Implementation Plan chi tiết** với:
   - Database migrations cụ thể
   - API endpoints cần thêm/sửa
   - UI components cần tạo
   - Test cases

2. Tạo **Task Breakdown** với estimate thời gian từng task

3. Nếu cần, tôi có thể **implement ngay** các phần ưu tiên cao nhất

---

**📝 Ghi chú:** Hãy điền trực tiếp vào file này hoặc trả lời riêng. Nếu cần clarify thêm câu hỏi nào, cứ hỏi tôi! 🚀
