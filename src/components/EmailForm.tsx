import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface EmailFormProps {
  email: string;
  setEmail: (text: string) => void;
  onSendOTP: () => void;
}

export default function EmailForm({
  email,
  setEmail,
  onSendOTP,
}: EmailFormProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.subtitle}>ကျောင်းသားအီးမေးလ်လိပ်စာ ထည့်ပါ</Text>
      <TextInput
        style={styles.input}
        placeholder="student@university.edu.mm"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.button} onPress={onSendOTP}>
        <Text style={styles.buttonText}>အတည်ပြုကုဒ် ပို့ရန်</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 5,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
