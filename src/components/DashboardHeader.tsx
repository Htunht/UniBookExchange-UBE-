import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { UserProfile } from "../services/api";
import type { ActiveTab } from "./SideBarDrawer";

interface DashboardHeaderProps {
  activeTab: ActiveTab;
  pendingAppointmentsCount: number;
  userProfile: UserProfile | null;
  onOpenDrawer: () => void;
  onOpenAppointments: () => void;
  onOpenProfile: () => void;
}

export default function DashboardHeader({
  activeTab,
  pendingAppointmentsCount,
  userProfile,
  onOpenDrawer,
  onOpenAppointments,
  onOpenProfile,
}: DashboardHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity
          style={styles.hamburgerBtn}
          onPress={onOpenDrawer}
          activeOpacity={0.7}
        >
          <SymbolView
            name={{ ios: "line.3.horizontal", android: "menu", web: "menu" }}
            tintColor="#334155"
            size={21}
          />
        </TouchableOpacity>

        <View style={styles.brandContainer}>
          <View style={styles.appTitleRow}>
            <Image
              source={require("../../assets/images/ube-logo.png")}
              style={styles.brandLogo}
              contentFit="contain"
            />
            <Text style={styles.appTitle}>UBE</Text>
          </View>
          <Text style={styles.tabBadge} numberOfLines={1}>
            {activeTab === "shelf"
              ? "စာအုပ်စင်"
              : activeTab === "my-books"
                ? "မိမိစာအုပ်များ"
                : activeTab === "purchased"
                  ? "မိမိဝယ်ပြီးစာအုပ်များ"
                  : "တောင်းဆိုမှုများ"}
          </Text>
        </View>
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.bellBtn}
          onPress={onOpenAppointments}
          accessibilityRole="button"
          accessibilityLabel="ဝယ်ယူရန် တောင်းဆိုမှုများ"
        >
          <SymbolView
            name={{
              ios: "bell.fill",
              android: "notifications",
              web: "notifications",
            }}
            tintColor="#475569"
            size={20}
          />
          {pendingAppointmentsCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeCount}>
                {pendingAppointmentsCount > 9 ? "9+" : pendingAppointmentsCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.profileBtn}
          onPress={onOpenProfile}
          accessibilityRole="button"
          accessibilityLabel="ကိုယ်ရေးအချက်အလက်"
        >
          {userProfile?.name ? (
            <Text style={styles.profileBtnText}>
              {userProfile.name.charAt(0).toUpperCase()}
            </Text>
          ) : (
            <SymbolView
              name={{ ios: "person.fill", android: "person", web: "person" }}
              tintColor="#ffffff"
              size={20}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hamburgerBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  brandContainer: {
    flexDirection: "column",
    flexShrink: 1,
  },
  appTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  brandLogo: {
    width: 26,
    height: 26,
  },
  appTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#0284C7",
    letterSpacing: -0.3,
  },
  tabBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    marginTop: -1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 8,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeCount: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0284C7",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  profileBtnText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#ffffff",
  },
});
