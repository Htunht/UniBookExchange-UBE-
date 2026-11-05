import { SymbolView } from "expo-symbols";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type DialogButton = {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void | Promise<void>;
};

type DialogState = {
  title: string;
  message?: string;
  buttons: DialogButton[];
};

type AppDialogContextValue = {
  showDialog: (
    title: string,
    message?: string,
    buttons?: DialogButton[],
  ) => void;
};

const AppDialogContext = createContext<AppDialogContextValue | null>(null);

export function AppDialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const showDialog = useCallback(
    (title: string, message?: string, buttons?: DialogButton[]) => {
      setDialog({
        title,
        message,
        buttons: buttons?.length ? buttons : [{ text: "နားလည်ပါပြီ" }],
      });
    },
    [],
  );

  const contextValue = useMemo(() => ({ showDialog }), [showDialog]);
  const dismiss = () => setDialog(null);

  return (
    <AppDialogContext.Provider value={contextValue}>
      {children}
      <Modal
        animationType="fade"
        transparent
        visible={dialog !== null}
        onRequestClose={dismiss}
      >
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <View style={styles.icon}>
              <SymbolView
                name={{
                  ios: "info.circle.fill",
                  android: "info",
                  web: "info",
                }}
                tintColor="#0284C7"
                size={28}
              />
            </View>
            <Text style={styles.title}>{dialog?.title}</Text>
            {Boolean(dialog?.message) && (
              <Text style={styles.message}>{dialog?.message}</Text>
            )}
            <View
              style={[
                styles.actions,
                (dialog?.buttons.length ?? 0) > 2 && styles.stackedActions,
              ]}
            >
              {dialog?.buttons.map((button, index) => {
                const isDestructive = button.style === "destructive";
                const isCancel = button.style === "cancel";
                return (
                  <TouchableOpacity
                    key={`${button.text}-${index}`}
                    style={[
                      styles.button,
                      isCancel && styles.cancelButton,
                      isDestructive && styles.destructiveButton,
                      dialog.buttons.length === 1 && styles.singleButton,
                    ]}
                    onPress={() => {
                      dismiss();
                      void button.onPress?.();
                    }}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        isCancel && styles.cancelButtonText,
                      ]}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </AppDialogContext.Provider>
  );
}

export function useAppDialog() {
  const context = useContext(AppDialogContext);
  if (!context) {
    throw new Error("useAppDialog must be used within AppDialogProvider");
  }
  return context.showDialog;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    padding: 22,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  icon: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderRadius: 28,
    backgroundColor: "#E0F2FE",
  },
  title: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  message: {
    marginTop: 8,
    color: "#64748B",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginTop: 20,
  },
  stackedActions: {
    flexDirection: "column-reverse",
  },
  button: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#0284C7",
  },
  singleButton: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: "#F1F5F9",
  },
  destructiveButton: {
    backgroundColor: "#DC2626",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  cancelButtonText: {
    color: "#475569",
  },
});
