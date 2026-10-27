'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const restoreSession = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        
        if (storedUser && storedToken) {
          const parsedUser: unknown = JSON.parse(storedUser);
          console.log('Parsed user:', parsedUser);
          if (typeof parsedUser === 'object' && parsedUser !== null) {
            const savedUser = parsedUser as Partial<User> & { _id?: string };
            const id = savedUser.id || savedUser._id;

            if (
              typeof id === 'string' &&
              id.length > 0 &&
              typeof savedUser.name === 'string' &&
              typeof savedUser.email === 'string' &&
              typeof savedUser.role === 'string'
            ) {
              console.log('User validation passed');
              setUser({
                id,
                name: savedUser.name,
                email: savedUser.email,
                role: savedUser.role,
              });
              return;
            }
            else{
              console.log('User validation failed:', savedUser);
            }
          }

          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Unable to restore the saved authentication session:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = (userData: User, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    console.log('User passed to AuthContext:', userData);
    router.push(userData.role === 'admin' ? '/admin' : '/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};