import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthBrandHeader from "../components/AuthBrandHeader";
import RegisterWizard from "../components/RegisterWizard";
import { RegisterInput } from "../services/api";

interface RegisterScreenProps {
  onRegister: (data: RegisterInput) => Promise<void>;
  onGoToLogin: () => void;
}

export default function RegisterScreen({
  onRegister,
  onGoToLogin,
}: RegisterScreenProps) {
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
          <AuthBrandHeader />
          <RegisterWizard
            onComplete={onRegister}
            onGoToLogin={onGoToLogin}
          />
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
});

