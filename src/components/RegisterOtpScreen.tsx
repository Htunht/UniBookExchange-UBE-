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

interface RegisterOtpScreenProps {
  email: string;
  onVerify: (otp: string) => Promise<void>;
  onResendOtp: () => Promise<void>;
  onBack: () => void;
}

export default function RegisterOtpScreen({
  email,
  onVerify,
  onResendOtp,
  onBack,
}: RegisterOtpScreenProps) {
  const showDialog = useAppDialog();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async () => {
    const cleanOtp = otp.trim();
    if (cleanOtp.length < 6) {
      showDialog("သတိပေးချက်", "အတည်ပြုကုဒ် ၆ လုံးလုံး ထည့်ပါ။");
      return;
    }

    setLoading(true);
    try {
      await onVerify(cleanOtp);
    } catch (error) {
      showDialog(
        "အတည်ပြုကုဒ် မှားနေပါသည်",
        error instanceof Error ? error.message : "အတည်ပြုကုဒ်ကို စစ်ဆေး၍ မရပါ။",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    try {
      await onResendOtp();
      setCountdown(60);
      showDialog("ပို့ပြီးပါပြီ", "အတည်ပြုကုဒ်အသစ်ကို အီးမေးလ်သို့ ပို့လိုက်ပါပြီ။");
    } catch (error) {
      showDialog(
        "ပြန်ပို့၍ မရပါ",
        error instanceof Error ? error.message : "အတည်ပြုကုဒ်ကို ပြန်ပို့၍ မရပါ။",
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.card}>
      <SymbolView
        style={styles.icon}
        name={{ ios: "envelope.badge", android: "mark_email_unread", web: "mark_email_unread" }}
        tintColor="#0284C7"
        size={48}
      />
      <Text style={styles.title}>အီးမေးလ်ကို အတည်ပြုပါ</Text>
      <Text style={styles.subtitle}>
        <Text style={styles.boldEmail}>{email}</Text> သို့ ၆ လုံးပါ အတည်ပြုကုဒ် ပို့ထားပါသည်။
      </Text>

      {/* OTP Input */}
      <TextInput
        style={styles.otpInput}
        placeholder="••••••"
        placeholderTextColor="#94A3B8"
        value={otp}
        onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, "").slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
      />

      {/* Verify Button */}
      <TouchableOpacity
        style={[styles.verifyBtn, loading && styles.disabledBtn]}
        onPress={handleVerify}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.verifyBtnText}>အတည်ပြုရန်</Text>
        )}
      </TouchableOpacity>

      {/* Resend Row */}
      <View style={styles.resendRow}>
        <TouchableOpacity
          onPress={handleResend}
          disabled={countdown > 0 || resending}
        >
          <Text
            style={[
              styles.resendLink,
              (countdown > 0 || resending) && styles.resendDisabled,
            ]}
          >
            {countdown > 0
              ? `ကုဒ်ပြန်ပို့ရန် (${countdown} စက္ကန့်)`
              : "ကုဒ်အသစ် ပြန်ပို့ရန်"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backBtnText}>← အချက်အလက် ပြင်ရန်</Text>
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
    alignItems: "center",
  },
  icon: {
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  boldEmail: {
    fontWeight: "700",
    color: "#0284C7",
  },
  otpInput: {
    minHeight: 56,
    backgroundColor: "#F8FAFC",
    borderWidth: 2,
    borderColor: "#0284C7",
    borderRadius: 12,
    width: "100%",
    paddingVertical: 14,
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 12,
    color: "#0F172A",
    marginBottom: 18,
  },
  verifyBtn: {
    backgroundColor: "#0284C7",
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 14,
  },
  disabledBtn: {
    opacity: 0.65,
  },
  verifyBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  resendRow: {
    marginBottom: 12,
  },
  resendLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0284C7",
  },
  resendDisabled: {
    color: "#94A3B8",
    fontWeight: "500",
  },
  backBtn: {
    paddingVertical: 8,
  },
  backBtnText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
});
