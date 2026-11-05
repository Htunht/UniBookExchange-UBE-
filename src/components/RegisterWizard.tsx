import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SymbolView } from "expo-symbols";
import { RegisterInput } from "../services/api";
import { getMajorLabel, getYearLabel } from "../utils/labels";
import { useAppDialog } from "./AppDialogProvider";

interface RegisterWizardProps {
  onComplete: (data: RegisterInput) => Promise<void>;
  onGoToLogin: () => void;
}

const MAJORS = ["CEIT", "EC", "EP", "Civil", "Archi", "ME", "MC"];
const YEARS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year",
  "Final Year",
];

export default function RegisterWizard({
  onComplete,
  onGoToLogin,
}: RegisterWizardProps) {
  const showDialog = useAppDialog();
  const [process, setProcess] = useState<1 | 2>(1);

  // Process 1 fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Process 2 fields
  const [major, setMajor] = useState("CEIT");
  const [year, setYear] = useState("1st Year");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");

  const [loading, setLoading] = useState(false);

  // Validate Process 1 before advancing to Process 2
  const handleNextProcess = () => {
    if (!name.trim()) {
      showDialog("သတိပေးချက်", "အမည်အပြည့်အစုံကို ဖြည့်ပါ။");
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      showDialog("သတိပေးချက်", "မှန်ကန်သော အီးမေးလ်လိပ်စာ ထည့်ပါ။");
      return;
    }
    if (password.length < 6) {
      showDialog("သတိပေးချက်", "စကားဝှက်ကို အနည်းဆုံး ၆ လုံး ထည့်ပါ။");
      return;
    }
    if (password !== confirmPassword) {
      showDialog("သတိပေးချက်", "စကားဝှက်နှစ်ခု မတူပါ။ ပြန်စစ်ပါ။");
      return;
    }

    setProcess(2);
  };

  // Submit complete registration
  const handleSubmit = async () => {
    if (!phone.trim()) {
      showDialog("သတိပေးချက်", "ဖုန်းနံပါတ် ထည့်ပေးပါ။");
      return;
    }
    if (!telegram.trim()) {
      showDialog("သတိပေးချက်", "Telegram အကောင့်အမည် ထည့်ပါ။");
      return;
    }

    setLoading(true);
    try {
      await onComplete({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        major,
        year,
        phone: phone.trim(),
        telegram: telegram.replace(/^@/, "").trim(),
      });
    } catch (error) {
      showDialog(
        "အကောင့်ဖွင့်မရပါ",
        error instanceof Error ? error.message : "စနစ်အတွင်း အမှားဖြစ်နေပါသည်။",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* Step Indicator Header */}
      <View style={styles.stepHeader}>
        <View style={styles.stepIndicatorRow}>
          <View style={[styles.stepDot, process >= 1 && styles.stepDotActive]}>
            {process > 1 ? (
              <SymbolView
                name={{ ios: "checkmark", android: "check", web: "check" }}
                tintColor="#ffffff"
                size={15}
              />
            ) : (
              <Text style={styles.stepDotText}>1</Text>
            )}
          </View>
          <View style={[styles.stepLine, process === 2 && styles.stepLineActive]} />
          <View style={[styles.stepDot, process === 2 && styles.stepDotActive]}>
            <Text style={styles.stepDotText}>2</Text>
          </View>
        </View>
      </View>

      {/* Process 1: Account Credentials */}
      {process === 1 && (
        <View>
          <Text style={styles.label}>အမည်အပြည့်အစုံ</Text>
          <TextInput
            style={styles.input}
            placeholder="ဥပမာ - မောင်မောင်"
            placeholderTextColor="#94A3B8"
            value={name}
            onChangeText={setName}
            autoComplete="name"
          />

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

          <Text style={styles.label}>စကားဝှက် (အနည်းဆုံး ၆ လုံး)</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="new-password"
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

          <Text style={styles.label}>စကားဝှက်ကို ထပ်ရိုက်ပါ</Text>
          <TextInput
            style={styles.input}
            placeholder="စကားဝှက် ထပ်ရိုက်ပါ"
            placeholderTextColor="#94A3B8"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="new-password"
          />

          <TouchableOpacity style={styles.nextBtn} onPress={handleNextProcess}>
            <Text style={styles.nextBtnText}>ရှေ့သို့ဆက်သွားမည်</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Process 2: Student & Contact Details */}
      {process === 2 && (
        <View>
          <Text style={styles.label}>မေဂျာ</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {MAJORS.map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.chip, major === m && styles.chipActive]}
                onPress={() => setMajor(m)}
              >
                <Text
                  style={[
                    styles.chipText,
                    major === m && styles.chipTextActive,
                  ]}
                >
                  {getMajorLabel(m)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>သင်တန်းနှစ် ရွေးပါ</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {YEARS.map((y) => (
              <TouchableOpacity
                key={y}
                style={[styles.chip, year === y && styles.chipActive]}
                onPress={() => setYear(y)}
              >
                <Text
                  style={[
                    styles.chipText,
                    year === y && styles.chipTextActive,
                  ]}
                >
                  {getYearLabel(y)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>ဖုန်းနံပါတ်</Text>
          <TextInput
            style={styles.input}
            placeholder="09xxxxxxxxx"
            placeholderTextColor="#94A3B8"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Telegram အကောင့်အမည် (@ မထည့်ပါနှင့်)</Text>
          <TextInput
            style={styles.input}
            placeholder="username"
            placeholderTextColor="#94A3B8"
            value={telegram}
            onChangeText={setTelegram}
            autoCapitalize="none"
          />

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setProcess(1)}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="နောက်သို့"
            >
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>အကောင့်ဖွင့်မည်</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Switch to Login */}
      <View style={styles.switchRow}>
        <Text style={styles.switchText}>အကောင့်ရှိပြီးသားလား? </Text>
        <TouchableOpacity onPress={onGoToLogin}>
          <Text style={styles.switchLink}>ဝင်ရောက်ရန်</Text>
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
  stepHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  stepIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: {
    backgroundColor: "#0284C7",
  },
  stepDotText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 14,
  },
  stepLine: {
    width: 60,
    height: 3,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: "#0284C7",
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 5,
    marginTop: 6,
  },
  input: {
    minHeight: 48,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#0F172A",
    marginBottom: 10,
  },
  passwordRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: "#0F172A",
  },
  eyeBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
    marginBottom: 10,
  },
  chip: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipActive: {
    backgroundColor: "#0284C7",
    borderColor: "#0284C7",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  chipTextActive: {
    color: "#ffffff",
  },
  nextBtn: {
    backgroundColor: "#0284C7",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  nextBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  backBtn: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "700",
  },
  submitBtn: {
    flex: 2,
    backgroundColor: "#0284C7",
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnDisabled: {
    opacity: 0.65,
  },
  submitBtnText: {
    color: "#ffffff",
    fontSize: 15,
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
