import React, { useState } from "react";
import { SymbolView } from "expo-symbols";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppDialog } from "./AppDialogProvider";
import { Book, CreateBookInput } from "../services/api";
import {
  getConditionLabel,
  getMajorLabel,
  getYearLabel,
} from "../utils/labels";
import {
  ALL_MAJORS_VALUE,
  getAllowedBookYears,
  getCourseYearRule,
} from "../utils/courseRules";

interface AddBookModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (book: CreateBookInput) => Promise<void>;
  initialBook?: Book | null;
}

const MAJORS = ["CEIT", "EC", "EP", "Civil", "Archi", "ME", "MC"];
const CONDITIONS = ["Brand New", "Like New", "Good", "Used"];

export default function AddBookModal({
  visible,
  onClose,
  onSubmit,
  initialBook,
}: AddBookModalProps) {
  const showDialog = useAppDialog();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState(initialBook?.title ?? "");
  const [major, setMajor] = useState(initialBook?.major ?? "CEIT");
  const [year, setYear] = useState(initialBook?.year ?? "1st Year");
  const [price, setPrice] = useState(initialBook ? String(initialBook.price) : "");
  const [isFree, setIsFree] = useState(initialBook?.price === 0);
  const [condition, setCondition] = useState(initialBook?.condition ?? "Good");
  const [description, setDescription] = useState(initialBook?.description ?? "");
  const [loading, setLoading] = useState(false);
  const courseYearRule = getCourseYearRule(title);
  const availableYears = getAllowedBookYears(courseYearRule);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    const rule = getCourseYearRule(value);
    if (!rule) return;

    setMajor(ALL_MAJORS_VALUE);
    const allowedYears = getAllowedBookYears(rule);
    if (!allowedYears.includes(year)) {
      setYear(allowedYears[allowedYears.length - 1]);
    }
  };

  const resetForm = () => {
    setTitle("");
    setMajor("CEIT");
    setYear("1st Year");
    setPrice("");
    setIsFree(false);
    setCondition("Good");
    setDescription("");
  };

  const handlePost = async () => {
    if (!title.trim()) {
      showDialog("သတိပေးချက်", "စာအုပ်အမည် ဖြည့်ပါ။");
      return;
    }

    const numericPrice = isFree ? 0 : parseInt(price.replace(/[^0-9]/g, "") || "0", 10);

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        major,
        year,
        price: numericPrice,
        condition,
        description: description.trim() || undefined,
        author: initialBook?.author ?? undefined,
        imageUrl: initialBook?.imageUrl ?? undefined,
      });
      resetForm();
      onClose();
      showDialog(
        "ပြီးပါပြီ",
        initialBook ? "စာအုပ်အချက်အလက်ကို ပြင်ဆင်ပြီးပါပြီ။" : "စာအုပ်ကို တင်ပြီးပါပြီ။",
      );
    } catch (error) {
      showDialog(
        initialBook ? "စာအုပ်ပြင်ဆင်၍ မရပါ" : "စာအုပ်တင်၍ မရပါ",
        error instanceof Error ? error.message : "စာအုပ်တင်၍ မရပါ။",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoiding}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
        <View
          style={[
            styles.sheet,
            {
              marginTop: Math.max(insets.top, 12),
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {initialBook ? "စာအုပ်ပြင်ဆင်ရန်" : "စာအုပ်တင်ရန်"}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <SymbolView
                name={{ ios: "xmark", android: "close", web: "close" }}
                tintColor="#64748B"
                size={16}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.formContent}
          >
            {/* Title */}
            <Text style={styles.label}>စာအုပ်အမည်</Text>
            <TextInput
              style={styles.input}
              placeholder="စာအုပ်အမည် ရိုက်ထည့်ပါ"
              placeholderTextColor="#94A3B8"
              value={title}
              onChangeText={handleTitleChange}
            />

            {/* Major */}
            <Text style={styles.label}>မေဂျာ</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {[ALL_MAJORS_VALUE, ...MAJORS]
                .filter((m) => !courseYearRule || m === ALL_MAJORS_VALUE)
                .map((m) => (
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
            {courseYearRule && (
              <Text style={styles.ruleHint}>
                ဒီဘာသာရပ်ကို မေဂျာအားလုံး သင်ယူရသောကြောင့် မေဂျာအားလုံးကို
                အလိုအလျောက် ရွေးထားပါသည်။
              </Text>
            )}

            {/* Year */}
            <Text style={styles.label}>သင်တန်းနှစ်</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {availableYears.map((y) => (
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

            {/* Price */}
            <View style={styles.priceHeader}>
              <Text style={styles.label}>ဈေးနှုန်း (ကျပ်)</Text>
              <View style={styles.freeToggle}>
                <Text style={styles.freeToggleText}>ညှိနှိုင်းမည်</Text>
                <Switch
                  value={isFree}
                  onValueChange={setIsFree}
                  trackColor={{ false: "#CBD5E1", true: "#7DD3FC" }}
                  thumbColor={isFree ? "#0284C7" : "#F8FAFC"}
                  accessibilityLabel="ညှိနှိုင်းမည်ကို ရွေးရန်"
                />
              </View>
            </View>

            {!isFree && (
              <TextInput
                style={styles.input}
                placeholder="ဈေးနှုန်း ထည့်ပါ"
                placeholderTextColor="#94A3B8"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            )}

            {/* Condition */}
            <Text style={styles.label}>စာအုပ်အခြေအနေ</Text>
            <View style={styles.conditionGrid}>
              {CONDITIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.conditionOption,
                    condition === c && styles.conditionActive,
                  ]}
                  onPress={() => setCondition(c)}
                >
                  <Text
                    style={[
                      styles.conditionOptionText,
                      condition === c && styles.conditionTextActive,
                    ]}
                  >
                    {getConditionLabel(c)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Description */}
            <Text style={styles.label}>အခြားအချက်အလက် (မဖြစ်မနေ မဟုတ်ပါ)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="စာမျက်နှာပျောက်ခြင်း၊ မှတ်သားထားခြင်း စသည်တို့ကို ရေးပါ"
              placeholderTextColor="#94A3B8"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handlePost}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {initialBook ? "ပြင်ဆင်မှုသိမ်းမည်" : "စာအုပ်တင်ရန်"}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  keyboardAvoiding: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "90%",
  },
  formContent: {
    paddingBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 7,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#0F172A",
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
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
  ruleHint: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 2,
  },
  priceHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    gap: 8,
  },
  freeToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  freeToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  conditionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  conditionOption: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  conditionActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#0284C7",
  },
  conditionOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  conditionTextActive: {
    color: "#0284C7",
  },
  submitBtn: {
    backgroundColor: "#0284C7",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
