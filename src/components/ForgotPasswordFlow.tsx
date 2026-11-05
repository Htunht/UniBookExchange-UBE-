import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SymbolView } from "expo-symbols";
import { useAppDialog } from "./AppDialogProvider";

type Step = "email" | "otp" | "password";

interface ForgotPasswordFlowProps {
  onBackToLogin: () => void;
  onRequestCode: (email: string) => Promise<void>;
  onVerifyCode: (email: string, otp: string) => Promise<string>;
  onResetPassword: (
    email: string,
    resetToken: string,
    password: string,
  ) => Promise<void>;
  onComplete: () => void;
}

export default function ForgotPasswordFlow({
  onBackToLogin,
  onRequestCode,
  onVerifyCode,
  onResetPassword,
  onComplete,
}: ForgotPasswordFlowProps) {
  const showDialog = useAppDialog();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((remaining) => remaining - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const goBack = () => {
    if (step === "email") {
      onBackToLogin();
    } else if (step === "password") {
      setStep("otp");
    } else {
      setStep("email");
    }
  };

  const handleRequestCode = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      showDialog("သတိပေးချက်", "မှန်ကန်သော အီးမေးလ်လိပ်စာ ထည့်ပါ။");
      return;
    }

    setLoading(true);
    try {
      await onRequestCode(cleanEmail);
      setEmail(cleanEmail);
      setOtp("");
      setResetToken("");
      setStep("otp");
      setCountdown(60);
    } catch (error) {
      showDialog(
        "အတည်ပြုကုဒ် ပို့၍ မရပါ",
        error instanceof Error ? error.message : "ခဏစောင့်ပြီး ပြန်စမ်းပါ။",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (resetToken) {
      setStep("password");
      return;
    }
    if (otp.length !== 6) {
      showDialog("သတိပေးချက်", "အတည်ပြုကုဒ် ၆ လုံးလုံး ထည့်ပါ။");
      return;
    }

    setLoading(true);
    try {
      const token = await onVerifyCode(email, otp);
      setResetToken(token);
      setStep("password");
    } catch (error) {
      showDialog(
        "အတည်ပြုကုဒ် မှားနေပါသည်",
        error instanceof Error ? error.message : "အတည်ပြုကုဒ်ကို စစ်ဆေး၍ မရပါ။",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    setLoading(true);
    try {
      await onRequestCode(email);
      setOtp("");
      setResetToken("");
      setCountdown(60);
      showDialog("ပို့ပြီးပါပြီ", "အကောင့်ရှိပါက အတည်ပြုကုဒ်အသစ် ပို့ထားပါသည်။");
    } catch (error) {
      showDialog(
        "ပြန်ပို့၍ မရပါ",
        error instanceof Error ? error.message : "အတည်ပြုကုဒ်ကို ပြန်ပို့၍ မရပါ။",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (password.length < 6) {
      showDialog("သတိပေးချက်", "စကားဝှက်အသစ်ကို အနည်းဆုံး ၆ လုံး ထည့်ပါ။");
      return;
    }
    if (password.length > 100) {
      showDialog("သတိပေးချက်", "စကားဝှက်အသစ်သည် စာလုံး ၁၀၀ ထက် မကျော်ရပါ။");
      return;
    }
    if (password !== confirmPassword) {
      showDialog("သတိပေးချက်", "စကားဝှက်နှစ်ခု မတူပါ။ ပြန်စစ်ပါ။");
      return;
    }

    setLoading(true);
    try {
      await onResetPassword(email, resetToken, password);
      onComplete();
      showDialog(
        "စကားဝှက် ပြောင်းပြီးပါပြီ",
        "စကားဝှက်အသစ်ဖြင့် အကောင့်ဝင်ပါ။",
      );
    } catch (error) {
      showDialog(
        "စကားဝှက် ပြောင်း၍ မရပါ",
        error instanceof Error ? error.message : "အချက်အလက်များကို ပြန်စစ်ပြီး ထပ်လုပ်ပါ။",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backIcon}
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="နောက်သို့"
        >
          <SymbolView
            name={{ ios: "arrow.left", android: "arrow_back", web: "arrow_back" }}
            tintColor="#475569"
            size={20}
          />
        </TouchableOpacity>
        <View style={styles.headerIcon}>
          <SymbolView
            name={{
              ios: step === "email" ? "key.fill" : step === "otp" ? "envelope.fill" : "lock.fill",
                android: step === "email" ? "key" : step === "otp" ? "mark_email_unread" : "lock",
                web: step === "email" ? "key" : step === "otp" ? "mark_email_unread" : "lock",
            }}
            tintColor="#0284C7"
            size={24}
          />
        </View>
      </View>

      <Text style={styles.title}>
        {step === "email"
          ? "စကားဝှက် မေ့နေပါသလား"
          : step === "otp"
            ? "အတည်ပြုကုဒ် ထည့်ပါ"
            : "စကားဝှက်အသစ် သတ်မှတ်ပါ"}
      </Text>
      <Text style={styles.subtitle}>
        {step === "email"
          ? "အီးမေးလ်လိပ်စာ ထည့်ပါ။ အတည်ပြုကုဒ် ပို့ပေးပါမည်။"
          : step === "otp"
            ? `${email} သို့ ပို့ထားသော ၆ လုံးပါ အတည်ပြုကုဒ်ကို ထည့်ပါ။`
            : "စကားဝှက်အသစ်ကို ထည့်ပြီး ထပ်မံအတည်ပြုပါ။"}
      </Text>

      {step === "email" && (
        <>
          <Text style={styles.label}>အီးမေးလ်လိပ်စာ</Text>
          <TextInput
            style={styles.input}
            placeholder="example@gmail.com"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
          />
        </>
      )}

      {step === "otp" && (
        <>
          <TextInput
            style={styles.otpInput}
            placeholder="••••••"
            placeholderTextColor="#94A3B8"
            value={otp}
            onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, "").slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
          />
          <TouchableOpacity
            onPress={handleResendCode}
            disabled={countdown > 0 || loading}
            accessibilityRole="button"
          >
            <Text style={[styles.resendLink, countdown > 0 && styles.resendDisabled]}>
              {countdown > 0
                ? `ကုဒ်ပြန်ပို့ရန် (${countdown} စက္ကန့်)`
                : "ကုဒ်အသစ် ပြန်ပို့ရန်"}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {step === "password" && (
        <>
          <Text style={styles.label}>စကားဝှက်အသစ်</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              placeholder="အနည်းဆုံး ၆ လုံး"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              maxLength={100}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword((shown) => !shown)}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? "စကားဝှက် ဖျောက်ရန်" : "စကားဝှက် ပြရန်"}
            >
              <SymbolView
                name={{
                  ios: showPassword ? "eye.slash" : "eye",
                  android: showPassword ? "visibility_off" : "visibility",
                  web: showPassword ? "visibility_off" : "visibility",
                }}
                tintColor="#64748B"
                size={20}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>စကားဝှက်အသစ်ကို ထပ်ထည့်ပါ</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              placeholder="စကားဝှက်ကို ထပ်ရိုက်ပါ"
              placeholderTextColor="#94A3B8"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              maxLength={100}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowConfirmPassword((shown) => !shown)}
              accessibilityRole="button"
              accessibilityLabel={showConfirmPassword ? "စကားဝှက် ဖျောက်ရန်" : "စကားဝှက် ပြရန်"}
            >
              <SymbolView
                name={{
                  ios: showConfirmPassword ? "eye.slash" : "eye",
                  android: showConfirmPassword ? "visibility_off" : "visibility",
                  web: showConfirmPassword ? "visibility_off" : "visibility",
                }}
                tintColor="#64748B"
                size={20}
              />
            </TouchableOpacity>
          </View>
        </>
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={
          step === "email"
            ? handleRequestCode
            : step === "otp"
              ? handleVerifyCode
              : handleResetPassword
        }
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>
            {step === "email"
              ? "အတည်ပြုကုဒ် ပို့ရန်"
              : step === "otp"
                ? "ဆက်လုပ်ရန်"
                : "စကားဝှက် ပြောင်းရန်"}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.loginLink} onPress={onBackToLogin}>
        <Text style={styles.loginLinkText}>အကောင့်ဝင်ရန် ပြန်သွားမည်</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    width: "100%",
    padding: 18,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  backIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 21,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    minHeight: 48,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 13,
    fontSize: 15,
    color: "#0F172A",
    marginBottom: 12,
  },
  otpInput: {
    minHeight: 56,
    backgroundColor: "#F8FAFC",
    borderWidth: 2,
    borderColor: "#0284C7",
    borderRadius: 12,
    paddingVertical: 13,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 10,
    color: "#0F172A",
    marginBottom: 12,
  },
  resendLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0284C7",
    textAlign: "center",
    marginBottom: 12,
  },
  resendDisabled: {
    color: "#94A3B8",
    fontWeight: "500",
  },
  passwordRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 13,
    fontSize: 15,
    color: "#0F172A",
  },
  eyeBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    backgroundColor: "#0284C7",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  loginLink: {
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 8,
  },
  loginLinkText: {
    color: "#0284C7",
    fontSize: 13,
    fontWeight: "700",
  },
});
