import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CATEGORY_CONFIG } from '../constants';
import { BookOpen, AlertCircle, Building2, Globe2, LayoutGrid } from 'lucide-react';

function CategoryGroup({ category, types }) {
  const catConfig = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
  const Icon = catConfig.icon || LayoutGrid;

  const totalIssued = types.reduce((sum, type) => sum + (type.total_issued || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg border shadow-sm" style={{ backgroundColor: `${catConfig.color}15`, borderColor: `${catConfig.color}30` }}>
            <Icon className="h-4 w-4" style={{ color: catConfig.color }} />
          </div>
          <h4 className="font-semibold text-foreground tracking-tight" style={{ color: catConfig.color }}>
            {catConfig.label}
          </h4>
        </div>
        <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
          {types.length} loại
          {totalIssued > 0 && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 mx-1" />
              <span className="font-semibold text-foreground">{totalIssued}</span> đã cấp
            </>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {types.map((type) => (
          <Card key={type.id} className="group relative overflow-hidden bg-card border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300 flex flex-col cursor-default">
            {/* Left accent border */}
            <div className="absolute left-0 top-0 w-1 h-full opacity-70 transition-all duration-300 group-hover:opacity-100 group-hover:w-1.5" style={{ backgroundColor: catConfig.color }} />
            
            <div className="p-4 pl-5 flex flex-col h-full justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm leading-tight text-foreground line-clamp-2" title={type.name}>
                    {type.name}
                  </p>
                  {type.total_issued > 0 && (
                    <Badge variant="secondary" className="shrink-0 bg-primary/10 text-primary border-primary/20 text-xs font-mono">
                      {type.total_issued}
                    </Badge>
                  )}
                </div>
                {type.provider && (
                  <p className="text-xs text-muted-foreground line-clamp-1" title={type.provider}>
                    Cấp bởi <span className="font-medium text-foreground/80">{type.provider}</span>
                  </p>
                )}
              </div>
              
              {/* Optional footer info */}
              <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                <span>{type.is_external ? 'Chứng chỉ ngoài' : 'Chứng chỉ nội bộ'}</span>
                {type.validity_months ? <span>Hạn {type.validity_months} tháng</span> : <span>Vĩnh viễn</span>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TypeSection({ title, description, types, loading, icon: HeaderIcon }) {
  const grouped = {};
  types.forEach((type) => {
    const cat = type.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(type);
  });

  const categoryOrder = ['language', 'office', 'programming', 'soft_skill', 'other'];
  const sortedCategories = categoryOrder.filter((cat) => grouped[cat]?.length > 0);

  return (
    <div className="space-y-6 bg-card rounded-xl border border-border/50 shadow-sm p-6 relative overflow-hidden">
      <div className="relative z-10 flex items-start gap-4 mb-2">
        <div className="p-3 bg-primary/10 text-primary rounded-xl border border-primary/20 shadow-sm shrink-0">
          <HeaderIcon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold tracking-tight text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{description}</p>
        </div>
      </div>

      {sortedCategories.length > 0 ? (
        <div className="space-y-8 relative z-10">
          {sortedCategories.map((cat) => (
            <CategoryGroup key={cat} category={cat} types={grouped[cat]} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center relative z-10">
          <div className="p-4 bg-muted rounded-full mb-3">
            <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium text-foreground">Chưa có dữ liệu</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">
            Hệ thống chưa ghi nhận loại chứng chỉ nào trong danh mục này.
          </p>
        </div>
      )}
    </div>
  );
}

export default function CertificateTypesGrid({ types, loading }) {
  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {[1, 2].map((i) => (
          <div key={i} className="bg-card rounded-xl border border-border/50 p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 bg-muted rounded-xl animate-pulse shrink-0" />
              <div className="space-y-2 w-full">
                <div className="h-6 w-48 bg-muted rounded animate-pulse" />
                <div className="h-4 w-96 bg-muted rounded animate-pulse" />
              </div>
            </div>
            <div className="space-y-4 pt-4">
              <div className="h-8 w-32 bg-muted rounded animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-28 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const internalTypes = (types || []).filter((t) => t.is_internal);
  const externalTypes = (types || []).filter((t) => t.is_external);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <TypeSection
        title="Hệ thống Nội bộ (Center tự cấp)"
        description="Các chứng chỉ, giấy chứng nhận do trung tâm trực tiếp đánh giá, tổ chức thi và cấp phát cho học viên sau khóa học."
        types={internalTypes}
        loading={loading}
        icon={Building2}
      />
      
      <TypeSection
        title="Ghi nhận Quốc tế (Hồ sơ ngoài)"
        description="Quản lý và lưu trữ thông tin các chứng chỉ quốc tế do tổ chức bên ngoài cấp (như IELTS, TOEIC, MOS) mà học viên đã đạt được."
        types={externalTypes}
        loading={loading}
        icon={Globe2}
      />
    </div>
  );
}
