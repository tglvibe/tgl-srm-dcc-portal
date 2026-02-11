import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "student" | "admin" | "backend";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  regNumber?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_USERS: Record<UserRole, User> = {
  student: {
    id: "STU001",
    name: "Arjun Sharma",
    email: "arjun.sharma@srmist.edu.in",
    role: "student",
    department: "Computer Science",
    regNumber: "RA2211003010234",
  },
  admin: {
    id: "ADM001",
    name: "Dr. Priya Nair",
    email: "priya.nair@srmist.edu.in",
    role: "admin",
    department: "Placement Office",
  },
  backend: {
    id: "BKD001",
    name: "Rahul Verma",
    email: "rahul.verma@srmist.edu.in",
    role: "backend",
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (_email: string, _password: string, role: UserRole) => {
    setUser(MOCK_USERS[role]);
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
