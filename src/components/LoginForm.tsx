import React, { useState } from "react";
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

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onGoToRegister: () => void;
  onForgotPassword: () => void;
}

export default function LoginForm({
  onLogin,
  onGoToRegister,
  onForgotPassword,
}: LoginFormProps) {
  const showDialog = useAppDialog();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      showDialog("သတိပေးချက်", "အီးမေးလ်လိပ်စာ ထည့်ပါ။");
      return;
    }
    if (!password) {
      showDialog("သတိပေးချက်", "စကားဝှက် ထည့်ပါ။");
      return;
    }

    setLoading(true);
    try {
      await onLogin(cleanEmail, password);
    } catch (error) {
      showDialog(
        "ဝင်ရောက်၍ မရပါ",
        error instanceof Error ? error.message : "အီးမေးလ်လိပ်စာ သို့မဟုတ် စကားဝှက် မှားနေပါသည်။",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>မင်္ဂလာပါ</Text>
      </View>
      <Text style={styles.subtitle}>အကောင့်သို့ ဝင်ရောက်ပါ</Text>

      {/* Email Input */}
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
      />

      {/* Password Input */}
      <Text style={styles.label}>စကားဝှက်</Text>
      <View style={styles.passwordRow}>
        <TextInput
          style={styles.passwordInput}
          placeholder="••••••••"
          placeholderTextColor="#94A3B8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.eyeBtn}
          onPress={() => setShowPassword(!showPassword)}
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

      <TouchableOpacity
        style={styles.forgotPasswordLink}
        onPress={onForgotPassword}
        accessibilityRole="button"
      >
        <Text style={styles.switchLink}>စကားဝှက် မေ့နေပါသလား?</Text>
      </TouchableOpacity>

      {/* Login Button */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>ဝင်ရောက်ရန်</Text>
        )}
      </TouchableOpacity>

      {/* Switch to Register */}
      <View style={styles.switchRow}>
        <Text style={styles.switchText}>အကောင့်မရှိသေးဘူးလား? </Text>
        <TouchableOpacity onPress={onGoToRegister}>
          <Text style={styles.switchLink}>အကောင့်ဖွင့်ရန်</Text>
        </TouchableOpacity>
      </View>
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
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 20,
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
  passwordRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    marginBottom: 16,
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
  forgotPasswordLink: {
    alignSelf: "flex-end",
    paddingVertical: 6,
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
    fontSize: 16,
    fontWeight: "800",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  switchText: {
    fontSize: 13,
    color: "#64748B",
  },
  switchLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0284C7",
  },
});
