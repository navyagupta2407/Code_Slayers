import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "../services/supabase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('citizen'); // citizen | verifier | admin
  const [loading, setLoading] = useState(true);

  const determineRole = (sessionUser) => {
    if (!sessionUser) return 'citizen';
    // Check local test override first (for smooth hackathon persona switching)
    const localOverride = localStorage.getItem(`dl_role_${sessionUser.id}`);
    if (localOverride) return localOverride;

    return sessionUser.user_metadata?.role || 'citizen';
  };

  const updateRole = async (newRole) => {
    if (!user) return;
    setRole(newRole);
    localStorage.setItem(`dl_role_${user.id}`, newRole);
    try {
      await supabase.auth.updateUser({
        data: { role: newRole },
      });
    } catch (err) {
      console.warn("Could not sync role to Supabase metadata:", err.message);
    }
  };

  useEffect(() => {
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) console.error("Session error:", error.message);
      const u = session?.user ?? null;
      setUser(u);
      setRole(determineRole(u));
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setRole(determineRole(u));
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading, updateRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
