import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Config màu cho từng danh mục
const CATEGORY_CONFIG = {
  english: { 
    label: 'Tiếng Anh', 
    color: 'bg-blue-100 text-blue-700 border-blue-200' 
  },
  it: { 
    label: 'Tin học', 
    color: 'bg-purple-100 text-purple-700 border-purple-200' 
  },
  programming: { 
    label: 'Lập trình', 
    color: 'bg-violet-100 text-violet-700 border-violet-200' 
  },
  ielts: { 
    label: 'IELTS', 
    color: 'bg-amber-100 text-amber-700 border-amber-200' 
  },
  toeic: { 
    label: 'TOEIC', 
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200' 
  },
  communication: { 
    label: 'Giao tiếp', 
    color: 'bg-cyan-100 text-cyan-700 border-cyan-200' 
  },
  office: { 
    label: 'Tin học VP', 
    color: 'bg-orange-100 text-orange-700 border-orange-200' 
  },
  default: { 
    label: 'Khác', 
    color: 'bg-slate-100 text-slate-700 border-slate-200' 
  },
};

// Component Badge danh mục
const CategoryBadge = ({ category }) => {
  const config = CATEGORY_CONFIG[category?.toLowerCase()] || CATEGORY_CONFIG.default;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

export function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('/api/courses');
        if (response.data?.success) {
          setCourses(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = courses.filter(
    (course) =>
      course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Khóa học</h1>
          <p className="text-muted-foreground">
            Danh sách tất cả khóa học của trung tâm
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Tạo khóa học
        </Button>
      </div>

      {/* Toolbar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm theo tên hoặc mã khóa học..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Tổng: <strong>{filteredCourses.length}</strong> khóa học
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-muted-foreground">Đang tải dữ liệu...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-muted-foreground">
                {searchTerm
                  ? 'Không tìm thấy khóa học phù hợp'
                  : 'Chưa có khóa học nào. Bấm "Tạo khóa học" để thêm mới.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                    <th className="pb-3 pr-4">Mã</th>
                    <th className="pb-3 pr-4">Tên khóa học</th>
                    <th className="pb-3 pr-4">Danh mục</th>
                    <th className="pb-3 pr-4 text-right">Học phí</th>
                    <th className="pb-3 pr-4">Số buổi</th>
                    <th className="pb-3 pr-4">Trạng thái</th>
                    <th className="pb-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course) => (
                    <tr
                      key={course.id}
                      className="border-b last:border-0 hover:bg-slate-50"
                    >
                      <td className="py-4 pr-4">
                        <code className="rounded bg-slate-100 px-2 py-1 text-sm">
                          {course.code}
                        </code>
                      </td>
                      <td className="py-4 pr-4">
                        <div>
                          <p className="font-medium">{course.title}</p>
                          {course.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {course.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <CategoryBadge category={course.category} />
                      </td>
                      <td className="py-4 pr-4 text-right font-mono font-medium text-emerald-600 tabular-nums">
                        {formatPrice(course.price)}
                      </td>
                      <td className="py-4 pr-4">
                        {course.total_sessions || '-'} buổi
                      </td>
                      <td className="py-4 pr-4">
                        <Badge variant="success">Hoạt động</Badge>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
