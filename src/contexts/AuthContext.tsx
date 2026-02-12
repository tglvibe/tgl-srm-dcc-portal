import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "student" | "admin";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  regNumber?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Dummy credentials
const DUMMY_CREDENTIALS = [
  {
    email: "admin@srmist.edu.in",
    password: "admin123",
    user: { id: "ADM001", name: "Dr. Priya Nair", email: "admin@srmist.edu.in", role: "admin" as UserRole },
  },
  {
    email: "student@srmist.edu.in",
    password: "student123",
    user: { id: "STU001", name: "Saswata Thakur", email: "st1540@srmist.edu.in", role: "student" as UserRole, regNumber: "RA2511003011512" },
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, password: string): boolean => {
    const match = DUMMY_CREDENTIALS.find(
      (c) => c.email === email && c.password === password
    );
    if (match) {
      setUser(match.user);
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be within AuthProvider");
  return ctx;
}
