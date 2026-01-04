# Design Tokens Documentation

## Overview

Skill Master sử dụng hệ thống Design Tokens dựa trên Shadcn UI để đảm bảo tính nhất quán và hỗ trợ Dark Mode trong tương lai.

## Color Tokens (Semantic)

### Surfaces & Backgrounds

| Token           | Usage                         | Thay thế                            |
| --------------- | ----------------------------- | ----------------------------------- |
| `bg-background` | Main page background          | `bg-white`, `bg-stone-50`           |
| `bg-muted`      | Secondary backgrounds         | `bg-stone-100`, `bg-gray-100`       |
| `bg-card`       | Card backgrounds              | `bg-white`                          |
| `bg-popover`    | Dropdown/modal backgrounds    | `bg-white`                          |
| `bg-accent`     | Hover states, subtle emphasis | `bg-stone-50`, `hover:bg-stone-100` |

### Text Colors

| Token                     | Usage                 | Thay thế                         |
| ------------------------- | --------------------- | -------------------------------- |
| `text-foreground`         | Primary text          | `text-zinc-900`, `text-gray-900` |
| `text-muted-foreground`   | Secondary/helper text | `text-zinc-500`, `text-gray-500` |
| `text-card-foreground`    | Text on cards         | `text-zinc-900`                  |
| `text-popover-foreground` | Text in dropdowns     | `text-zinc-700`                  |

### Borders

| Token           | Usage               | Thay thế                              |
| --------------- | ------------------- | ------------------------------------- |
| `border-border` | Default borders     | `border-stone-200`, `border-gray-200` |
| `border-input`  | Input field borders | `border-stone-200`                    |

### Interactive Colors

| Token              | Usage                  | Notes                   |
| ------------------ | ---------------------- | ----------------------- |
| `bg-primary`       | Primary buttons, links | Indigo/Blue brand color |
| `text-primary`     | Primary text accent    |                         |
| `bg-destructive`   | Danger/Delete actions  | Red                     |
| `text-destructive` | Error text             | Red                     |

### Ring Colors (Focus States)

| Token             | Usage                      |
| ----------------- | -------------------------- |
| `ring-ring`       | Default focus ring         |
| `ring-primary/20` | Primary focus with opacity |

## Usage Examples

### Button

```jsx
// ❌ Avoid
<button className="bg-red-500 hover:bg-red-600 text-white">

// ✅ Prefer
<button className="bg-primary hover:bg-primary/90 text-primary-foreground">
```

### Card

```jsx
// ❌ Avoid
<div className="bg-white border border-stone-200 rounded-lg">

// ✅ Prefer
<div className="bg-card border border-border rounded-lg">
```

### Input

```jsx
// ❌ Avoid
<input className="border-stone-200 bg-stone-50 text-zinc-900 placeholder:text-zinc-400">

// ✅ Prefer
<input className="border-input bg-muted/50 text-foreground placeholder:text-muted-foreground">
```

### Text

```jsx
// ❌ Avoid
<p className="text-zinc-900">Primary</p>
<span className="text-zinc-500">Secondary</span>

// ✅ Prefer
<p className="text-foreground">Primary</p>
<span className="text-muted-foreground">Secondary</span>
```

## Files Updated

- [x] `src/layouts/admin-layout.jsx`
- [x] `src/components/layout/admin-header.jsx`
- [ ] `src/components/layout/public-header.jsx` (public-facing, keep warm colors intentionally)
- [ ] `src/components/ui/splash-loader.jsx`
- [ ] `src/components/common/SmartImage.jsx`
- [ ] `src/components/common/ConsultationModal.jsx`
- [ ] `src/components/common/BookingModal.jsx`

## Migration Strategy

1. **Admin Pages**: Full migration to design tokens (completed)
2. **Public Pages**: Keep intentional warm colors (stone) for brand consistency
3. **Shared Components**: Migrate to tokens for reusability

## Dark Mode Support

Khi implement Dark Mode, chỉ cần update CSS variables trong `:root` và `.dark`:

```css
:root {
  --background: 210 40% 98%;
  --foreground: 222.2 84% 4.9%;
  /* ... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```
