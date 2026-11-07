import React, { useEffect, useState } from "react";
import { SymbolView } from "expo-symbols";
import {
  ActivityIndicator,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Appointment } from "../services/api";
import { getYearLabel } from "../utils/labels";
import { useAppDialog } from "./AppDialogProvider";

interface AppointmentsModalProps {
  visible: boolean;
  onClose: () => void;
  incomingAppointments: Appointment[];
  myRequests: Appointment[];
  onAccept: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onRefresh: () => void;
  unseenAcceptedCount: number;
  onViewSentRequests?: () => void;
}

export default function AppointmentsModal({
  visible,
  onClose,
  incomingAppointments,
  myRequests,
  onAccept,
  onReject,
  onRefresh,
  unseenAcceptedCount,
  onViewSentRequests,
}: AppointmentsModalProps) {
  const showDialog = useAppDialog();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"incoming" | "requests">("incoming");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pendingIncomingCount = incomingAppointments.filter(
    (a) => a.status === "PENDING",
  ).length;

  useEffect(() => {
    if (!visible) return;
    if (pendingIncomingCount === 0 && unseenAcceptedCount > 0) {
      setActiveTab("requests");
    }
    onViewSentRequests?.();
  }, [onViewSentRequests, pendingIncomingCount, unseenAcceptedCount, visible]);

  const handleAccept = async (apt: Appointment) => {
    showDialog(
      "တောင်းဆိုမှုကို လက်ခံမလား?",
      `"${apt.book.title}" ကို ဝယ်ယူလိုသူထံ သင့်ဖုန်းနံပါတ်နှင့် Telegram အကောင့်အမည်ကို မျှဝေပါမည်။`,
      [
        { text: "မလုပ်တော့ပါ", style: "cancel" },
        {
          text: "လက်ခံမည်",
          onPress: async () => {
            setProcessingId(apt.id);
            try {
              await onAccept(apt.id);
              showDialog("ပြီးပါပြီ", "တောင်းဆိုမှုကို လက်ခံလိုက်ပါပြီ။");
            } catch (error) {
              showDialog(
                "လက်ခံ၍ မရပါ",
                error instanceof Error ? error.message : "လက်ခံ၍ မရပါ။",
              );
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    );
  };

  const handleReject = async (apt: Appointment) => {
    showDialog(
      "တောင်းဆိုမှုကို ငြင်းပယ်မလား?",
      `"${apt.book.title}" အတွက် ဝယ်ယူရန် တောင်းဆိုမှုကို ငြင်းပယ်မလား?`,
      [
        { text: "မလုပ်တော့ပါ", style: "cancel" },
        {
          text: "ငြင်းပယ်မည်",
          style: "destructive",
          onPress: async () => {
            setProcessingId(apt.id);
            try {
              await onReject(apt.id);
              showDialog("ပြီးပါပြီ", "တောင်းဆိုမှုကို ငြင်းပယ်လိုက်ပါပြီ။");
            } catch (error) {
              showDialog(
                "ငြင်းပယ်၍ မရပါ",
                error instanceof Error ? error.message : "ငြင်းပယ်၍ မရပါ။",
              );
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    );
  };

  const openPhone = (phone?: string | null) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, "")}`).catch(() => {
      showDialog("အမှား", "ဖုန်းခေါ်၍ မရပါ။");
    });
  };

  const openTelegram = (telegram?: string | null) => {
    if (!telegram) return;
    Linking.openURL(`https://t.me/${telegram.replace(/^@/, "").trim()}`).catch(() => {
      showDialog("အမှား", "Telegram ဖွင့်၍ မရပါ။");
    });
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
            <Text style={styles.headerTitle}>ဝယ်ယူရန် တောင်းဆိုမှုများ</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <SymbolView
                name={{ ios: "xmark", android: "close", web: "close" }}
                tintColor="#64748B"
                size={16}
              />
            </TouchableOpacity>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "incoming" && styles.activeTab]}
              onPress={() => setActiveTab("incoming")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "incoming" && styles.activeTabText,
                ]}
              >
                လက်ခံရရှိသည်
                {pendingIncomingCount > 0 && ` (${pendingIncomingCount})`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === "requests" && styles.activeTab]}
              onPress={() => {
                setActiveTab("requests");
                onViewSentRequests?.();
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "requests" && styles.activeTabText,
                ]}
              >
                ပို့ထားသည်
                {unseenAcceptedCount > 0 && ` (${unseenAcceptedCount})`}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.appointmentsList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {/* ဝယ်သူများထံမှ ရောက်လာသော တောင်းဆိုမှုများ */}
            {activeTab === "incoming" && (
              <View>
                {incomingAppointments.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <SymbolView
                      style={styles.emptyIcon}
                      name={{ ios: "tray.fill", android: "inbox", web: "inbox" }}
                      tintColor="#0284C7"
                      size={40}
                    />
                    <Text style={styles.emptyTitle}>
                      တောင်းဆိုမှု မရှိသေးပါ
                    </Text>
                    <Text style={styles.emptySub}>
                      သင့်စာအုပ်ကို ဝယ်ယူလိုသူ၏ တောင်းဆိုမှုများ ဒီမှာ ပေါ်လာပါမည်။
                    </Text>
                  </View>
                ) : (
                  incomingAppointments.map((apt) => {
                    const isPending = apt.status === "PENDING";
                    const isAccepted = apt.status === "ACCEPTED";
                    const isRejected = apt.status === "REJECTED";

                    return (
                      <View key={apt.id} style={styles.card}>
                        <View style={styles.cardTop}>
                          <View style={styles.bookTitleRow}>
                            <SymbolView
                              name={{ ios: "book.closed.fill", android: "menu_book", web: "menu_book" }}
                              tintColor="#0284C7"
                              size={16}
                            />
                            <Text style={styles.bookTitle} numberOfLines={1}>
                              {apt.book.title}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.statusBadge,
                              isAccepted && styles.badgeAccepted,
                              isPending && styles.badgePending,
                              isRejected && styles.badgeRejected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusBadgeText,
                                isAccepted && styles.textAccepted,
                                isPending && styles.textPending,
                                isRejected && styles.textRejected,
                              ]}
                            >
                              {isAccepted
                                ? "လက်ခံပြီး"
                                : isPending
                                  ? "စောင့်နေသည်"
                                  : "ငြင်းပယ်ပြီး"}
                            </Text>
                          </View>
                        </View>

                        {/* Message from System */}
                        <Text style={styles.notifyText}>
                          ဤစာအုပ်ကို ဝယ်ယူရန် တောင်းဆိုထားပါသည်။
                        </Text>

                        <View style={styles.buyerBox}>
                          <View style={styles.personRow}>
                            <SymbolView
                              name={{ ios: "person.fill", android: "person", web: "person" }}
                              tintColor="#334155"
                              size={15}
                            />
                            <Text style={styles.buyerName}>
                              ဝယ်ယူလိုသူ: {apt.buyer?.name || "ကျောင်းသား"}{" "}
                              {apt.buyer?.year
                                ? `(${getYearLabel(apt.buyer.year)})`
                                : ""}
                            </Text>
                          </View>

                          {isPending && (
                            <Text style={styles.pendingPrivacyHint}>
                              လက်ခံပြီးမှသာ သင့်ဖုန်းနံပါတ်နှင့် Telegram အကောင့်အမည်ကို ဝယ်ယူလိုသူအား ပြသပါမည်။
                            </Text>
                          )}

                          {isAccepted && (
                            <View style={styles.contactRow}>
                              {Boolean(apt.buyer?.phone) && (
                                <TouchableOpacity
                                  style={[styles.smallBtn, styles.phoneBtn]}
                                  onPress={() => openPhone(apt.buyer?.phone)}
                                >
                                  <View style={styles.buttonLabelRow}>
                                    <SymbolView
                                      name={{ ios: "phone.fill", android: "call", web: "call" }}
                                      tintColor="#ffffff"
                                      size={14}
                                    />
                                    <Text style={styles.smallBtnText}>{apt.buyer?.phone}</Text>
                                  </View>
                                </TouchableOpacity>
                              )}
                              {Boolean(apt.buyer?.telegram) && (
                                <TouchableOpacity
                                  style={[styles.smallBtn, styles.tgBtn]}
                                  onPress={() => openTelegram(apt.buyer?.telegram)}
                                >
                                  <View style={styles.buttonLabelRow}>
                                    <SymbolView
                                      name={{ ios: "paperplane.fill", android: "send", web: "send" }}
                                      tintColor="#ffffff"
                                      size={14}
                                    />
                                    <Text style={styles.smallBtnText}>
                                      @{apt.buyer?.telegram?.replace(/^@/, "")}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              )}
                            </View>
                          )}
                        </View>

                        {isPending && (
                          <View style={styles.actionRow}>
                            <TouchableOpacity
                              style={[
                                styles.acceptBtn,
                                processingId === apt.id && styles.disabledBtn,
                              ]}
                              onPress={() => handleAccept(apt)}
                              disabled={processingId === apt.id}
                            >
                              {processingId === apt.id ? (
                                <ActivityIndicator color="#ffffff" size="small" />
                              ) : (
                                <View style={styles.buttonLabelRow}>
                                  <SymbolView
                                    name={{ ios: "checkmark", android: "check", web: "check" }}
                                    tintColor="#ffffff"
                                    size={16}
                                  />
                                  <Text style={styles.acceptBtnText}>လက်ခံမည်</Text>
                                </View>
                              )}
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[
                                styles.rejectBtn,
                                processingId === apt.id && styles.disabledBtn,
                              ]}
                              onPress={() => handleReject(apt)}
                              disabled={processingId === apt.id}
                            >
                              <View style={styles.buttonLabelRow}>
                                <SymbolView
                                  name={{ ios: "xmark", android: "close", web: "close" }}
                                  tintColor="#64748B"
                                  size={16}
                                />
                                <Text style={styles.rejectBtnText}>ငြင်းပယ်ရန်</Text>
                              </View>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* ကိုယ်တိုင်ပို့ထားသော တောင်းဆိုမှုများ */}
            {activeTab === "requests" && (
              <View>
                {myRequests.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <SymbolView
                      style={styles.emptyIcon}
                      name={{ ios: "books.vertical.fill", android: "auto_stories", web: "auto_stories" }}
                      tintColor="#0284C7"
                      size={40}
                    />
                    <Text style={styles.emptyTitle}>
                      တောင်းဆိုထားမှု မရှိသေးပါ
                    </Text>
                    <Text style={styles.emptySub}>
                      စာအုပ်တစ်အုပ်ကို ရွေးပြီး “ဝယ်ယူရန် တောင်းဆိုမည်” ကို နှိပ်ပါ။
                    </Text>
                  </View>
                ) : (
                  myRequests.map((req) => {
                    const isPending = req.status === "PENDING";
                    const isAccepted = req.status === "ACCEPTED";
                    const isRejected = req.status === "REJECTED";

                    return (
                      <View key={req.id} style={styles.card}>
                        <View style={styles.cardTop}>
                          <View style={styles.bookTitleRow}>
                            <SymbolView
                              name={{ ios: "book.closed.fill", android: "menu_book", web: "menu_book" }}
                              tintColor="#0284C7"
                              size={16}
                            />
                            <Text style={styles.bookTitle} numberOfLines={1}>
                              {req.book.title}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.statusBadge,
                              isAccepted && styles.badgeAccepted,
                              isPending && styles.badgePending,
                              isRejected && styles.badgeRejected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusBadgeText,
                                isAccepted && styles.textAccepted,
                                isPending && styles.textPending,
                                isRejected && styles.textRejected,
                              ]}
                            >
                              {isAccepted
                                ? "လက်ခံပြီး"
                                : isPending
                                  ? "စောင့်နေသည်"
                                  : "ငြင်းပယ်ပြီး"}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.personRow}>
                          <SymbolView
                            name={{ ios: "person.fill", android: "person", web: "person" }}
                            tintColor="#64748B"
                            size={15}
                          />
                          <Text style={styles.sellerRowText}>
                            ရောင်းသူ: {req.seller?.name || "ကျောင်းသား"}
                          </Text>
                        </View>

                        {isPending && (
                          <View style={styles.pendingBuyerNotice}>
                            <View style={styles.statusRow}>
                              <SymbolView
                                name={{ ios: "clock.fill", android: "schedule", web: "schedule" }}
                                tintColor="#B45309"
                                size={16}
                              />
                              <Text style={styles.pendingBuyerNoticeText}>
                                ရောင်းသူက လက်ခံပါက ဖုန်းနံပါတ်နှင့် Telegram အကောင့်အမည် ပေါ်လာပါမည်။
                              </Text>
                            </View>
                          </View>
                        )}

                        {isAccepted && (
                          <View style={styles.acceptedBuyerSection}>
                            <View style={styles.statusRow}>
                              <SymbolView
                                name={{ ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" }}
                                tintColor="#16A34A"
                                size={16}
                              />
                              <Text style={styles.acceptedBuyerTitle}>
                                ရောင်းသူက လက်ခံလိုက်ပါပြီ။ ဆက်သွယ်ရန်:
                              </Text>
                            </View>
                            <View style={styles.contactRow}>
                              {Boolean(req.seller?.phone) && (
                                <TouchableOpacity
                                  style={[styles.smallBtn, styles.phoneBtn]}
                                  onPress={() => openPhone(req.seller?.phone)}
                                >
                                  <View style={styles.buttonLabelRow}>
                                    <SymbolView
                                      name={{ ios: "phone.fill", android: "call", web: "call" }}
                                      tintColor="#ffffff"
                                      size={14}
                                    />
                                    <Text style={styles.smallBtnText}>{req.seller?.phone}</Text>
                                  </View>
                                </TouchableOpacity>
                              )}
                              {Boolean(req.seller?.telegram) && (
                                <TouchableOpacity
                                  style={[styles.smallBtn, styles.tgBtn]}
                                  onPress={() => openTelegram(req.seller?.telegram)}
                                >
                                  <View style={styles.buttonLabelRow}>
                                    <SymbolView
                                      name={{ ios: "paperplane.fill", android: "send", web: "send" }}
                                      tintColor="#ffffff"
                                      size={14}
                                    />
                                    <Text style={styles.smallBtnText}>
                                      @{req.seller?.telegram?.replace(/^@/, "")}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        )}

                        {isRejected && (
                          <View style={styles.statusRow}>
                            <SymbolView
                              name={{ ios: "xmark.circle.fill", android: "cancel", web: "cancel" }}
                              tintColor="#DC2626"
                              size={16}
                            />
                            <Text style={styles.rejectedSubText}>
                              ရောင်းသူက သင့်တောင်းဆိုမှုကို ငြင်းပယ်လိုက်ပါပြီ။
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            )}
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
    flex: 1,
    maxHeight: "92%",
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  appointmentsList: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  headerTitle: {
    flex: 1,
    flexShrink: 1,
    fontSize: 18,
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
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
  },
  activeTabText: {
    color: "#0284C7",
    fontWeight: "700",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyIcon: {
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },
  card: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  bookTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginRight: 8,
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePending: {
    backgroundColor: "#FEF3C7",
  },
  textPending: {
    color: "#B45309",
    fontWeight: "700",
    fontSize: 11,
  },
  badgeAccepted: {
    backgroundColor: "#DCFCE7",
  },
  textAccepted: {
    color: "#16A34A",
    fontWeight: "700",
    fontSize: 11,
  },
  badgeRejected: {
    backgroundColor: "#FEE2E2",
  },
  textRejected: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 11,
  },
  statusBadgeText: {
    fontSize: 11,
  },
  notifyText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0284C7",
    marginBottom: 8,
  },
  buyerBox: {
    backgroundColor: "#ffffff",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  buyerName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 4,
  },
  pendingPrivacyHint: {
    fontSize: 11,
    color: "#B45309",
    lineHeight: 16,
  },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: "#16A34A",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectBtnText: {
    color: "#64748B",
    fontWeight: "600",
    fontSize: 13,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  sellerRowText: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  pendingBuyerNotice: {
    backgroundColor: "#FFFBEB",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  pendingBuyerNoticeText: {
    flex: 1,
    fontSize: 12,
    color: "#B45309",
    lineHeight: 16,
  },
  acceptedBuyerSection: {
    backgroundColor: "#F0FDF4",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  acceptedBuyerTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: "#166534",
    marginBottom: 8,
  },
  rejectedSubText: {
    fontSize: 12,
    color: "#DC2626",
    fontStyle: "italic",
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  smallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  phoneBtn: {
    backgroundColor: "#16A34A",
  },
  tgBtn: {
    backgroundColor: "#0284C7",
  },
  smallBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  buttonLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
});
