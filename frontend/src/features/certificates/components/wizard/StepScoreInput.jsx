import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Calculator, ChevronDown, Award } from 'lucide-react';
import { GRADE_OPTIONS } from '../../constants';
import { cn } from '@/lib/utils';

export default function StepScoreInput({ form, selectedStudents, certificateType }) {
  const { control, formState: { errors }, setValue, watch } = form;
  
  if (!certificateType || !certificateType.score_config) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-64 bg-white rounded-xl border border-border">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground font-medium">Đang tải cấu hình điểm...</p>
      </div>
    );
  }

  const { type, sub_scores, max_score } = certificateType.score_config;

  const renderScoreInputs = () => {
    switch (type) {
      case 'grade':
        return <GradeInputTable selectedStudents={selectedStudents} form={form} />;
      case 'band':
        return <BandInputCards selectedStudents={selectedStudents} form={form} subScores={sub_scores} />;
      case 'numeric':
        return <NumericInputCards selectedStudents={selectedStudents} form={form} subScores={sub_scores} maxScore={max_score} />;
      default:
        return (
          <div className="p-8 text-center bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-center justify-center gap-3">
            <AlertCircle className="w-6 h-6" />
            <span className="font-semibold">Loại cấu hình điểm không hợp lệ</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-5 flex items-start gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />
        <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center border border-primary/20 shadow-sm shrink-0 z-10">
          <Calculator className="w-6 h-6 text-primary" />
        </div>
        <div className="z-10 relative">
          <h4 className="font-bold text-foreground text-lg mb-1 flex items-center gap-2">
            Nhập điểm cho <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30 border-primary/30 text-sm px-2 py-0.5">{selectedStudents.length} học viên</Badge>
          </h4>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 font-medium">
            <Award className="w-4 h-4 text-primary/70" />
            Loại chứng chỉ: <strong className="text-foreground">{certificateType.name}</strong>
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-4 space-y-4">
        {renderScoreInputs()}
      </div>

      {errors.scores && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium rounded-xl flex items-center gap-3 shadow-sm animate-in slide-in-from-bottom-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>Vui lòng kiểm tra lại điểm số. Có lỗi xảy ra hoặc chưa điền đủ thông tin bắt buộc.</p>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// GRADE INPUT TYPE (Table Layout)
// ----------------------------------------------------------------------
function GradeInputTable({ selectedStudents, form }) {
  const [globalGrade, setGlobalGrade] = React.useState('');
  
  const applyGlobalGrade = () => {
    if (!globalGrade) return;
    selectedStudents.forEach(student => {
      form.setValue(`scores.${student.student_id}.grade`, globalGrade, { shouldValidate: true });
    });
  };

  return (
    <Card className="border-border bg-white overflow-hidden shadow-sm">
      <div className="p-4 bg-muted border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h4 className="font-semibold text-foreground flex items-center gap-2">
          <div className="w-2 h-6 bg-primary rounded-full" />
          Nhập xếp loại hàng loạt
        </h4>
        <div className="flex items-center gap-2 w-full sm:w-auto bg-white p-1.5 rounded-lg border border-border shadow-sm">
          <Select value={globalGrade} onValueChange={setGlobalGrade}>
            <SelectTrigger className="w-[180px] h-9 bg-transparent border-0 focus:ring-0 shadow-none font-medium">
              <SelectValue placeholder="Chọn xếp loại..." />
            </SelectTrigger>
            <SelectContent>
              {GRADE_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value} className="font-medium">{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="w-px h-6 bg-border mx-1" />
          <Button type="button" size="sm" onClick={applyGlobalGrade} variant="secondary" className="h-9 bg-primary/10 text-primary hover:bg-primary/20 border-0 font-semibold px-4">
            Áp dụng
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs text-muted-foreground uppercase tracking-wider bg-muted border-b border-border">
            <tr>
              <th className="px-6 py-4 font-semibold w-12 text-center">#</th>
              <th className="px-4 py-4 font-semibold">Học viên</th>
              <th className="px-4 py-4 font-semibold w-64">Xếp loại <span className="text-destructive text-lg leading-none">*</span></th>
              <th className="px-6 py-4 font-semibold">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {selectedStudents.map((student, idx) => (
              <tr key={student.student_id} className="hover:bg-muted transition-colors group">
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-bold group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {idx + 1}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="font-bold text-foreground text-base mb-1">{student.student_name || student.full_name || 'Học viên ẩn danh'}</div>
                  <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border/50">
                    {student.class_name || student.class_code || 'Không có lớp'}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <Controller
                    control={form.control}
                    name={`scores.${student.student_id}.grade`}
                    render={({ field, fieldState }) => (
                      <div className="relative">
                        <Select value={field.value || undefined} onValueChange={field.onChange}>
                          <SelectTrigger className={cn("w-full h-10 bg-white font-medium", fieldState.error ? "border-destructive ring-1 ring-destructive/20" : "border-border")}>
                            <SelectValue placeholder="Chọn loại..." />
                          </SelectTrigger>
                          <SelectContent>
                            {GRADE_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value} className="font-medium">{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldState.error && <span className="absolute -bottom-5 left-0 text-[10px] font-medium text-destructive">{fieldState.error.message}</span>}
                      </div>
                    )}
                  />
                </td>
                <td className="px-6 py-4">
                  <Controller
                    control={form.control}
                    name={`scores.${student.student_id}.notes`}
                    render={({ field }) => (
                      <Input {...field} value={field.value || ''} placeholder="Ghi chú thêm..." className="h-10 text-sm bg-white border-border/50 focus-visible:border-primary shadow-none" />
                    )}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ----------------------------------------------------------------------
// BAND INPUT TYPE (Card Layout)
// ----------------------------------------------------------------------
function BandInputCards({ selectedStudents, form, subScores }) {
  const hasSubScores = subScores && subScores.length > 0;
  
  return (
    <div className="space-y-5">
      {selectedStudents.map((student, idx) => (
        <Card key={student.student_id} className="overflow-hidden border-border bg-white shadow-sm hover:shadow-md transition-shadow relative group">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-border group-hover:bg-primary/50 transition-colors" />
          
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border">
            {/* Student Info & Overall */}
            <div className="w-full md:w-[35%] shrink-0 p-5 bg-muted">
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted border border-border text-muted-foreground text-xs font-bold shadow-sm">
                  {idx + 1}
                </span>
                <span className="font-bold text-foreground text-lg tracking-tight">{student.student_name || student.full_name || 'Học viên ẩn danh'}</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground mb-6 inline-flex px-2 py-1 rounded bg-muted border border-border/50 ml-10">
                {student.class_name || student.class_code || 'Không có lớp'}
              </p>
              
              <div className="bg-white p-4 rounded-xl border border-primary/20 shadow-sm relative overflow-hidden group-hover:border-primary/40 transition-colors ml-10">
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-full blur-xl -mr-8 -mt-8" />
                <label className="text-xs font-bold uppercase tracking-wider text-primary mb-2 block relative z-10">
                  Overall Band <span className="text-destructive">*</span>
                </label>
                <Controller
                  control={form.control}
                  name={`scores.${student.student_id}.overall`}
                  render={({ field, fieldState }) => (
                    <div className="relative z-10">
                      <Input 
                        type="number" step="0.5" min="0" max="9"
                        placeholder="VD: 6.5"
                        {...field}
                        value={field.value ?? ''}
                        onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        className={cn(
                          "bg-white font-bold text-lg h-12 shadow-inner", 
                          fieldState.error ? "border-destructive ring-2 ring-destructive/20 focus-visible:ring-destructive/30" : "border-primary/30 focus-visible:ring-primary/30"
                        )}
                      />
                      {fieldState.error && <p className="absolute -bottom-5 left-0 text-[10px] font-medium text-destructive">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
              </div>
            </div>
            
            {/* Sub Scores */}
            <div className="flex-1 w-full p-5 bg-white relative">
              {hasSubScores ? (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <div className="w-1.5 h-4 bg-muted-foreground/30 rounded-full" />
                      Điểm thành phần
                    </h5>
                    <div className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                      Thang điểm 0 - 9.0
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-auto mb-auto">
                    {subScores.map((skill, sIdx) => (
                      <div key={skill} className="bg-muted p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-white transition-colors">
                        <label className="text-xs font-bold text-foreground mb-2 block capitalize tracking-wide opacity-80">{skill}</label>
                        <Controller
                          control={form.control}
                          name={`scores.${student.student_id}.${skill}`}
                          render={({ field, fieldState }) => (
                            <div>
                              <Input 
                                type="number" step="0.5" min="0" max="9" placeholder="0.0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                className={cn(
                                  "h-10 text-base font-semibold bg-white shadow-inner", 
                                  fieldState.error ? "border-destructive focus-visible:ring-destructive/20" : "border-border focus-visible:border-primary/50"
                                )}
                              />
                            </div>
                          )}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl text-muted-foreground bg-muted">
                  <AlertCircle className="w-8 h-8 opacity-20 mb-2" />
                  <span className="font-medium text-sm">Không yêu cầu điểm thành phần</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ----------------------------------------------------------------------
// NUMERIC INPUT TYPE (Card Layout)
// ----------------------------------------------------------------------
function NumericInputCards({ selectedStudents, form, subScores, maxScore }) {
  const hasSubScores = subScores && subScores.length > 0;
  
  return (
    <div className="space-y-5">
      {selectedStudents.map((student, idx) => (
        <Card key={student.student_id} className="p-0 overflow-hidden border-border bg-white shadow-sm relative group hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="p-5">
            <div className="flex flex-wrap md:flex-nowrap gap-6">
              {/* Student Info */}
              <div className="w-full md:w-1/4 shrink-0 border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 pr-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted border border-border text-muted-foreground text-xs font-bold shadow-sm">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-foreground text-base tracking-tight truncate" title={student.student_name || student.full_name}>
                    {student.student_name || student.full_name || 'Học viên ẩn danh'}
                  </span>
                </div>
                <div className="text-xs font-medium text-muted-foreground inline-flex px-2 py-1 rounded bg-muted border border-border/50 ml-10 truncate max-w-[150px]" title={student.class_name || student.class_code}>
                  {student.class_name || student.class_code || 'Không có lớp'}
                </div>
              </div>

              {/* Total Score */}
              <div className="w-full md:w-1/4 shrink-0 flex flex-col justify-center">
                <div className="bg-white p-4 rounded-xl border border-primary/20 shadow-sm relative overflow-hidden group-hover:border-primary/40 transition-colors">
                  <div className="absolute bottom-0 right-0 w-16 h-16 bg-primary/10 rounded-full blur-xl -mr-8 -mb-8" />
                  <div className="flex justify-between items-center mb-2 relative z-10">
                    <label className="text-xs font-bold uppercase tracking-wider text-primary">Tổng điểm <span className="text-destructive">*</span></label>
                    <span className="text-[10px] font-bold bg-white text-primary/70 px-1.5 py-0.5 rounded shadow-sm border border-primary/10">Max: {maxScore || '---'}</span>
                  </div>
                  <Controller
                    control={form.control}
                    name={`scores.${student.student_id}.total`}
                    render={({ field, fieldState }) => (
                      <div className="relative z-10">
                        <Input 
                          type="number" min="0" max={maxScore}
                          placeholder="Nhập..."
                          {...field}
                          value={field.value ?? ''}
                          onChange={e => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                          className={cn(
                            "bg-white font-bold text-lg h-12 shadow-inner pr-12", 
                            fieldState.error ? "border-destructive ring-2 ring-destructive/20 focus-visible:ring-destructive/30" : "border-primary/30 focus-visible:ring-primary/30"
                          )}
                        />
                        {maxScore && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm select-none pointer-events-none">/{maxScore}</span>}
                        {fieldState.error && <p className="absolute -bottom-5 left-0 text-[10px] font-medium text-destructive">{fieldState.error.message}</p>}
                      </div>
                    )}
                  />
                </div>
              </div>
              
              {/* Sub Scores */}
              <div className="w-full md:flex-1">
                {hasSubScores ? (
                  <div className="bg-muted p-4 rounded-xl border border-border h-full flex flex-col">
                    <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                      <div className="w-1.5 h-3 bg-muted-foreground/30 rounded-full" />
                      Điểm thành phần
                    </h5>
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mt-auto mb-auto">
                      {subScores.map(skill => (
                        <div key={skill} className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-bold text-foreground capitalize opacity-80 pl-1">{skill}</label>
                          <Controller
                            control={form.control}
                            name={`scores.${student.student_id}.subScores.${skill}`}
                            render={({ field }) => (
                              <Input 
                                type="number" min="0" placeholder="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={e => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                                className="h-9 text-sm font-semibold bg-white border-border/70 focus-visible:border-primary/50 shadow-inner"
                              />
                            )}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[80px] flex items-center justify-center border-2 border-dashed border-border rounded-xl text-muted-foreground bg-muted">
                    <span className="font-medium text-sm">Không yêu cầu điểm thành phần</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
