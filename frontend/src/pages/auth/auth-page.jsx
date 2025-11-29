import { useState, useEffect, forwardRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabaseClient';
import { 
  Loader2, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  Mail,
  Lock,
  User,
  Check,
  X,
  ArrowRight,
  BookOpen,
  Award,
  Users,
  Target
} from 'lucide-react';

// ============================================
// AUTH PAGE - SWISS MINIMALISM DESIGN
// ============================================
// Design Philosophy:
// - Underline-only inputs (no boxes)
// - Monochromatic (black/white) + #FF4D00 accent
// - Whitespace as structure
// - Sharp typography hierarchy
// - Smooth transitions
// ============================================

// ============ VALIDATION SCHEMAS ============
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

// ============ PASSWORD STRENGTH ============
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
  
  if (password.length === 0) {
    strength = 'none';
  } else if (passedChecks <= 2) {
    strength = 'weak';
    label = 'Yếu';
  } else if (passedChecks === 3) {
    strength = 'fair';
    label = 'Trung bình';
  } else if (passedChecks === 4) {
    strength = 'good';
    label = 'Tốt';
  } else {
    strength = 'strong';
    label = 'Mạnh';
  }
  
  return { checks, passedChecks, strength, label };
};

// Password Strength Bar
const PasswordStrengthBar = ({ password }) => {
  const { strength, label, passedChecks } = checkPasswordStrength(password);
  
  if (password.length === 0) return null;
  
  const getColor = (level) => {
    if (level > passedChecks) return 'bg-neutral-200';
    if (passedChecks <= 2) return 'bg-red-500';
    if (passedChecks === 3) return 'bg-orange-500';
    if (passedChecks === 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 transition-all duration-300 ${getColor(level)}`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${
        strength === 'weak' ? 'text-red-600' :
        strength === 'fair' ? 'text-orange-600' :
        strength === 'good' ? 'text-yellow-600' :
        strength === 'strong' ? 'text-green-600' : 'text-neutral-400'
      }`}>
        Độ mạnh: {label}
      </p>
    </div>
  );
};

// Password Requirements
const PasswordRequirements = ({ password, isFocused }) => {
  const { checks } = checkPasswordStrength(password);
  
  const requirements = [
    { key: 'length', label: 'Ít nhất 8 ký tự', passed: checks.length },
    { key: 'lowercase', label: 'Chữ thường (a-z)', passed: checks.lowercase },
    { key: 'uppercase', label: 'Chữ hoa (A-Z)', passed: checks.uppercase },
    { key: 'number', label: 'Số (0-9)', passed: checks.number },
    { key: 'special', label: 'Ký tự đặc biệt', passed: checks.special },
  ];

  if (!isFocused && password.length === 0) return null;

  return (
    <div className="mt-3 p-3 border border-neutral-200 bg-neutral-50/50">
      <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-2">
        Yêu cầu mật khẩu
      </p>
      <div className="grid grid-cols-1 gap-1.5">
        {requirements.map((req) => (
          <div key={req.key} className="flex items-center gap-2">
            {req.passed ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <X className="h-3 w-3 text-neutral-300" />
            )}
            <span className={`text-xs ${req.passed ? 'text-neutral-700' : 'text-neutral-400'}`}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============ INPUT COMPONENT - SWISS STYLE ============
const InputField = forwardRef(({ 
  id, 
  label, 
  type = 'text', 
  placeholder, 
  icon: Icon,
  error, 
  disabled,
  showPasswordToggle,
  showPassword,
  onTogglePassword,
  onFocus: externalOnFocus,
  onBlur: externalOnBlur,
  ...props 
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const handleFocus = (e) => {
    setIsFocused(true);
    externalOnFocus?.(e);
  };
  
  const handleBlur = (e) => {
    setIsFocused(false);
    externalOnBlur?.(e);
  };
  
  return (
    <div className="group">
      {/* Label */}
      <label 
        htmlFor={id} 
        className={`
          block text-[13px] font-medium mb-2 transition-colors duration-200
          ${isFocused ? 'text-neutral-900' : error ? 'text-neutral-500' : 'text-neutral-500'}
        `}
      >
        {label}
      </label>
      
      {/* Input Container */}
      <div className="relative">
        <div className="flex items-center">
          {/* Icon */}
          {Icon && (
            <Icon 
              className={`
                h-[18px] w-[18px] mr-3 transition-colors duration-200
                ${isFocused ? 'text-neutral-900' : 'text-neutral-300'}
              `} 
              strokeWidth={1.5} 
            />
          )}
          
          {/* Input */}
          <input
            ref={ref}
            id={id}
            type={showPasswordToggle ? (showPassword ? 'text' : 'password') : type}
            placeholder={placeholder}
            disabled={disabled}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`
              flex-1 py-2.5 bg-transparent text-neutral-900 text-[15px]
              placeholder:text-neutral-300
              focus:outline-none focus:ring-0 border-none
              disabled:cursor-not-allowed disabled:opacity-50
              [&::-ms-reveal]:hidden [&::-ms-clear]:hidden
              ${showPasswordToggle ? 'pr-10' : ''}
            `}
            {...props}
          />
          
          {/* Password Toggle */}
          {showPasswordToggle && (
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute right-0 p-2 text-neutral-400 hover:text-neutral-700 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.5} />
              ) : (
                <Eye className="h-[18px] w-[18px]" strokeWidth={1.5} />
              )}
            </button>
          )}
        </div>
        
        {/* Underline */}
        <div className="relative h-px bg-neutral-200">
          <div 
            className={`
              absolute inset-0 origin-left transition-transform duration-300
              ${isFocused ? 'bg-neutral-900 scale-x-100' : 'bg-neutral-900 scale-x-0'}
            `}
          />
        </div>
      </div>
      
      {/* Error */}
      {error && (
        <p className="mt-2 text-[12px] text-neutral-500">{error}</p>
      )}
    </div>
  );
});

InputField.displayName = 'InputField';

// ============ LOGIN FORM ============
const LoginForm = ({ onSwitchToRegister, isAnimating }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, getRedirectPath } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = searchParams.get('redirectTo') || getRedirectPath();
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, searchParams, getRedirectPath]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setErrorMessage('Email hoặc mật khẩu không đúng');
        } else if (authError.message.includes('Email not confirmed')) {
          setErrorMessage('Tài khoản chưa được xác thực email');
        } else {
          setErrorMessage(authError.message);
        }
        setIsLoading(false);
        return;
      }
    } catch (err) {
      setErrorMessage('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.');
      console.error('Login error:', err);
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full transition-all duration-500 
                   ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[32px] font-bold text-neutral-900 tracking-tight leading-none">
          Đăng nhập
        </h1>
        <p className="mt-2 text-neutral-400 text-sm">
          Tiếp tục hành trình học tập
        </p>
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="mb-6 p-3 bg-red-50 border-l-2 border-red-500">
          <p className="text-sm text-red-600">{errorMessage}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <InputField
          id="login-email"
          label="Email"
          type="email"
          placeholder="name@company.com"
          icon={Mail}
          error={errors.email?.message}
          disabled={isLoading}
          autoComplete="email"
          {...register('email')}
        />

        <div>
          <InputField
            id="login-password"
            label="Mật khẩu"
            placeholder="••••••••"
            icon={Lock}
            error={errors.password?.message}
            disabled={isLoading}
            autoComplete="current-password"
            showPasswordToggle
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
            {...register('password')}
          />
          <div className="mt-2 text-right">
            <button
              type="button"
              className="text-xs text-neutral-400 hover:text-neutral-900 transition-colors"
            >
              Quên mật khẩu?
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3
                   bg-neutral-900 text-white text-sm font-medium
                   hover:bg-[#FF4D00] transition-colors duration-200
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang xử lý...</span>
            </>
          ) : (
            <>
              <span>Đăng nhập</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-4">
        <div className="flex-1 h-px bg-neutral-200" />
        <span className="text-xs text-neutral-400">hoặc</span>
        <div className="flex-1 h-px bg-neutral-200" />
      </div>

      {/* Social */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={isLoading}
          className="flex items-center justify-center gap-2 py-2.5
                   border border-neutral-200 text-sm
                   hover:border-neutral-400 transition-colors
                   disabled:opacity-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span className="text-neutral-700">Google</span>
        </button>
        
        <button
          type="button"
          disabled={isLoading}
          className="flex items-center justify-center gap-2 py-2.5
                   border border-neutral-200 text-sm
                   hover:border-neutral-400 transition-colors
                   disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          <span className="text-neutral-700">GitHub</span>
        </button>
      </div>

      {/* Switch */}
      <p className="mt-6 text-center text-sm text-neutral-500">
        Chưa có tài khoản?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-neutral-900 font-medium hover:text-[#FF4D00] transition-colors"
        >
          Đăng ký ngay
        </button>
      </p>
    </div>
  );
};

// ============ REGISTER FORM ============
const RegisterForm = ({ onSwitchToLogin, isAnimating }) => {
  const navigate = useNavigate();
  const { isAuthenticated, getRedirectPath } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  const watchedPassword = useWatch({ control, name: 'password', defaultValue: '' });

  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = getRedirectPath();
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, getRedirectPath]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { 
            full_name: data.fullName,
            role: 'STUDENT'
          },
        },
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          setErrorMessage('Email này đã được đăng ký.');
        } else {
          setErrorMessage(error.message);
        }
        return;
      }

      setSuccessMessage('Đăng ký thành công! Vui lòng kiểm tra email để xác thực.');
      
      setTimeout(() => {
        onSwitchToLogin();
      }, 3000);

    } catch (err) {
      setErrorMessage('Đã xảy ra lỗi. Vui lòng thử lại.');
      console.error('Register error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full transition-all duration-500 
                   ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[32px] font-bold text-neutral-900 tracking-tight leading-none">
          Tạo tài khoản
        </h1>
        <p className="mt-2 text-neutral-400 text-sm">
          Bắt đầu hành trình học tập
        </p>
      </div>

      {/* Success */}
      {successMessage && (
        <div className="mb-6 p-3 bg-green-50 border-l-2 border-green-500">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Error */}
      {errorMessage && (
        <div className="mb-6 p-3 bg-red-50 border-l-2 border-red-500">
          <p className="text-sm text-red-600">{errorMessage}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <InputField
          id="register-fullName"
          label="Họ và tên"
          type="text"
          placeholder="Nguyễn Văn A"
          icon={User}
          error={errors.fullName?.message}
          disabled={isLoading}
          autoComplete="name"
          {...register('fullName')}
        />

        <InputField
          id="register-email"
          label="Email"
          type="email"
          placeholder="name@company.com"
          icon={Mail}
          error={errors.email?.message}
          disabled={isLoading}
          autoComplete="email"
          {...register('email')}
        />

        <div>
          <InputField
            id="register-password"
            label="Mật khẩu"
            placeholder="••••••••"
            icon={Lock}
            error={errors.password?.message}
            disabled={isLoading}
            autoComplete="new-password"
            showPasswordToggle
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
            onFocus={() => setIsPasswordFocused(true)}
            onBlur={() => setIsPasswordFocused(false)}
            {...register('password')}
          />
          <PasswordStrengthBar password={watchedPassword} />
          <PasswordRequirements password={watchedPassword} isFocused={isPasswordFocused} />
        </div>

        <InputField
          id="register-confirmPassword"
          label="Xác nhận mật khẩu"
          placeholder="••••••••"
          icon={Lock}
          error={errors.confirmPassword?.message}
          disabled={isLoading}
          autoComplete="new-password"
          showPasswordToggle
          showPassword={showConfirmPassword}
          onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
          {...register('confirmPassword')}
        />

        {/* Terms */}
        <p className="text-xs text-neutral-400 pt-2">
          Bằng việc đăng ký, bạn đồng ý với{' '}
          <Link to="/terms" className="text-neutral-600 hover:text-neutral-900">Điều khoản</Link>
          {' '}và{' '}
          <Link to="/policy" className="text-neutral-600 hover:text-neutral-900">Chính sách bảo mật</Link>
        </p>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || successMessage}
          className="w-full flex items-center justify-center gap-2 py-3
                   bg-neutral-900 text-white text-sm font-medium
                   hover:bg-[#FF4D00] transition-colors duration-200
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang xử lý...</span>
            </>
          ) : (
            <>
              <span>Tạo tài khoản</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch */}
      <p className="mt-6 text-center text-sm text-neutral-500">
        Đã có tài khoản?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-neutral-900 font-medium hover:text-[#FF4D00] transition-colors"
        >
          Đăng nhập
        </button>
      </p>
    </div>
  );
};

// ============ LEFT PANEL ============
const LeftPanel = ({ isLogin }) => {
  const [displayedContent, setDisplayedContent] = useState(isLogin);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  useEffect(() => {
    if (displayedContent !== isLogin) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayedContent(isLogin);
        setTimeout(() => setIsTransitioning(false), 50);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLogin, displayedContent]);

  const loginFeatures = [
    { icon: BookOpen, text: 'Quản lý học viên & lớp học' },
    { icon: Target, text: 'Theo dõi tiến độ học tập' },
    { icon: Award, text: 'Chứng chỉ & thành tích' },
    { icon: Users, text: 'Cộng đồng học viên' },
  ];
  
  const registerFeatures = [
    { icon: BookOpen, text: 'Truy cập 100+ khóa học' },
    { icon: Target, text: 'Lộ trình cá nhân hóa' },
    { icon: Award, text: 'Cam kết đầu ra' },
    { icon: Users, text: 'Hỗ trợ 24/7' },
  ];

  const features = displayedContent ? loginFeatures : registerFeatures;

  return (
    <div className="hidden lg:flex lg:w-1/2 bg-neutral-900 relative overflow-hidden">
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, white 1px, transparent 1px),
            linear-gradient(to bottom, white 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between w-full p-12">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-10 h-10 bg-white flex items-center justify-center rounded-lg">
              <span className="text-sm font-bold text-neutral-900">SM</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#FF4D00] rounded-full" />
          </div>
          <span className="text-lg font-semibold text-white">Skill Master</span>
        </Link>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center max-w-md">
          <div className={`transition-all duration-500 ease-out ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            <h2 className="text-3xl font-bold text-white leading-tight">
              {displayedContent ? (
                <>Chào mừng<br /><span className="text-[#FF4D00]">trở lại</span></>
              ) : (
                <>Bắt đầu<br /><span className="text-[#FF4D00]">hành trình</span></>
              )}
            </h2>
          </div>
          
          <div className={`transition-all duration-500 ease-out delay-75 ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            <p className="mt-4 text-neutral-400 text-sm leading-relaxed">
              {displayedContent 
                ? 'Đăng nhập để tiếp tục hành trình học tập và phát triển kỹ năng.'
                : 'Tham gia cùng 2,400+ học viên đang chinh phục mục tiêu.'
              }
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {features.map((feature, index) => (
              <div 
                key={`${displayedContent}-${index}`}
                className={`
                  flex items-center gap-3 text-neutral-300
                  transition-all duration-500 ease-out
                  ${isTransitioning ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
                `}
                style={{ transitionDelay: `${100 + index * 50}ms` }}
              >
                <div className="w-8 h-8 border border-neutral-700 flex items-center justify-center">
                  <feature.icon className="w-4 h-4" />
                </div>
                <span className="text-sm">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className={`
          grid grid-cols-3 gap-4 pt-6 border-t border-neutral-800
          transition-all duration-500 ease-out delay-300
          ${isTransitioning ? 'opacity-0' : 'opacity-100'}
        `}>
          <div>
            <p className="text-2xl font-bold text-white">2,400+</p>
            <p className="text-xs text-neutral-500">Học viên</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">98%</p>
            <p className="text-xs text-neutral-500">Đạt mục tiêu</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">50+</p>
            <p className="text-xs text-neutral-500">Giáo viên</p>
          </div>
        </div>
      </div>

      {/* Decorative */}
      <div className="absolute bottom-0 right-0 w-48 h-48">
        <div className={`
          absolute bottom-6 right-6 w-20 h-20 border border-neutral-800
          transition-all duration-700 ease-out
          ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
        `} />
        <div className={`
          absolute bottom-12 right-12 w-20 h-20 bg-[#FF4D00]/10
          transition-all duration-700 ease-out delay-100
          ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
        `} />
      </div>
    </div>
  );
};

// ============ MAIN AUTH PAGE ============
export function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(location.pathname !== '/register');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsLogin(location.pathname !== '/register');
  }, [location.pathname]);

  const handleSwitch = (toLogin) => {
    setIsAnimating(true);
    
    setTimeout(() => {
      setIsLogin(toLogin);
      navigate(toLogin ? '/login' : '/register', { replace: true });
      
      setTimeout(() => {
        setIsAnimating(false);
      }, 50);
    }, 300);
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Panel */}
      <LeftPanel isLogin={isLogin} />

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex flex-col relative">
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(to right, #000 1px, transparent 1px),
              linear-gradient(to bottom, #000 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Mobile Logo */}
        <div className="lg:hidden p-4 border-b border-neutral-100">
          <Link to="/" className="flex items-center gap-2">
            <div className="relative">
              <div className="w-9 h-9 bg-neutral-900 flex items-center justify-center rounded-lg">
                <span className="text-xs font-bold text-white">SM</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#FF4D00] rounded-full" />
            </div>
            <span className="font-semibold text-neutral-900">Skill Master</span>
          </Link>
        </div>

        {/* Form Container */}
        <div className="relative flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-[380px]">
            {isLogin ? (
              <LoginForm 
                onSwitchToRegister={() => handleSwitch(false)} 
                isAnimating={isAnimating}
              />
            ) : (
              <RegisterForm 
                onSwitchToLogin={() => handleSwitch(true)} 
                isAnimating={isAnimating}
              />
            )}
          </div>
        </div>

        {/* Back to Home */}
        <div className="relative p-4 lg:px-12 border-t border-neutral-100">
          <Link
            to="/"
            className="group inline-flex items-center gap-2 text-sm text-neutral-400 
                     hover:text-neutral-900 transition-colors"
          >
            <div className="flex items-center justify-center w-7 h-7 border border-neutral-200 
                          group-hover:border-neutral-900 group-hover:bg-neutral-900 
                          transition-all">
              <ArrowLeft className="h-3.5 w-3.5 group-hover:text-white transition-colors" />
            </div>
            <span>Về trang chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Exports
export { AuthPage as LoginPage };
export { AuthPage as RegisterPage };
