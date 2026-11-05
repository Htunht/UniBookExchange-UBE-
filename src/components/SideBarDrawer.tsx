import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import { UserProfile } from "../services/api";
import { getYearLabel } from "../utils/labels";

export type ActiveTab = "shelf" | "my-books";

interface SideBarDrawerProps {
  visible: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  pendingAppointmentsCount: number;
  onOpenAppointments: () => void;
  onSignOut: () => void;
}

export default function SideBarDrawer({
  visible,
  onClose,
  userProfile,
  activeTab,
  onSelectTab,
  pendingAppointmentsCount,
  onOpenAppointments,
  onSignOut,
}: SideBarDrawerProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.drawer}>
              {/* App Brand & Profile Header */}
              <View style={[styles.drawerHeader, { paddingTop: Math.max(insets.top, 20) }]}>
                <View style={styles.brandRow}>
                  <View style={styles.brandTitleRow}>
                    <SymbolView
                      name={{ ios: "books.vertical.fill", android: "auto_stories", web: "auto_stories" }}
                      tintColor="#0284C7"
                      size={22}
                    />
                    <Text style={styles.brandTitle}>UBE</Text>
                  </View>
                  <Text style={styles.brandSub}>UniBookExchange</Text>
                </View>

                <View style={styles.userCard}>
                  <View style={styles.avatar}>
                    {userProfile?.name ? (
                      <Text style={styles.avatarText}>
                        {userProfile.name.charAt(0).toUpperCase()}
                      </Text>
                    ) : (
                      <SymbolView
                        name={{ ios: "person.fill", android: "person", web: "person" }}
                        tintColor="#ffffff"
                        size={20}
                      />
                    )}
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {userProfile?.name || "ကျောင်းသား"}
                    </Text>
                    <Text style={styles.userEmail} numberOfLines={1}>
                      {userProfile?.email}
                    </Text>
                    {Boolean(userProfile?.year) && (
                      <View style={styles.userYearRow}>
                        <SymbolView
                          name={{ ios: "graduationcap.fill", android: "school", web: "school" }}
                          tintColor="#475569"
                          size={14}
                        />
                        <Text style={styles.userYear}>
                          {getYearLabel(userProfile?.year ?? "")}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* Navigation Menu Items */}
              <ScrollView
                style={styles.menuContainer}
                contentContainerStyle={styles.menuContent}
                showsVerticalScrollIndicator={false}
              >
                {/* 1. အခြားသူများတင်ထားသော စာအုပ်များ */}
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    activeTab === "shelf" && styles.menuItemActive,
                  ]}
                  onPress={() => {
                    onSelectTab("shelf");
                    onClose();
                  }}
                >
                  <SymbolView
                    style={styles.menuIcon}
                    name={{ ios: "books.vertical.fill", android: "auto_stories", web: "auto_stories" }}
                    tintColor="#475569"
                    size={22}
                  />
                  <View style={styles.menuTextContainer}>
                    <Text
                      style={[
                        styles.menuLabel,
                        activeTab === "shelf" && styles.menuLabelActive,
                      ]}
                    >
                      စာအုပ်စင်
                    </Text>
                    <Text style={styles.menuDesc}>အခြားကျောင်းသားများ တင်ထားသောစာအုပ်</Text>
                  </View>
                </TouchableOpacity>

                {/* 2. မိမိတင်ထားသော စာအုပ်များ */}
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    activeTab === "my-books" && styles.menuItemActive,
                  ]}
                  onPress={() => {
                    onSelectTab("my-books");
                    onClose();
                  }}
                >
                  <SymbolView
                    style={styles.menuIcon}
                    name={{ ios: "book.closed.fill", android: "menu_book", web: "menu_book" }}
                    tintColor="#475569"
                    size={22}
                  />
                  <View style={styles.menuTextContainer}>
                    <Text
                      style={[
                        styles.menuLabel,
                        activeTab === "my-books" && styles.menuLabelActive,
                      ]}
                    >
                      မိမိစာအုပ်များ
                    </Text>
                    <Text style={styles.menuDesc}>သင်တင်ထားသော စာအုပ်များ</Text>
                  </View>
                </TouchableOpacity>

                {/* 3. ဝယ်ယူရန် တောင်းဆိုမှုများ */}
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onClose();
                    onOpenAppointments();
                  }}
                >
                  <SymbolView
                    style={styles.menuIcon}
                    name={{ ios: "calendar", android: "calendar_month", web: "calendar_month" }}
                    tintColor="#475569"
                    size={22}
                  />
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuLabel}>ဝယ်ယူရန် တောင်းဆိုမှုများ</Text>
                    <Text style={styles.menuDesc}>ဝယ်သူနှင့် ရောင်းသူ၏ တောင်းဆိုမှုများ</Text>
                  </View>
                  {pendingAppointmentsCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {pendingAppointmentsCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </ScrollView>

              {/* Bottom Sign Out */}
              <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                <TouchableOpacity
                  style={styles.signOutBtn}
                  onPress={() => {
                    onClose();
                    onSignOut();
                  }}
                >
                  <Text style={styles.signOutText}>အကောင့်ထွက်ရန်</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    flexDirection: "row",
  },
  drawer: {
    width: "78%",
    maxWidth: 320,
    backgroundColor: "#ffffff",
    height: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 16,
    display: "flex",
    flexDirection: "column",
  },
  drawerHeader: {
    padding: 20,
    paddingTop: 45,
    backgroundColor: "#E0F2FE",
  },
  brandRow: {
    marginBottom: 16,
  },
  brandTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  brandSub: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    padding: 12,
    borderRadius: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0284C7",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  userEmail: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  userYear: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "600",
  },
  userYearRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  menuContainer: {
    flex: 1,
  },
  menuContent: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 12,
  },
  menuItemActive: {
    backgroundColor: "#E0F2FE",
  },
  menuIcon: {
    width: 24,
    height: 24,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
  },
  menuLabelActive: {
    color: "#0284C7",
  },
  menuDesc: {
    fontSize: 10,
    color: "#A1AAB8",
    marginTop: 2,
  },
  badge: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  signOutBtn: {
    minHeight: 48,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  signOutText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "700",
  },
});
