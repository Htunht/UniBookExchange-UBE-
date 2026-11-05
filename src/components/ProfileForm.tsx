// src/components/ProfileForm.tsx
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface ProfileFormProps {
  name: string;
  setName: (text: string) => void;
  year: string;
  setYear: (text: string) => void;
  phone: string;
  setPhone: (text: string) => void;
  telegram: string;
  setTelegram: (text: string) => void;
  onSave: () => void;
}

export default function ProfileForm({
  name,
  setName,
  year,
  setYear,
  phone,
  setPhone,
  telegram,
  setTelegram,
  onSave,
}: ProfileFormProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.subtitle}>ကိုယ်ရေးအချက်အလက် ဖြည့်ပါ</Text>

      <TextInput
        style={styles.input}
        placeholder="အမည်အပြည့်အစုံ"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="သင်တန်းနှစ် (ဥပမာ - ပထမနှစ်)"
        value={year}
        onChangeText={setYear}
      />
      <TextInput
        style={styles.input}
        placeholder="ဖုန်းနံပါတ်"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Telegram အကောင့်အမည် (@ မပါဘဲ)"
        value={telegram}
        onChangeText={setTelegram}
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.button} onPress={onSave}>
        <Text style={styles.buttonText}>သိမ်းဆည်းရန်</Text>
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
