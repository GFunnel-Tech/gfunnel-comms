import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { isInsideGFunnel, onContextChange } from "@/lib/gfunnel-bridge";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isEmbedded: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  isEmbedded: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmbedded] = useState(() => isInsideGFunnel());

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // If embedded and no session yet, wait for bridge token before clearing loading
      if (!session && isEmbedded) return;
      setLoading(false);
    });

    // Auto-login via GFunnel bridge when embedded
    if (isEmbedded) {
      const unsubscribe = onContextChange(async (ctx) => {
        if (ctx.auth_token) {
          try {
            // The parent GFunnel platform provides a valid Supabase session token
            const { error } = await supabase.auth.setSession({
              access_token: ctx.auth_token,
              refresh_token: '', // GFunnel manages token refresh
            });
            if (error) {
              console.error('[GFunnel] Auto-login failed:', error.message);
              setLoading(false);
            }
            // onAuthStateChange will handle setting session + loading=false
          } catch (err) {
            console.error('[GFunnel] Auto-login error:', err);
            setLoading(false);
          }
        } else {
          // No auth token from parent — stop loading
          setLoading(false);
        }
      });
      return () => {
        subscription.unsubscribe();
        unsubscribe();
      };
    }

    return () => subscription.unsubscribe();
  }, [isEmbedded]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, isEmbedded, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
