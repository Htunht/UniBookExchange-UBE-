import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import { Book, UserProfile } from "../services/api";
import { getMajorLabel, getYearLabel } from "../utils/labels";
import { useAppDialog } from "./AppDialogProvider";

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  myBooks: Book[];
  onDeleteBook: (bookId: string) => Promise<void>;
  onOpenBook: (book: Book) => void;
  onSignOut: () => void;
  onRefresh: () => void;
  onSaveProfile: (profile: {
    name: string;
    email: string;
    year: string;
    phone: string;
    telegram: string;
  }) => Promise<void>;
}

export default function ProfileModal({
  visible,
  onClose,
  userProfile,
  myBooks,
  onDeleteBook,
  onOpenBook,
  onSignOut,
  onRefresh,
  onSaveProfile,
}: ProfileModalProps) {
  const showDialog = useAppDialog();
  const insets = useSafeAreaInsets();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileYear, setProfileYear] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileTelegram, setProfileTelegram] = useState("");

  const startProfileEdit = () => {
    if (!userProfile) return;
    setProfileName(userProfile.name ?? "");
    setProfileEmail(userProfile.email);
    setProfileYear(userProfile.year ?? "");
    setProfilePhone(userProfile.phone ?? "");
    setProfileTelegram(userProfile.telegram ?? "");
    setEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await onSaveProfile({
        name: profileName.trim(),
        email: profileEmail.trim(),
        year: profileYear.trim(),
        phone: profilePhone.trim(),
        telegram: profileTelegram.trim().replace(/^@/, ""),
      });
      setEditingProfile(false);
      showDialog("ပြီးပါပြီ", "ကိုယ်ရေးအချက်အလက်ကို သိမ်းဆည်းပြီးပါပြီ။");
    } catch (error) {
      showDialog(
        "သိမ်းဆည်း၍ မရပါ",
        error instanceof Error ? error.message : "ကိုယ်ရေးအချက်အလက်ကို သိမ်း၍ မရပါ။",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const confirmDelete = (book: Book) => {
    showDialog(
      "စာအုပ်ကို ဖျက်မလား?",
      `"${book.title}" ကို ဖျက်ပါမည်။ ဆက်လုပ်မလား?`,
      [
        { text: "မဖျက်တော့ပါ", style: "cancel" },
        {
          text: "ဖျက်မည်",
          style: "destructive",
          onPress: async () => {
            setDeletingId(book.id);
            try {
              await onDeleteBook(book.id);
              showDialog("ပြီးပါပြီ", "စာအုပ်ကို ဖျက်လိုက်ပါပြီ။");
            } catch (error) {
              showDialog(
                "ဖျက်၍ မရပါ",
                error instanceof Error ? error.message : "ဖျက်၍ မရပါ။",
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  const handleSignOut = () => {
    showDialog(
      "အကောင့်ထွက်မည်",
      "အကောင့်မှ ထွက်မလား?",
      [
        { text: "မထွက်ပါ", style: "cancel" },
        {
          text: "ထွက်မည်",
          style: "destructive",
          onPress: () => {
            onClose();
            onSignOut();
          },
        },
      ],
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
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
            <Text style={styles.headerTitle}>ကိုယ်ရေးအချက်အလက်</Text>
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
            contentContainerStyle={styles.content}
          >
            {/* User Info Card */}
            <View style={styles.profileCard}>
              <View style={styles.avatar}>
                {userProfile?.name ? (
                  <Text style={styles.avatarText}>
                    {userProfile.name.charAt(0).toUpperCase()}
                  </Text>
                ) : (
                  <SymbolView
                    name={{ ios: "person.fill", android: "person", web: "person" }}
                    tintColor="#ffffff"
                    size={34}
                  />
                )}
              </View>
              <Text style={styles.nameText}>
                {userProfile?.name || "အမည် မရှိပါ"}
              </Text>
              <Text style={styles.emailText}>{userProfile?.email}</Text>

              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <SymbolView
                    name={{ ios: "graduationcap.fill", android: "school", web: "school" }}
                    tintColor="#0284C7"
                    size={20}
                  />
                  <Text style={styles.infoSeparator}>-</Text>
                  <View style={styles.infoText}>
                    <Text style={styles.infoLabel}>သင်တန်းနှစ်</Text>
                    <Text style={styles.infoValue}>
                      - {userProfile?.year ? getYearLabel(userProfile.year) : "-"}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoItem}>
                  <SymbolView
                    name={{ ios: "phone.fill", android: "call", web: "call" }}
                    tintColor="#0284C7"
                    size={20}
                  />
                  <Text style={styles.infoSeparator}>-</Text>
                  <View style={styles.infoText}>
                    <Text style={styles.infoLabel}>ဖုန်းနံပါတ်</Text>
                    <Text style={styles.infoValue}>
                      - {userProfile?.phone || "-"}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoItem}>
                  <SymbolView
                    name={{ ios: "paperplane.fill", android: "send", web: "send" }}
                    tintColor="#0284C7"
                    size={20}
                  />
                  <Text style={styles.infoSeparator}>-</Text>
                  <View style={styles.infoText}>
                    <Text style={styles.infoLabel}>Telegram</Text>
                    <Text style={styles.infoValue}>
                      - {userProfile?.telegram
                        ? `@${userProfile.telegram.replace(/^@/, "")}`
                        : "-"}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.editProfileButton}
                onPress={startProfileEdit}
                accessibilityRole="button"
              >
                <Text style={styles.editProfileButtonText}>ကိုယ်ရေးအချက်အလက် ပြင်ဆင်ရန်</Text>
              </TouchableOpacity>
            </View>

            {editingProfile && (
              <View style={styles.profileEditor}>
                <Text style={styles.editorTitle}>ကိုယ်ရေးအချက်အလက် ပြင်ဆင်ရန်</Text>
                <Text style={styles.inputLabel}>Username / အမည်</Text>
                <TextInput
                  style={styles.profileInput}
                  value={profileName}
                  onChangeText={setProfileName}
                  placeholder="အမည်"
                  autoCapitalize="words"
                  maxLength={100}
                />
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.profileInput}
                  value={profileEmail}
                  onChangeText={setProfileEmail}
                  placeholder="name@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={254}
                />
                <Text style={styles.inputLabel}>သင်တန်းနှစ်</Text>
                <TextInput
                  style={styles.profileInput}
                  value={profileYear}
                  onChangeText={setProfileYear}
                  placeholder="ဥပမာ - 1st Year"
                  autoCapitalize="words"
                  maxLength={40}
                />
                <Text style={styles.inputLabel}>ဖုန်းနံပါတ်</Text>
                <TextInput
                  style={styles.profileInput}
                  value={profilePhone}
                  onChangeText={setProfilePhone}
                  placeholder="ဖုန်းနံပါတ်"
                  keyboardType="phone-pad"
                  maxLength={30}
                />
                <Text style={styles.inputLabel}>Telegram username</Text>
                <TextInput
                  style={styles.profileInput}
                  value={profileTelegram}
                  onChangeText={setProfileTelegram}
                  placeholder="username"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={32}
                />
                <View style={styles.editorActions}>
                  <TouchableOpacity
                    style={styles.cancelEditButton}
                    onPress={() => setEditingProfile(false)}
                    disabled={savingProfile}
                  >
                    <Text style={styles.cancelEditText}>မသိမ်းတော့ပါ</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveProfileButton, savingProfile && styles.disabledButton]}
                    onPress={handleSaveProfile}
                    disabled={savingProfile}
                  >
                    {savingProfile ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.saveProfileText}>သိမ်းမည်</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* My Books Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                မိမိတင်ထားသော စာအုပ်များ ({myBooks.length})
              </Text>
              <TouchableOpacity onPress={onRefresh}>
                <Text style={styles.refreshText}>ပြန်စစ်ရန်</Text>
              </TouchableOpacity>
            </View>

            {myBooks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <SymbolView
                  style={styles.emptyEmoji}
                  name={{ ios: "shippingbox.fill", android: "inventory_2", web: "inventory_2" }}
                  tintColor="#0284C7"
                  size={34}
                />
                <Text style={styles.emptyText}>
                  စာအုပ် မတင်ရသေးပါ။
                </Text>
              </View>
            ) : (
              myBooks.map((b) => (
                <View key={b.id} style={styles.myBookCard}>
                    <TouchableOpacity
                      style={styles.myBookInfo}
                      onPress={() => onOpenBook(b)}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                      accessibilityLabel={`${b.title}, մանրամասները բացել`}
                    >
                      <Text style={styles.myBookTitle} numberOfLines={1}>
                        {b.title}
                      </Text>
                    <Text style={styles.myBookSub}>
                      {getMajorLabel(b.major)} • {getYearLabel(b.year)} •{" "}
                      {b.price === 0
                        ? "အခမဲ့"
                        : `${b.price.toLocaleString()} ကျပ်`}
                    </Text>
                    <View
                      style={[
                        styles.bookStatusBadge,
                        b.status === "SOLD" && styles.bookStatusSold,
                      ]}
                    >
                      <Text
                        style={[
                          styles.bookStatusText,
                          b.status === "SOLD" && styles.bookStatusSoldText,
                        ]}
                      >
                        {b.status === "SOLD" ? "ရောင်းပြီး" : "ရရှိနိုင်"}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.bookActions}>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => confirmDelete(b)}
                      disabled={deletingId === b.id}
                    >
                      {deletingId === b.id ? (
                        <ActivityIndicator size="small" color="#DC2626" />
                      ) : (
                        <Text style={styles.deleteText}>ဖျက်ရန်</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            {/* Sign Out Button */}
            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
              <Text style={styles.signOutText}>အကောင့်ထွက်ရန်</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
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
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    maxHeight: "92%",
  },
  content: {
    paddingBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerTitle: {
    flex: 1,
    flexShrink: 1,
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  profileCard: {
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  editProfileButton: {
    marginTop: 10,
    alignSelf: "stretch",
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 9,
    backgroundColor: "#E0F2FE",
  },
  editProfileButtonText: {
    color: "#0369A1",
    fontSize: 13,
    fontWeight: "700",
  },
  profileEditor: {
    padding: 14,
    marginBottom: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#ffffff",
  },
  editorTitle: {
    marginBottom: 4,
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
  },
  inputLabel: {
    marginTop: 10,
    marginBottom: 5,
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
  },
  profileInput: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 9,
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
    fontSize: 14,
  },
  editorActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 16,
  },
  cancelEditButton: {
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9,
    backgroundColor: "#F1F5F9",
  },
  cancelEditText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "700",
  },
  saveProfileButton: {
    minWidth: 92,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9,
    backgroundColor: "#0284C7",
  },
  disabledButton: {
    opacity: 0.65,
  },
  saveProfileText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#0284C7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
  },
  nameText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2,
  },
  emailText: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 8,
  },
  infoGrid: {
    width: "100%",
    backgroundColor: "transparent",
    borderRadius: 12,
    paddingTop: 4,
    gap: 4,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    gap: 10,
  },
  infoText: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoSeparator: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  infoLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    textAlign: "left",
  },
  infoValue: {
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "700",
    textAlign: "left",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  refreshText: {
    fontSize: 12,
    color: "#0284C7",
    fontWeight: "600",
  },
  emptyContainer: {
    padding: 18,
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  emptyEmoji: {
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748B",
  },
  myBookCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 8,
    gap: 8,
  },
  myBookInfo: {
    flex: 1,
  },
  bookActions: {
    alignItems: "flex-end",
    gap: 6,
  },
  myBookTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  myBookSub: {
    fontSize: 12,
    color: "#64748B",
  },
  bookStatusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  bookStatusSold: {
    backgroundColor: "#FEE2E2",
  },
  bookStatusText: {
    color: "#15803D",
    fontSize: 11,
    fontWeight: "700",
  },
  bookStatusSoldText: {
    color: "#B91C1C",
  },
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#FEE2E2",
  },
  deleteText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
  },
  signOutBtn: {
    backgroundColor: "#FEF2F2",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 14,
    marginBottom: 24,
  },
  signOutText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "700",
  },
});
