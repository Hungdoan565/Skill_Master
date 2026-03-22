import { useState, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  GraduationCap, 
  Loader2, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ArrowLeft,
  Mail,
  Lock,
  User,
  CheckCircle2,
  Github,
  CheckCircle,
  X,
  Check
} from 'lucide-react';

// Password strength checker
const checkPasswordStrength = (password) => {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  
  const passedChecks = Object.values(checks).filter(Boolean).length;
  
  let strength = 'none';
  let label = '';
  let color = '';
  
  if (password.length === 0) {
    strength = 'none';
    label = '';
    color = '';
  } else if (passedChecks <= 2) {
    strength = 'weak';
    label = 'Yếu';
    color = 'bg-red-500';
  } else if (passedChecks === 3) {
    strength = 'fair';
    label = 'Trung bình';
    color = 'bg-orange-500';
  } else if (passedChecks === 4) {
    strength = 'good';
    label = 'Tốt';
    color = 'bg-yellow-500';
  } else {
    strength = 'strong';
    label = 'Mạnh';
    color = 'bg-green-500';
  }
  
  return { checks, passedChecks, strength, label, color };
};

// Password requirements component
const PasswordRequirements = ({ password, isFocused }) => {
  const { checks } = checkPasswordStrength(password);
  
  const requirements = [
    { key: 'length', label: 'Ít nhất 8 ký tự', passed: checks.length },
    { key: 'lowercase', label: 'Chữ thường (a-z)', passed: checks.lowercase },
    { key: 'uppercase', label: 'Chữ hoa (A-Z)', passed: checks.uppercase },
    { key: 'number', label: 'Số (0-9)', passed: checks.number },
    { key: 'special', label: 'Ký tự đặc biệt (!@#$%...)', passed: checks.special },
  ];

  if (!isFocused && password.length === 0) return null;

  return (
    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
      <p className="text-xs font-medium text-slate-600 mb-2">Mật khẩu cần có:</p>
      <div className="grid grid-cols-1 gap-1.5">
        {requirements.map((req) => (
          <div key={req.key} className="flex items-center gap-2">
            {req.passed ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <X className="h-3.5 w-3.5 text-slate-300" />
            )}
            <span className={`text-xs ${req.passed ? 'text-green-600' : 'text-slate-500'}`}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Password strength bar component
const PasswordStrengthBar = ({ password }) => {
  const { strength, label, color, passedChecks } = checkPasswordStrength(password);
  
  if (password.length === 0) return null;
  
  return (
    <div className="mt-2 space-y-1.5 animate-in fade-in duration-200">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              level <= passedChecks ? color : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between items-center">
        <span className={`text-xs font-medium ${
          strength === 'weak' ? 'text-red-500' :
          strength === 'fair' ? 'text-orange-500' :
          strength === 'good' ? 'text-yellow-600' :
          strength === 'strong' ? 'text-green-500' : 'text-slate-400'
        }`}>
          Độ mạnh: {label}
        </span>
        {strength === 'strong' && (
          <span className="text-xs text-green-500 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Tuyệt vời!
          </span>
        )}
      </div>
    </div>
  );
};

// Schema validation với Zod - thêm fullName và confirmPassword
const registerSchema = z.object({
  fullName: z
    .string()
    .min(1, { message: 'Vui lòng nhập họ và tên' })
    .min(2, { message: 'Họ và tên phải có ít nhất 2 ký tự' }),
  email: z
    .string()
    .min(1, { message: 'Vui lòng nhập email' })
    .email({ message: 'Email không hợp lệ' }),
  password: z
    .string()
    .min(1, { message: 'Vui lòng nhập mật khẩu' })
    .min(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
    .regex(/[a-z]/, { message: 'Mật khẩu phải có ít nhất 1 chữ thường' })
    .regex(/[A-Z]/, { message: 'Mật khẩu phải có ít nhất 1 chữ hoa' })
    .regex(/[0-9]/, { message: 'Mật khẩu phải có ít nhất 1 số' }),
  confirmPassword: z
    .string()
    .min(1, { message: 'Vui lòng xác nhận mật khẩu' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

export function RegisterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Watch password field for strength meter
  const watchedPassword = useWatch({ control, name: 'password', defaultValue: '' });

  // Nếu đã đăng nhập rồi, redirect về dashboard
  useEffect(() => {
    if (user) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Xử lý đăng ký
  const onSubmit = async (data) => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Gọi Supabase Auth signUp
      // Trigger SQL sẽ tự động tạo user trong public.users với role STUDENT
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      });

      if (error) {
        // Map các lỗi Supabase sang tiếng Việt thân thiện
        if (error.message.includes('User already registered')) {
          setErrorMessage('Email này đã được đăng ký. Vui lòng đăng nhập hoặc sử dụng email khác.');
        } else if (error.message.includes('Password should be')) {
          setErrorMessage('Mật khẩu phải có ít nhất 6 ký tự');
        } else {
          setErrorMessage(error.message);
        }
        return;
      }

      // Đăng ký thành công
      setSuccessMessage('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.');
      
      // Redirect về login sau 3 giây
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      setErrorMessage('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.');
      console.error('Register error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding (giống Login) */}
      <div className="hidden w-1/2 flex-col justify-center bg-slate-900 p-12 lg:flex">
        {/* Logo - ở trên cùng absolute */}
        <div className="absolute top-12 left-12">
          <Link to="/" className="inline-flex items-center gap-3 transition-opacity duration-200 hover:opacity-80">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Skill Master</span>
          </Link>
        </div>

        {/* Main Content - căn giữa */}
        <div className="space-y-8 max-w-lg">
          <div>
            <h1 className="text-4xl font-bold leading-tight text-white">
              Bắt đầu hành trình
            </h1>
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              học tập của bạn
            </h2>
          </div>
          
          <p className="text-base text-slate-400 leading-relaxed">
            Tạo tài khoản miễn phí để khám phá hàng trăm khóa học chất lượng cao 
            và theo dõi tiến độ học tập của bạn.
          </p>

          {/* Benefits Checklist */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20">
                <CheckCircle2 className="h-4 w-4 text-indigo-400" />
              </div>
              <span className="text-slate-300">Truy cập hàng trăm khóa học</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20">
                <CheckCircle2 className="h-4 w-4 text-indigo-400" />
              </div>
              <span className="text-slate-300">Theo dõi tiến độ học tập</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20">
                <CheckCircle2 className="h-4 w-4 text-indigo-400" />
              </div>
              <span className="text-slate-300">Nhận chứng chỉ hoàn thành</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="relative flex w-full flex-col items-center justify-center bg-slate-50 px-6 py-12 lg:w-1/2">
        <Card className="w-full max-w-md border-0 bg-card shadow-xl">
          <CardHeader className="space-y-1 pb-2">
            {/* Mobile logo */}
            <div className="mb-6 flex justify-center lg:hidden">
              <Link to="/" className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900">Skill Master</span>
              </Link>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">Tạo tài khoản</CardTitle>
            <CardDescription className="text-slate-500">
              Tạo tài khoản miễn phí để bắt đầu
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            {/* Success Message */}
            {successMessage && (
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600 animate-in fade-in slide-in-from-top-2 duration-200">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Error Alert */}
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 animate-in fade-in slide-in-from-top-2 duration-200">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Full Name Field */}
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium text-slate-700">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    autoComplete="name"
                    disabled={isLoading}
                    className={`
                      flex h-12 w-full rounded-lg border-2 bg-card pl-11 pr-4 text-slate-900
                      placeholder:text-slate-400 
                      transition-all duration-200
                      focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20
                      disabled:cursor-not-allowed disabled:opacity-50
                      ${errors.fullName ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 hover:border-slate-300'}
                    `}
                    {...register('fullName')}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-red-500">{errors.fullName.message}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    autoComplete="email"
                    disabled={isLoading}
                    className={`
                      flex h-12 w-full rounded-lg border-2 bg-card pl-11 pr-4 text-slate-900
                      placeholder:text-slate-400 
                      transition-all duration-200
                      focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20
                      disabled:cursor-not-allowed disabled:opacity-50
                      ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 hover:border-slate-300'}
                    `}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={isLoading}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    className={`
                      flex h-12 w-full rounded-lg border-2 bg-card pl-11 pr-12 text-slate-900
                      placeholder:text-slate-400 
                      transition-all duration-200
                      focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20
                      disabled:cursor-not-allowed disabled:opacity-50
                      ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 hover:border-slate-300'}
                    `}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                
                {/* Password Strength Bar */}
                <PasswordStrengthBar password={watchedPassword} />
                
                {/* Password Requirements Hints */}
                <PasswordRequirements password={watchedPassword} isFocused={isPasswordFocused} />
                
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                  Xác nhận mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={isLoading}
                    className={`
                      flex h-12 w-full rounded-lg border-2 bg-card pl-11 pr-12 text-slate-900
                      placeholder:text-slate-400 
                      transition-all duration-200
                      focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20
                      disabled:cursor-not-allowed disabled:opacity-50
                      ${errors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 hover:border-slate-300'}
                    `}
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Terms Agreement */}
              <p className="text-xs text-slate-500">
                Bằng việc đăng ký, bạn đồng ý với{' '}
                <a href="#" className="text-indigo-600 hover:underline">Điều khoản sử dụng</a>
                {' '}và{' '}
                <a href="#" className="text-indigo-600 hover:underline">Chính sách bảo mật</a>
              </p>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-base font-semibold transition-all duration-200 hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98]"
                disabled={isLoading || successMessage}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    Tạo tài khoản
                    <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-slate-400">Hoặc tiếp tục với</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-12 border-2 border-slate-200 bg-card font-medium text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50"
                disabled={isLoading}
                onClick={() => {/* TODO: Google OAuth */}}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-12 border-2 border-slate-200 bg-card font-medium text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50"
                disabled={isLoading}
                onClick={() => {/* TODO: GitHub OAuth */}}
              >
                <Github className="mr-2 h-5 w-5" />
                GitHub
              </Button>
            </div>

            {/* Login Link */}
            <p className="text-center text-sm text-slate-500">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline">
                Đăng nhập
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <Link
          to="/"
          className="mt-8 flex items-center gap-2 text-sm text-slate-500 transition-colors duration-200 hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Về trang chủ</span>
        </Link>
      </div>
    </div>
  );
}
