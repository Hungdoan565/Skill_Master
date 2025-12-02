/**
 * CategoryBadge Component - Badge hiển thị danh mục khóa học
 */

import { getCategoryConfig } from '../utils';

export function CategoryBadge({ category }) {
  const config = getCategoryConfig(category);
  
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

export default CategoryBadge;
