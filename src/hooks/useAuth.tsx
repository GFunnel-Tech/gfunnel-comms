import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { isInsideGFunnel, onContextChange } from "@/lib/gfunnel-bridge";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isEmbedded: boolean;
  bridgeTimedOut: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  isEmbedded: false,
  bridgeTimedOut: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmbedded] = useState(() => isInsideGFunnel());

  const [bridgeTimedOut, setBridgeTimedOut] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session && isEmbedded) return;
      setLoading(false);
    });

    if (isEmbedded) {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.warn('[GFunnel] Bridge auth_token not received within 5s');
          setBridgeTimedOut(true);
          setLoading(false);
        }
      }, 5000);

      const unsubscribe = onContextChange(async (ctx) => {
        resolved = true;
        clearTimeout(timeout);
        setBridgeTimedOut(false);
        if (ctx.auth_token) {
          try {
            const { error } = await supabase.auth.setSession({
              access_token: ctx.auth_token,
              refresh_token: '',
            });
            if (error) {
              console.error('[GFunnel] Auto-login failed:', error.message);
              setBridgeTimedOut(true);
              setLoading(false);
            }
          } catch (err) {
            console.error('[GFunnel] Auto-login error:', err);
            setBridgeTimedOut(true);
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      });

      return () => {
        clearTimeout(timeout);
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
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, isEmbedded, bridgeTimedOut, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
