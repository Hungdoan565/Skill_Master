import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useParentChildren } from '../hooks';
import { supabase as supabaseClient } from '@/lib/supabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  Users, 
  GraduationCap,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ParentProfilePage() {
  const { profile } = useAuth();
  const { children, loading: childrenLoading } = useParentChildren();
  const { toast } = useToast();

  // Password change state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const { newPassword, confirmPassword } = passwordForm;

    if (!newPassword || newPassword.length < 6) {
      toast({ title: 'Lỗi', description: 'Mật khẩu mới phải có ít nhất 6 ký tự.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Lỗi', description: 'Mật khẩu xác nhận không khớp.', type: 'error' });
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast({ title: 'Thành công', description: 'Mật khẩu đã được cập nhật.', type: 'success' });
      setShowPasswordDialog(false);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast({ title: 'Không thể đổi mật khẩu', description: err.message || 'Vui lòng thử lại.', type: 'error' });
    } finally {
      setChangingPassword(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <User className="h-8 w-8 text-orange-600" />
            Hồ sơ cá nhân
          </h1>
          <p className="text-muted-foreground mt-2">
            Quản lý thông tin tài khoản và danh sách học viên liên kết
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái: Thông tin cá nhân & Đổi mật khẩu */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-orange-500/20 shadow-sm">
            <CardHeader className="bg-orange-500/10 border-b border-orange-500/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-orange-500" />
                Thông tin liên hệ
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Họ và tên</p>
                  <p className="text-base text-foreground">{profile.full_name || 'Chưa cập nhật'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-base text-foreground">{profile.email || 'Chưa cập nhật'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Số điện thoại</p>
                  <p className="text-base text-foreground">{profile.phone || 'Chưa cập nhật'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Địa chỉ</p>
                  <p className="text-base text-foreground">{profile.address || 'Chưa cập nhật'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="h-5 w-5 text-muted-foreground" />
                Bảo mật tài khoản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Để bảo vệ tài khoản, vui lòng không chia sẻ mật khẩu cho người khác.
              </p>
              <Button 
                variant="outline" 
                className="w-full justify-start text-muted-foreground hover:text-orange-600 hover:bg-orange-500/10"
                onClick={() => setShowPasswordDialog(true)}
              >
                <Lock className="h-4 w-4 mr-2" />
                Đổi mật khẩu
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Cột phải: Danh sách con */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm h-full">
            <CardHeader className="border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-500" />
                Học viên liên kết ({children?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {childrenLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                </div>
              ) : children && children.length > 0 ? (
                <div className="space-y-4">
                  {children.map((child) => (
                    <div 
                      key={child.id} 
                      className="flex items-center justify-between p-4 rounded-lg border border-border bg-slate-50 hover:border-orange-500/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600 font-bold text-lg">
                          {child.full_name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{child.full_name}</h4>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <span className="font-medium bg-muted px-2 py-0.5 rounded text-xs">
                              {child.student_code || child.email || 'Chưa có thông tin'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground bg-white px-3 py-1.5 rounded border border-border shadow-sm">
                        <GraduationCap className="h-4 w-4 text-orange-500" />
                        <span>{child.active_classes_count || 0} lớp đang học</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-4 border-2 border-dashed rounded-lg">
                  <div className="bg-orange-500/10 text-orange-600 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-1">Chưa có học viên</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    Tài khoản của bạn chưa được liên kết với học viên nào. Vui lòng liên hệ trung tâm để được hỗ trợ.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-orange-600" />
              Đổi mật khẩu
            </DialogTitle>
            <DialogDescription>
              Nhập mật khẩu mới cho tài khoản của bạn. Mật khẩu phải có ít nhất 6 ký tự.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleChangePassword} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="font-medium">Mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu mới"
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  required
                  minLength={6}
                  className="pr-10 focus-visible:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="font-medium">Xác nhận mật khẩu</Label>
              <Input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập lại mật khẩu mới"
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
                minLength={6}
                className="focus-visible:ring-orange-500"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowPasswordDialog(false)}>
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={changingPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {changingPassword ? (
                  <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Đang xử lý...</>
                ) : (
                  <><Lock className="mr-2 h-4 w-4" /> Cập nhật mật khẩu</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
