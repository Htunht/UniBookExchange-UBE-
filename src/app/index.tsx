// src/app/index.tsx
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import DashboardView from "../components/DashboardView";
import ForgotPasswordFlow from "../components/ForgotPasswordFlow";
import LoginForm from "../components/LoginForm";
import RegisterWizard from "../components/RegisterWizard";
import {
  ApiError,
  RegisterInput,
  UserProfile,
  getMyProfile,
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPassword,
  verifyPasswordResetOtp,
} from "../services/api";
import { clearSession, loadSession, saveSession } from "../services/sessionStorage";

type AuthMode = "LOGIN" | "REGISTER" | "FORGOT_PASSWORD";

export default function AuthScreen() {
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
  // LOGIN
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleLogin = async (email: string, password: string) => {
    const result = await loginUser(email, password);
    await saveSession(result.sessionToken, result.user);
    setSessionToken(result.sessionToken);
    setUserProfile(result.user);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // REGISTER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleRegister = async (data: RegisterInput) => {
    const result = await registerUser(data);
    await saveSession(result.sessionToken, result.user);
    setSessionToken(result.sessionToken);
    setUserProfile(result.user);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SIGN OUT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleSignOut = () => {
    void clearSession();
    setSessionToken("");
    setUserProfile(null);
    setAuthMode("LOGIN");
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DASHBOARD (Logged in)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (restoringSession) {
    return <View style={styles.safeArea} />;
  }

  if (sessionToken && userProfile) {
    return (
      <DashboardView
        sessionToken={sessionToken}
        onSignOut={handleSignOut}
        initialUserProfile={userProfile}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.brandContainer}>
            <View style={styles.brandIcon}>
              <SymbolView
                name={{
                  ios: "books.vertical.fill",
                  android: "auto_stories",
                  web: "auto_stories",
                }}
                tintColor="#ffffff"
                size={36}
              />
            </View>
            <Text style={styles.appTitle}>UBE</Text>
            <Text style={styles.appSubtitle}>UniBookExchange</Text>
          </View>

          {authMode === "LOGIN" && (
            <LoginForm
              onLogin={handleLogin}
              onGoToRegister={() => setAuthMode("REGISTER")}
              onForgotPassword={() => setAuthMode("FORGOT_PASSWORD")}
            />
          )}

          {authMode === "REGISTER" && (
            <RegisterWizard
              onComplete={handleRegister}
              onGoToLogin={() => setAuthMode("LOGIN")}
            />
          )}

          {authMode === "FORGOT_PASSWORD" && (
            <ForgotPasswordFlow
              onBackToLogin={() => setAuthMode("LOGIN")}
              onRequestCode={async (email) => {
                await requestPasswordReset(email);
              }}
              onVerifyCode={async (email, otp) => {
                const result = await verifyPasswordResetOtp(email, otp);
                return result.resetToken;
              }}
              onResetPassword={async (email, resetToken, password) => {
                await resetPassword(email, resetToken, password);
              }}
              onComplete={() => setAuthMode("LOGIN")}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F0F9FF",
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    backgroundColor: "#F0F9FF",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 28,
  },
  brandIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "#0284C7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0284C7",
    letterSpacing: 2,
  },
  appSubtitle: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
