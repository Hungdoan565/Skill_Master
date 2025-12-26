import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { SplashLoader } from '@/components/ui/splash-loader';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Hàm lấy profile từ bảng public.users
  const fetchUserProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return null;
    }

    try {
      console.log('[AuthContext] Fetching profile for:', userId);

      // Profile query with avatar_url (cleaned up heavy Base64 already)
      const profilePromise = supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          phone,
          avatar_url,
          role_id,
          center_id,
          roles (
            id,
            code,
            name
          ),
          centers!users_center_id_fkey (
            id,
            name
          )
        `)
        .eq('id', userId)
        .single();

      // Fast timeout - 5 seconds
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      );


      const { data, error } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]);

      console.log('[AuthContext] Raw Supabase response:', { data, error });

      if (error) {
        console.error('[AuthContext] Error fetching profile:', error);
        // Đừng set null ngay lập tức nếu chỉ là lỗi mạng/timeout
        return null;
      }

      if (!data) {
        console.error('[AuthContext] No data returned from profile query');
        return null;
      }

      console.log('[AuthContext] Profile loaded:', data?.full_name, '| Role:', data?.roles?.code, '| Avatar:', data?.avatar_url?.substring(0, 50));
      setProfile(data);
      return data;
    } catch (err) {
      console.error('[AuthContext] Unexpected error during fetchUserProfile:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('[AuthContext] Initializing...');

        // 1. Lấy session hiện tại
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (!mounted) return;

        console.log('[AuthContext] Initial session:', currentSession ? 'Found' : 'None');

        if (currentSession?.user) {
          // 2. Set user trước để không bị stuck
          setSession(currentSession);
          setUser(currentSession.user);

          // 3. Fetch profile với timeout để tránh treo vô hạn
          try {
            console.log('[AuthContext] Fetching profile for:', currentSession.user.id);

            const profilePromise = supabase
              .from('users')
              .select(`
                id,
                full_name,
                email,
                phone,
                avatar_url,
                role_id,
                center_id,
                roles (
                  id,
                  code,
                  name
                ),
                centers!users_center_id_fkey (
                  id,
                  name
                )
              `)
              .eq('id', currentSession.user.id)
              .single();

            // Fast timeout - 5 seconds
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
            );

            const { data: profileData, error: profileError } = await Promise.race([
              profilePromise,
              timeoutPromise
            ]);

            if (profileError) {
              console.error('[AuthContext] Profile fetch error:', profileError);
            } else if (profileData) {
              console.log('[AuthContext] Profile loaded:', profileData?.full_name);
              if (mounted) setProfile(profileData);
            }
          } catch (profileErr) {
            console.error('[AuthContext] Profile fetch failed:', profileErr.message);
          }
        } else {
          // Không có session
          if (mounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        }
      } catch (error) {
        console.error('[AuthContext] Init error:', error);
      } finally {
        // LUÔN LUÔN tắt loading
        if (mounted) {
          setInitialized(true);
          console.log('[AuthContext] Initialization complete');
        }
      }
    };

    initAuth();

    // Lắng nghe auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('[AuthContext] Auth event:', event);

        if (!mounted) return;

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
        } else if (event === 'SIGNED_IN' && currentSession?.user) {
          // Set user ngay lập tức
          setSession(currentSession);
          setUser(currentSession.user);

          // Fetch profile với timeout
          try {
            console.log('[AuthContext] SIGNED_IN - Fetching profile for:', currentSession.user.id);

            const profilePromise = supabase
              .from('users')
              .select(`
                id,
                full_name,
                email,
                phone,
                avatar_url,
                role_id,
                center_id,
                roles (
                  id,
                  code,
                  name
                ),
                centers!users_center_id_fkey (
                  id,
                  name
                )
              `)
              .eq('id', currentSession.user.id)
              .single();

            // Fast timeout - 5 seconds
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
            );

            const { data: profileData, error: profileError } = await Promise.race([
              profilePromise,
              timeoutPromise
            ]);

            if (profileError) {
              console.error('[AuthContext] SIGNED_IN - Profile fetch error:', profileError);
            } else if (profileData) {
              console.log('[AuthContext] SIGNED_IN - Profile loaded:', profileData?.full_name);
              if (mounted) setProfile(profileData);
            }
          } catch (err) {
            console.error('[AuthContext] SIGNED_IN - Profile fetch failed:', err.message);
          }
        } else if (event === 'TOKEN_REFRESHED') {
          if (mounted) {
            setSession(currentSession);
          }
        } else if (event === 'INITIAL_SESSION') {
          // Bỏ qua event này vì initAuth đã xử lý
          console.log('[AuthContext] INITIAL_SESSION event ignored (handled by initAuth)');
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sign in
  const signInWithEmail = async (email, password) => {
    const result = await supabase.auth.signInWithPassword({ email, password });
    return result;
  };

  // Sign out
  const signOut = async () => {
    setProfile(null);
    const result = await supabase.auth.signOut();
    return result;
  };

  // Refresh profile (sau khi update avatar/info)
  const refreshProfile = useCallback(async () => {
    if (!user?.id) return null;
    const freshProfile = await fetchUserProfile(user.id);
    if (freshProfile) {
      setProfile(freshProfile); // <<< BUG FIX: Actually update the state!
    }
    return freshProfile;
  }, [user, fetchUserProfile]);

  // Hàm tiện ích kiểm tra role
  const hasRole = useCallback((roleCode) => {
    return profile?.roles?.code === roleCode;
  }, [profile]);

  const isAdmin = useCallback(() => {
    return ['SUPER_ADMIN', 'CENTER_MANAGER'].includes(profile?.roles?.code);
  }, [profile]);

  // Kiểm tra có phải là CENTER_MANAGER không (không phải SUPER_ADMIN)
  const isManager = useCallback(() => {
    return profile?.roles?.code === 'CENTER_MANAGER';
  }, [profile]);

  // Kiểm tra có phải SUPER_ADMIN không
  const isSuperAdmin = useCallback(() => {
    return profile?.roles?.code === 'SUPER_ADMIN';
  }, [profile]);

  // Lấy center_id của user (dùng để filter dữ liệu cho CENTER_MANAGER)
  const getCenterId = useCallback(() => {
    return profile?.center_id || null;
  }, [profile]);

  const isTeacher = useCallback(() => {
    return profile?.roles?.code === 'TEACHER';
  }, [profile]);

  const isStudent = useCallback(() => {
    return profile?.roles?.code === 'STUDENT';
  }, [profile]);

  // Hàm lấy redirect path dựa trên role
  const getRedirectPath = useCallback(() => {
    const roleCode = profile?.roles?.code;

    // Nếu có role từ profile
    if (roleCode) {
      switch (roleCode) {
        case 'SUPER_ADMIN':
        case 'CENTER_MANAGER':
          return '/admin/dashboard';
        case 'TEACHER':
          return '/teacher/schedule';
        case 'STUDENT':
          return '/student/schedule';
        default:
          return '/';
      }
    }

    // Không có profile nhưng có user - fallback dựa vào email
    if (user?.email) {
      // Admin email -> admin dashboard
      if (user.email.includes('admin') || user.email.endsWith('@skillmaster.edu.vn')) {
        console.log('[AuthContext] getRedirectPath: No profile, but admin email detected -> /admin/dashboard');
        return '/admin/dashboard';
      }
    }

    // Mặc định về trang chủ
    console.warn('[AuthContext] getRedirectPath: No role found, redirecting to home');
    return '/';
  }, [profile, user]);

  // Check xem user đã authenticated chưa
  // Cho phép login ngay cả khi chưa có profile trong bảng users (ví dụ: chưa chạy SQL schema)
  const isAuthenticated = !!user;

  const value = {
    session,
    user,
    profile,
    setProfile,
    initialized,
    isAuthenticated,
    signInWithEmail,
    signOut,
    fetchUserProfile,
    refreshProfile,
    hasRole,
    isAdmin,
    isManager,
    isSuperAdmin,
    getCenterId,
    isTeacher,
    isStudent,
    getRedirectPath,
  };

  // Chờ init xong mới render children
  if (!initialized) {
    return <SplashLoader />;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook để dùng Auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
