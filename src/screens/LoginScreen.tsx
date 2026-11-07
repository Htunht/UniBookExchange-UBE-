import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthBrandHeader from "../components/AuthBrandHeader";
import LoginForm from "../components/LoginForm";

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onGoToRegister: () => void;
  onForgotPassword: () => void;
}

export default function LoginScreen({
  onLogin,
  onGoToRegister,
  onForgotPassword,
}: LoginScreenProps) {
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
          <LoginForm
            onLogin={onLogin}
            onGoToRegister={onGoToRegister}
            onForgotPassword={onForgotPassword}
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

