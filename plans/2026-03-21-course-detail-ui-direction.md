# Course Detail UI Direction - Docker Course

Date: 2026-03-21
Status: Proposed
Owner: Architect

## 1. Current State Summary

### What works
- Public course detail page already fetches by slug, code, title fallback, UUID fallback.
- JSON fields are parsed for `syllabus`, `features`, `outcomes`, `faq`.
- Sections are conditionally shown when data exists.
- Theme engine already supports two visual families:
  - Tech categories: `programming`, `it`, `office`
  - Academic categories: `ielts`, `toeic`, `english`, `communication`

### Current UX issues
1. **Tech decoration is too literal and dominant**
   - Fake hexadecimal + READY WAITING lines read as real system data.
2. **Hero does not use course cover image**
   - Even when admin uploads image, the detail page hero does not display it.
3. **Hardcoded trust and urgency values**
   - New students `127+`, opening date `05/01/2025`, fixed class size `12` reduce trust.
4. **Empty data hides key sections entirely**
   - If arrays are empty, outcomes, syllabus, FAQ vanish instead of showing graceful placeholders.
5. **Content quality varies heavily by source**
   - Only some templates include rich syllabus/features/outcomes/faq.

## 2. Data Behavior Answer

### If admin fills fields, will they auto show?
Yes, mostly yes.
- `features`, `outcomes`, `syllabus`, `faq` render automatically when arrays are non-empty.

### If fields are empty, are there sample replacements?
- **At page level**: No robust fallback sections for empty arrays. Sections disappear.
- **At template level**: Mixed.
  - `IELTS Foundation` template has rich sample data.
  - Most other templates only fill basic metadata and description.
- **At DB migration level**: There are seeded samples for IELTS, TOEIC, office, programming, communication in SQL migrations, but this is not runtime fallback logic.
- **At form level**: `AI Magic Fill` can populate missing content if used.

## 3. Strategy Options

### Option A - Minimal bug-fix patch
- Remove or tone down fake code decoration.
- Add hero image usage.
- Keep everything else as-is.

Pros
- Fast and low-risk.
- Immediate visual improvement.

Cons
- Does not solve trust gaps, content empties, and inconsistency.

### Option B - Full visual redesign only
- Redesign entire page hierarchy, cards, typography, and spacing.
- Keep existing data logic mostly unchanged.

Pros
- Strong visual upgrade.

Cons
- Risks masking data quality problems.
- Higher regression surface.

### Option C - Structured uplift (recommended)
- Keep existing architecture and route behavior.
- Redesign above-the-fold and right rail for clarity + trust.
- Replace fake decoration with contextual media.
- Add robust empty-state content model by category.
- Keep dual-theme with shared layout and tokenized style differences.

Pros
- Best balance of quality, maintainability, and predictable delivery.
- Solves both visual and data experience issues.

Cons
- Broader scope than pure bug-fix.

## 4. Theme Direction

Recommendation: **Keep dual-theme** with a stronger shared system.

Why
- English and Tech audiences have different mental models and visual expectations.
- A single unified layout can preserve usability consistency while allowing themed identity.

How
- Share structure: same section order, CTA pattern, information architecture.
- Separate tokens only for:
  - color
  - accent iconography
  - decorative motif
  - select typography accents
- Remove hardcoded decorative text that looks like real data.

## 5. Proposed UX Standards for Course Detail

1. First screen answers quickly:
   - Who this course is for
   - What outcome learners get
   - Cost and enrollment action
   - Primary trust proof
2. Hero media must use real course image when available.
3. Pricing rail remains visible on desktop and has compact mobile action bar.
4. No fake operational metrics unless sourced from real data.
5. Empty content must degrade gracefully with category-specific starter copy.

## 6. Content Fallback Model

When admin leaves fields empty:
- Show starter blocks based on category group.
- Mark internally as placeholder to avoid confusion with verified promises.

### Starter pack groups
- Tech: `programming`, `it`, `office`
- Academic: `ielts`, `toeic`, `english`, `communication`

Each starter pack should include:
- 4 outcomes
- 3 to 5 feature bullets
- 3 FAQ items
- 3 syllabus modules with 3 topics each

## 7. Implementation Plan for Code Mode

1. Hero and decoration cleanup
   - Replace `TechDecoration` fake code with subtle abstract pattern.
   - Add media component for `course.cover_image` with fallback visual.
2. Trust and metrics hardcode cleanup
   - Remove hardcoded urgency numbers and static opening date.
   - Render only data-backed fields or neutral labels.
3. Robust rendering states
   - Keep current conditional rendering.
   - Add category starter fallback when arrays are empty.
4. Theme architecture hardening
   - Keep dual-theme toggle by category.
   - Centralize shared layout and token overrides.
5. Admin content acceleration
   - Expand templates for both Tech and Academic categories with complete arrays.
   - Keep AI fill as optional enhancer.
6. QA and acceptance checks
   - Verify desktop, tablet, mobile behavior.
   - Verify both theme families.
   - Verify empty-state and fully populated-state rendering.

## 8. Acceptance Criteria

- No fake data-looking decorative strings in Tech hero.
- Course cover image appears in hero when available.
- If arrays are empty, user still sees helpful starter content.
- If admin enters data, page auto reflects it without manual mapping.
- Dual-theme remains, but structure and usability are consistent.
- Sidebar and mobile CTA remain discoverable and conversion-focused.

## 9. Recommended Next Step

Proceed with Option C structured uplift in implementation mode, preserving dual-theme and adding category starter fallback content.
