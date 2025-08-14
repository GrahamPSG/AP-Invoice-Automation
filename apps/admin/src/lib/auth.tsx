'use client';

import { createContext, useContext } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';

interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  hasRole: (role: string) => boolean;
  isAdmin: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  hasRole: () => false,
  isAdmin: false,
  isManager: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthWrapper>{children}</AuthWrapper>
    </SessionProvider>
  );
}

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  
  const user: AuthUser | null = session?.user ? {
    id: session.user.id || '',
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    role: session.user.role || 'viewer',
  } : null;

  const hasRole = (role: string) => {
    if (!user) return false;
    
    const roles = ['viewer', 'manager', 'admin'];
    const userRoleIndex = roles.indexOf(user.role);
    const requiredRoleIndex = roles.indexOf(role);
    
    return userRoleIndex >= requiredRoleIndex;
  };

  const contextValue: AuthContextType = {
    user,
    loading: status === 'loading',
    hasRole,
    isAdmin: user?.role === 'admin',
    isManager: hasRole('manager'),
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Role-based access control components
export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!isAdmin) return null;
  
  return <>{children}</>;
}

export function ManagerOnly({ children }: { children: React.ReactNode }) {
  const { isManager, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!isManager) return null;
  
  return <>{children}</>;
}

export function RoleGuard({ 
  role, 
  children, 
  fallback 
}: { 
  role: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasRole, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!hasRole(role)) return <>{fallback}</>;
  
  return <>{children}</>;
}