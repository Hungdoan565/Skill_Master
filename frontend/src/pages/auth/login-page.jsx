import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
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
  Github
} from 'lucide-react';

// Campus images for left panel
import centerClassroom from '@/assets/landing/center/modern-classroom.png';
import centerReception from '@/assets/landing/center/reception.png';
import centerStudyCorner from '@/assets/landing/center/study-corner.png';
import centerClassInProgress from '@/assets/landing/center/class-in-progress.png';

// Schema validation với Zod
const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Vui lòng nhập email' })
    .email({ message: 'Email không hợp lệ' }),
  password: z
    .string()
    .min(1, { message: 'Vui lòng nhập mật khẩu' })
    .min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' }),
});

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signInWithEmail } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Nếu đã đăng nhập rồi, redirect về dashboard
  useEffect(() => {
    if (user) {
      const redirectTo = searchParams.get('redirectTo') || '/admin/dashboard';
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate, searchParams]);

  // Xử lý đăng nhập
  const onSubmit = async (data) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const { error } = await signInWithEmail(data.email, data.password);

      if (error) {
        // Map các lỗi Supabase sang tiếng Việt thân thiện
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage('Email hoặc mật khẩu không đúng');
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMessage('Tài khoản chưa được xác thực email');
        } else {
          setErrorMessage(error.message);
        }
        return;
      }

      // Đăng nhập thành công -> redirect
      const redirectTo = searchParams.get('redirectTo') || '/admin/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setErrorMessage('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Immersive Campus Showcase */}
      <div className="hidden w-1/2 lg:flex relative overflow-hidden">
        {/* Rotating background photos — auto crossfade */}
        {[
          { src: centerClassroom, alt: 'Phòng học hiện đại' },
          { src: centerReception, alt: 'Lễ tân tư vấn' },
          { src: centerStudyCorner, alt: 'Góc tự học' },
          { src: centerClassInProgress, alt: 'Lớp đang học' },
        ].map((photo, i) => (
          <img
            key={i}
            src={photo.src}
            alt={photo.alt}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms]"
            style={{
              opacity: 'var(--photo-opacity)',
              animationName: 'login-photo-cycle',
              animationDuration: '20s',
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
              animationDelay: `${i * 5}s`,
            }}
          />
        ))}

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent z-10" />

        {/* Animated accent glow */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full blur-[100px] bg-red-600/20 z-10
          animate-pulse" />
        <div className="absolute bottom-1/4 right-10 w-60 h-60 rounded-full blur-[80px] bg-indigo-600/15 z-10
          animate-pulse [animation-delay:2s]" />

        {/* Content overlay */}
        <div className="relative z-20 flex flex-col justify-between h-full p-12">
          
          {/* Top — Logo */}
          <Link to="/" className="inline-flex items-center gap-3 transition-opacity duration-200 hover:opacity-80 w-fit">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-xl border border-white/20">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Skill Master</span>
          </Link>

          {/* Center — Hero copy */}
          <div className="space-y-6 max-w-md">
            <h1 className="text-5xl font-bold leading-[1.1] text-white tracking-tight">
              Chào mừng
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-300">
                trở lại
              </span>
            </h1>
            <p className="text-white/60 text-base leading-relaxed">
              Đăng nhập để tiếp tục hành trình học tập và phát triển kỹ năng.
            </p>
          </div>

          {/* Bottom — Testimonial card + stats */}
          <div className="space-y-6">
            {/* Glassmorphism testimonial */}
            <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15
              max-w-md">
              <p className="text-white/90 text-sm leading-relaxed italic">
                "Sau 4 tháng học, mình đã đạt IELTS 7.5 từ mức 5.5. Phương pháp học rất hiệu quả 
                và giáo viên rất tận tâm."
              </p>
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/10">
                <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold">MA</span>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Nguyễn M.A.</p>
                  <p className="text-white/40 text-xs">Sinh viên ĐH Bách Khoa</p>
                </div>
                <span className="ml-auto px-2.5 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-semibold">
                  IELTS 7.5
                </span>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-8">
              {[
                { value: '2,400+', label: 'Học viên' },
                { value: '98%', label: 'Đạt mục tiêu' },
                { value: '50+', label: 'Khóa học' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-white/40">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Photo cycle animation */}
        <style>{`
          @keyframes login-photo-cycle {
            0%, 20% { opacity: 1; }
            25%, 95% { opacity: 0; }
            100% { opacity: 1; }
          }
        `}</style>
      </div>

      {/* Right Panel - Login Form */}
      <div className="relative flex w-full flex-col items-center justify-center bg-slate-50 px-6 py-12 lg:w-1/2">
        <Card className="w-full max-w-md border-0 bg-white shadow-xl">
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
            <CardTitle className="text-2xl font-bold text-slate-900">Đăng nhập</CardTitle>
            <CardDescription className="text-slate-500">
              Đăng nhập để tiếp tục sử dụng Skill Master
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 pt-2">
            {/* Error Alert */}
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 animate-in fade-in slide-in-from-top-2 duration-200">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email Field - với icon */}
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
                      flex h-12 w-full rounded-lg border-2 bg-white pl-11 pr-4 text-slate-900
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

              {/* Password Field - với icon */}
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
                    autoComplete="current-password"
                    disabled={isLoading}
                    className={`
                      flex h-12 w-full rounded-lg border-2 bg-white pl-11 pr-12 text-slate-900
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
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              {/* Forgot Password - căn phải */}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-indigo-600 transition-colors duration-200 hover:text-indigo-800 hover:underline"
                  onClick={() => {/* TODO: Forgot password */}}
                >
                  Quên mật khẩu?
                </button>
              </div>

              {/* Submit Button - gradient với text trắng */}
              <Button
                type="submit"
                size="lg"
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-base font-semibold transition-all duration-200 hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    Đăng nhập
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
                <span className="bg-white px-3 text-slate-400">Hoặc tiếp tục với</span>
              </div>
            </div>

            {/* Social Login - 2 nút ngang như TaskFlow */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-12 border-2 border-slate-200 bg-white font-medium text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50"
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
                className="h-12 border-2 border-slate-200 bg-white font-medium text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50"
                disabled={isLoading}
                onClick={() => {/* TODO: GitHub OAuth */}}
              >
                <Github className="mr-2 h-5 w-5" />
                GitHub
              </Button>
            </div>

            {/* Register Link */}
            <p className="text-center text-sm text-slate-500">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Back to Home - ở dưới cùng giữa */}
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
