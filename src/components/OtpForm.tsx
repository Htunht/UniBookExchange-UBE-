import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface OtpFormProps {
  otp: string;
  setOtp: (text: string) => void;
  onVerify: () => void;
  onBack: () => void;
}

export default function OtpForm({
  otp,
  setOtp,
  onVerify,
  onBack,
}: OtpFormProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.subtitle}>အီးမေးလ်ထဲမှ အတည်ပြုကုဒ် ၆ လုံး ထည့်ပါ</Text>
      <TextInput
        style={[
          styles.input,
          { fontSize: 24, letterSpacing: 10, textAlign: "center" },
        ]}
        placeholder="• • • • • •"
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={6}
      />
      <TouchableOpacity style={styles.button} onPress={onVerify}>
        <Text style={styles.buttonText}>အတည်ပြုရန်</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{ marginTop: 15 }} onPress={onBack}>
        <Text style={{ textAlign: "center", color: "#007bff" }}>
          အီးမေးလ်လိပ်စာ ပြင်ရန်
        </Text>
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
  },
  button: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 5,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
