// src/app/index.tsx
import { useEffect, useState } from "react";
import { View } from "react-native";
import {
  DashboardScreen,
  ForgotPasswordScreen,
  LoginScreen,
  RegisterScreen,
} from "../screens";
import {
  ApiError,
  RegisterInput,
  UserProfile,
  getMyProfile,
  loginUser,
  registerUser,
} from "../services/api";
import { clearSession, loadSession, saveSession } from "../services/sessionStorage";

type AuthMode = "LOGIN" | "REGISTER" | "FORGOT_PASSWORD";

export default function AppEntry() {
  const [authMode, setAuthMode] = useState<AuthMode>("LOGIN");
  const [sessionToken, setSessionToken] = useState("");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [restoringSession, setRestoringSession] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const stored = await loadSession();
        if (!stored) return;

        try {
          const { user } = await getMyProfile(stored.token);
          if (!active) return;
          setSessionToken(stored.token);
          setUserProfile(user);
          await saveSession(stored.token, user);
        } catch (error) {
          const expired =
            error instanceof ApiError &&
            (error.status === 401 || error.status === 403);
          if (expired) {
            await clearSession();
            return;
          }

          if (!active) return;
          setSessionToken(stored.token);
          setUserProfile(stored.user);
        }
      } finally {
        if (active) setRestoringSession(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // AUTH ACTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleLogin = async (email: string, password: string) => {
    const result = await loginUser(email, password);
    await saveSession(result.sessionToken, result.user);
    setSessionToken(result.sessionToken);
    setUserProfile(result.user);
  };

  const handleRegister = async (data: RegisterInput) => {
    const result = await registerUser(data);
    await saveSession(result.sessionToken, result.user);
    setSessionToken(result.sessionToken);
    setUserProfile(result.user);
  };

  const handleSignOut = () => {
    void clearSession();
    setSessionToken("");
    setUserProfile(null);
    setAuthMode("LOGIN");
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SCREEN RENDERING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (restoringSession) {
    return <View style={{ flex: 1, backgroundColor: "#F0F9FF" }} />;
  }

  if (sessionToken && userProfile) {
    return (
      <DashboardScreen
        sessionToken={sessionToken}
        onSignOut={handleSignOut}
        initialUserProfile={userProfile}
      />
    );
  }

  if (authMode === "REGISTER") {
    return (
      <RegisterScreen
        onRegister={handleRegister}
        onGoToLogin={() => setAuthMode("LOGIN")}
      />
    );
  }

  if (authMode === "FORGOT_PASSWORD") {
    return (
      <ForgotPasswordScreen
        onBackToLogin={() => setAuthMode("LOGIN")}
        onSuccess={() => setAuthMode("LOGIN")}
      />
    );
  }

  return (
    <LoginScreen
      onLogin={handleLogin}
      onGoToRegister={() => setAuthMode("REGISTER")}
      onForgotPassword={() => setAuthMode("FORGOT_PASSWORD")}
    />
  );
}
