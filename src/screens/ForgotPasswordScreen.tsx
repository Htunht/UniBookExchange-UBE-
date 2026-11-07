import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthBrandHeader from "../components/AuthBrandHeader";
import ForgotPasswordFlow from "../components/ForgotPasswordFlow";
import {
  requestPasswordReset,
  resetPassword,
  verifyPasswordResetOtp,
} from "../services/api";

interface ForgotPasswordScreenProps {
  onBackToLogin: () => void;
  onSuccess: () => void;
}

export default function ForgotPasswordScreen({
  onBackToLogin,
  onSuccess,
}: ForgotPasswordScreenProps) {
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
          <ForgotPasswordFlow
            onBackToLogin={onBackToLogin}
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
            onComplete={onSuccess}
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

