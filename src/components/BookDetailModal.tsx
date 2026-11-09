import React, { useState } from "react";
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
import { useAppDialog } from "./AppDialogProvider";
import { Appointment, Book } from "../services/api";
import {
  getConditionLabel,
  getMajorLabel,
  getYearLabel,
} from "../utils/labels";

interface BookDetailModalProps {
  book: Book | null;
  visible: boolean;
  onClose: () => void;
  currentUserId?: string;
  existingAppointment?: Appointment | null;
  onRequestAppointment: (bookId: string) => Promise<void>;
  onUpdateBookStatus: (
    bookId: string,
    status: Book["status"],
  ) => Promise<void>;
  updatingBookStatus: boolean;
}

export default function BookDetailModal({
  book,
  visible,
  onClose,
  currentUserId,
  existingAppointment,
  onRequestAppointment,
  onUpdateBookStatus,
  updatingBookStatus,
}: BookDetailModalProps) {
  const showDialog = useAppDialog();
  const insets = useSafeAreaInsets();
  const [submitting, setSubmitting] = useState(false);
  const [statusConfirmationVisible, setStatusConfirmationVisible] =
    useState(false);
  const [statusChangeTarget, setStatusChangeTarget] =
    useState<Book["status"] | null>(null);
  const [saleAgreementConfirmed, setSaleAgreementConfirmed] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  if (!book) return null;

  const isFree = !book.price || book.price === 0;
  const isMyOwnBook = Boolean(currentUserId && book.sellerId === currentUserId);

  const isMarkingSold = statusChangeTarget === "SOLD";
  const isAccepted = existingAppointment?.status === "ACCEPTED";
  const isPending = existingAppointment?.status === "PENDING";
  const isRejected = existingAppointment?.status === "REJECTED";

  // Seller's contact is available if the appointment is accepted
  const sellerPhone = existingAppointment?.seller?.phone;
  const sellerTelegram = existingAppointment?.seller?.telegram;

  // Seller's real name is available only if the appointment is accepted
  const sellerDisplayName =
    isAccepted && existingAppointment?.seller?.name
      ? existingAppointment.seller.name
      : isMyOwnBook
        ? ""
        : "ရောင်းသူ (တောင်းဆိုမှုကို လက်ခံပြီးမှ အမည်ပြပါမည်)";

  const avatarLetter =
    isAccepted && existingAppointment?.seller?.name
      ? existingAppointment.seller.name.charAt(0).toUpperCase()
      : null;

  const openStatusConfirmation = () => {
    setStatusChangeTarget(book.status === "SOLD" ? "AVAILABLE" : "SOLD");
    setSaleAgreementConfirmed(false);
    setStatusError(null);
    setStatusConfirmationVisible(true);
  };

  const closeStatusConfirmation = () => {
    if (updatingBookStatus) return;
    setStatusConfirmationVisible(false);
    setStatusChangeTarget(null);
  };

  const confirmBookStatusChange = async () => {
    if (!statusChangeTarget || (isMarkingSold && !saleAgreementConfirmed)) return;

    setStatusError(null);
    try {
      await onUpdateBookStatus(book.id, statusChangeTarget);
      setStatusConfirmationVisible(false);
      setStatusChangeTarget(null);
    } catch (error) {
      setStatusError(
        error instanceof Error ? error.message : "အခြေအနေ ပြောင်း၍ မရပါ။",
      );
    }
  };

  const handleCall = () => {
    if (!sellerPhone) {
      showDialog("သတိပေးချက်", "ဖုန်းနံပါတ် မရှိပါ။");
      return;
    }
    const cleanPhone = sellerPhone.replace(/[^0-9+]/g, "");
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      showDialog("အမှား", "ဖုန်းခေါ်၍ မရပါ။");
    });
  };

  const handleTelegram = () => {
    if (!sellerTelegram) {
      showDialog("သတိပေးချက်", "Telegram အကောင့်အမည် မရှိပါ။");
      return;
    }
    const cleanTg = sellerTelegram.replace(/^@/, "").trim();
    Linking.openURL(`https://t.me/${cleanTg}`).catch(() => {
      showDialog("အမှား", "Telegram ဖွင့်၍ မရပါ။");
    });
  };

  const handleBookAppointment = async () => {
    showDialog(
      "ဝယ်ယူရန် တောင်းဆိုမည်",
      `"${book.title}" ကို ဝယ်ယူရန် ရောင်းသူထံ တောင်းဆိုမလား?`,
      [
        { text: "မလုပ်တော့ပါ", style: "cancel" },
        {
          text: "တောင်းဆိုမည်",
          onPress: async () => {
            setSubmitting(true);
            try {
              await onRequestAppointment(book.id);
              showDialog(
                "တောင်းဆိုမှု ပို့ပြီးပါပြီ",
                "ရောင်းသူထံ အသိပေးပြီးပါပြီ။ လက်ခံပါက ဆက်သွယ်ရန် အချက်အလက်ကို တွေ့ရပါမည်။",
              );
            } catch (error) {
              showDialog(
                "တောင်းဆို၍ မရပါ",
                error instanceof Error ? error.message : "တောင်းဆို၍ မရပါ။",
              );
            } finally {
              setSubmitting(false);
            }
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
      onRequestClose={() =>
        statusConfirmationVisible ? closeStatusConfirmation() : onClose()
      }
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
            <View style={styles.indicator} />
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
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
            <View style={styles.tagRow}>
              <View style={styles.majorBadge}>
                <Text style={styles.majorText}>{getMajorLabel(book.major)}</Text>
              </View>
              <View style={styles.yearBadge}>
                <Text style={styles.yearText}>{getYearLabel(book.year)}</Text>
              </View>
              <View style={styles.conditionBadge}>
                <Text style={styles.conditionText}>
                  {getConditionLabel(book.condition)}
                </Text>
              </View>
            </View>

            <Text style={styles.title}>{book.title}</Text>

            {Boolean(book.author) && (
              <View style={styles.authorRow}>
                <SymbolView
                  name={{ ios: "pencil", android: "edit", web: "edit" }}
                  tintColor="#64748B"
                  size={16}
                />
                <Text style={styles.author}>{book.author}</Text>
              </View>
            )}

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>ဈေးနှုန်း</Text>
              {isFree ? (
                <View style={styles.freeBadge}>
                  <Text style={styles.freeText}>အခမဲ့</Text>
                </View>
              ) : (
                <Text style={styles.priceValue}>
                  {book.price.toLocaleString()} ကျပ်
                </Text>
              )}
            </View>

            {book.status === "SOLD" && !isMyOwnBook && (
              <View style={styles.soldNotice}>
                <SymbolView
                  name={{ ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" }}
                  tintColor="#B91C1C"
                  size={18}
                />
                <Text style={styles.soldNoticeText}>
                  ရောင်းပြီးဖြစ်၍ ဝယ်ယူရန် တောင်းဆို၍ မရပါ။
                </Text>
              </View>
            )}

            {Boolean(book.description) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>အခြားအချက်အလက်</Text>
                <Text style={styles.descriptionText}>{book.description}</Text>
              </View>
            )}

            {/* Seller Info Card */}
            <View style={styles.sellerCard}>
              <Text style={styles.sellerCardTitle}>ရောင်းသူ</Text>
              <View style={styles.sellerRow}>
                <View style={styles.avatarBig}>
                  {avatarLetter ? (
                    <Text style={styles.avatarBigText}>{avatarLetter}</Text>
                  ) : (
                    <SymbolView
                      name={{ ios: "person.fill", android: "person", web: "person" }}
                      tintColor="#ffffff"
                      size={22}
                    />
                  )}
                </View>
                <View style={styles.sellerDetails}>
                  {Boolean(sellerDisplayName) && (
                    <Text style={styles.sellerNameText}>
                      {sellerDisplayName}
                    </Text>
                  )}
                  {Boolean(book.seller?.year) && (
                    <View style={styles.sellerYearRow}>
                      <SymbolView
                        name={{ ios: "graduationcap.fill", android: "school", web: "school" }}
                        tintColor="#64748B"
                        size={14}
                      />
                      <Text style={styles.sellerYearText}>
                        {getYearLabel(book.seller?.year ?? "")}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Status & Action Area */}
              {isMyOwnBook ? (
                <View
                  style={[
                    styles.ownerStatusCard,
                    book.status === "SOLD" && styles.ownerStatusCardSold,
                  ]}
                >
                  <Text
                    style={[
                      styles.ownerNoticeText,
                      book.status === "SOLD" && styles.ownerNoticeSoldText,
                    ]}
                  >
                    {book.status === "SOLD"
                      ? "ဤစာအုပ်ကို ရောင်းပြီးအဖြစ် သတ်မှတ်ထားပါသည်။"
                      : "ဤစာအုပ်ကို သင်တင်ထားပါသည်။"}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.ownerStatusButton,
                      book.status === "SOLD" && styles.ownerStatusButtonAvailable,
                    ]}
                    onPress={openStatusConfirmation}
                    disabled={updatingBookStatus}
                    accessibilityRole="button"
                    accessibilityLabel={
                      book.status === "SOLD"
                        ? "စာအုပ်ကို ပြန်ရရှိနိုင်အဖြစ် သတ်မှတ်ရန်"
                        : "ညှိနှိုင်းပြီးနောက် စာအုပ်ကို ရောင်းပြီးအဖြစ် သတ်မှတ်ရန်"
                    }
                  >
                    {updatingBookStatus ? (
                      <ActivityIndicator
                        size="small"
                        color={book.status === "SOLD" ? "#0284C7" : "#B91C1C"}
                      />
                    ) : (
                      <Text
                        style={[
                          styles.ownerStatusButtonText,
                          book.status === "SOLD" &&
                            styles.ownerStatusButtonAvailableText,
                        ]}
                      >
                        {book.status === "SOLD"
                          ? "ပြန်ရရှိနိုင်အဖြစ် သတ်မှတ်ရန်"
                          : "ရောင်းပြီးအဖြစ် သတ်မှတ်ရန်"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : book.status === "SOLD" ? (
                <View style={styles.soldOwnerNotice}>
                  <Text style={styles.ownerNoticeText}>
                    ဤစာအုပ်ကို ရောင်းပြီးဖြစ်ပါသည်။
                  </Text>
                </View>
              ) : isAccepted ? (
                <View style={styles.acceptedSection}>
                  <View style={styles.acceptedBadge}>
                    <View style={styles.statusRow}>
                      <SymbolView
                        name={{ ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" }}
                        tintColor="#16A34A"
                        size={18}
                      />
                      <Text style={styles.acceptedBadgeText}>
                        ရောင်းသူက သင့်တောင်းဆိုမှုကို လက်ခံလိုက်ပါပြီ။
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.acceptedSub}>
                    စာအုပ်အကြောင်း ဆက်သွယ်ရန်:
                  </Text>

                  <View style={styles.contactButtons}>
                    {Boolean(sellerPhone) && (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.phoneBtn]}
                        onPress={handleCall}
                      >
                        <Text style={styles.btnText}>Phone: {sellerPhone}</Text>
                      </TouchableOpacity>
                    )}

                    {Boolean(sellerTelegram) && (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.tgBtn]}
                        onPress={handleTelegram}
                      >
                        <Text style={styles.btnText}>
                          Telegram: @{sellerTelegram?.replace(/^@/, "")}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ) : isPending ? (
                <View style={styles.pendingSection}>
                  <SymbolView
                    style={styles.pendingIcon}
                    name={{ ios: "clock.fill", android: "schedule", web: "schedule" }}
                    tintColor="#B45309"
                    size={28}
                  />
                  <Text style={styles.pendingTitle}>ရောင်းသူ၏ အဖြေကို စောင့်နေပါသည်</Text>
                  <Text style={styles.pendingDesc}>
                    ရောင်းသူထံ တောင်းဆိုမှု ပို့ထားပါသည်။ လက်ခံပါက ဖုန်းနှင့် Telegram အချက်အလက်များ ပေါ်လာပါမည်။
                  </Text>
                </View>
              ) : isRejected ? (
                <View style={styles.rejectedSection}>
                  <View style={styles.statusRow}>
                    <SymbolView
                      name={{ ios: "xmark.circle.fill", android: "cancel", web: "cancel" }}
                      tintColor="#DC2626"
                      size={18}
                    />
                    <Text style={styles.rejectedText}>
                      ရောင်းသူက သင့်တောင်းဆိုမှုကို ငြင်းပယ်လိုက်ပါသည်။
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.requestSection}>
                  <View style={styles.privacyBox}>
                    <View style={styles.statusRow}>
                      <SymbolView
                        name={{ ios: "lock.fill", android: "lock", web: "lock" }}
                        tintColor="#B45309"
                        size={17}
                      />
                      <Text style={styles.privacyText}>
                        ရောင်းသူက တောင်းဆိုမှုကို လက်ခံပြီးမှသာ ဆက်သွယ်ရန် အချက်အလက်ကို တွေ့ရပါမည်။
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.appointmentBtn, submitting && styles.disabledBtn]}
                    onPress={handleBookAppointment}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.appointmentBtnText}>
                        ဝယ်ယူရန် တောင်းဆိုမည်
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
      {statusConfirmationVisible && (
      <View style={styles.statusConfirmationBackdrop}>
        <View style={styles.statusConfirmationCard}>
          <View
            style={[
              styles.statusConfirmationIcon,
              !isMarkingSold && styles.statusConfirmationIconAvailable,
            ]}
          >
            <SymbolView
              name={{
                ios: isMarkingSold ? "checkmark.seal.fill" : "arrow.uturn.backward.circle.fill",
                android: isMarkingSold ? "verified" : "autorenew",
                web: isMarkingSold ? "verified" : "autorenew",
              }}
              tintColor={isMarkingSold ? "#B91C1C" : "#0284C7"}
              size={28}
            />
          </View>
          <Text style={styles.statusConfirmationTitle}>
            {isMarkingSold
              ? "ရောင်းပြီးအဖြစ် သတ်မှတ်မလား?"
              : "ပြန်ရရှိနိုင်အဖြစ် ပြောင်းမလား?"}
          </Text>
          <Text style={styles.statusConfirmationDescription}>
            {isMarkingSold
              ? `"${book.title}" ကို ရောင်းပြီးအဖြစ် သတ်မှတ်ပါမည်။`
              : `"${book.title}" ကို ပြန်ရရှိနိုင်အဖြစ် သတ်မှတ်ပါမည်။`}
          </Text>

          {isMarkingSold && (
            <TouchableOpacity
              style={styles.saleAgreementRow}
              onPress={() =>
                setSaleAgreementConfirmed((confirmed) => !confirmed)
              }
              disabled={updatingBookStatus}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: saleAgreementConfirmed }}
            >
              <View
                style={[
                  styles.saleAgreementCheckbox,
                  saleAgreementConfirmed && styles.saleAgreementCheckboxChecked,
                ]}
              >
                {saleAgreementConfirmed && (
                  <SymbolView
                    name={{ ios: "checkmark", android: "check", web: "check" }}
                    tintColor="#ffffff"
                    size={14}
                  />
                )}
              </View>
              <Text style={styles.saleAgreementText}>
                အရောင်းအဝယ် ပြီးပါပြီ
              </Text>
            </TouchableOpacity>
          )}

          {statusError && (
            <Text style={styles.statusErrorText}>{statusError}</Text>
          )}

          <View style={styles.statusConfirmationActions}>
            <TouchableOpacity
              style={styles.statusCancelButton}
              onPress={closeStatusConfirmation}
              disabled={updatingBookStatus}
            >
              <Text style={styles.statusCancelText}>မလုပ်တော့ပါ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.statusConfirmButton,
                !isMarkingSold && styles.statusConfirmButtonAvailable,
                isMarkingSold &&
                  !saleAgreementConfirmed &&
                  styles.statusConfirmButtonDisabled,
              ]}
              onPress={confirmBookStatusChange}
              disabled={
                updatingBookStatus ||
                (isMarkingSold && !saleAgreementConfirmed)
              }
            >
              {updatingBookStatus ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.statusConfirmText}>
                  {isMarkingSold ? "ရောင်းပြီး သတ်မှတ်မည်" : "ပြန်ရရှိနိုင်စေမည်"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
      )}
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
    padding: 20,
    maxHeight: "85%",
  },
  content: {
    paddingBottom: 8,
  },
  header: {
    alignItems: "center",
    marginBottom: 10,
    position: "relative",
  },
  indicator: {
    width: 40,
    height: 4,
    backgroundColor: "#CBD5E1",
    borderRadius: 2,
    marginBottom: 8,
  },
  closeButton: {
    position: "absolute",
    right: 0,
    top: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  majorBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  majorText: {
    color: "#0284C7",
    fontWeight: "700",
    fontSize: 13,
  },
  yearBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  yearText: {
    color: "#475569",
    fontWeight: "600",
    fontSize: 13,
  },
  conditionBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  conditionText: {
    color: "#B45309",
    fontWeight: "600",
    fontSize: 13,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 28,
    marginBottom: 6,
  },
  author: {
    fontSize: 15,
    color: "#64748B",
    marginBottom: 16,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  priceLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  priceValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0284C7",
  },
  freeBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  freeText: {
    color: "#16A34A",
    fontWeight: "700",
    fontSize: 14,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 22,
  },
  sellerCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 8,
    marginBottom: 20,
  },
  sellerCardTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  avatarBig: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0284C7",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBigText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  sellerDetails: {
    flex: 1,
  },
  sellerNameText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  sellerYearText: {
    fontSize: 13,
    color: "#64748B",
  },
  sellerYearRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  ownerNotice: {
    backgroundColor: "#F1F5F9",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  ownerStatusCard: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  ownerStatusCardSold: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  ownerStatusButton: {
    minHeight: 42,
    alignSelf: "stretch",
    marginTop: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  ownerStatusButtonAvailable: {
    backgroundColor: "#E0F2FE",
  },
  ownerStatusButtonText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  ownerStatusButtonAvailableText: {
    color: "#0284C7",
  },
  soldNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  soldNoticeText: {
    flex: 1,
    fontSize: 13,
    color: "#B91C1C",
    fontWeight: "600",
  },
  soldOwnerNotice: {
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  ownerNoticeText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
    textAlign: "center",
  },
  ownerNoticeSoldText: {
    color: "#B91C1C",
  },
  privacyBox: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: "#B45309",
    lineHeight: 18,
  },
  requestSection: {
    marginTop: 4,
  },
  appointmentBtn: {
    backgroundColor: "#0284C7",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  appointmentBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  disabledBtn: {
    opacity: 0.7,
  },
  pendingSection: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  pendingIcon: {
    marginBottom: 6,
  },
  pendingTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#92400E",
    marginBottom: 4,
  },
  pendingDesc: {
    fontSize: 12,
    color: "#B45309",
    textAlign: "center",
    lineHeight: 18,
  },
  acceptedSection: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 12,
    padding: 14,
  },
  acceptedBadge: {
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  acceptedBadgeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#166534",
  },
  acceptedSub: {
    fontSize: 12,
    color: "#15803D",
    marginBottom: 12,
  },
  rejectedSection: {
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  rejectedText: {
    flex: 1,
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "600",
  },
  contactButtons: {
    gap: 8,
  },
  actionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  phoneBtn: {
    backgroundColor: "#16A34A",
  },
  tgBtn: {
    backgroundColor: "#0284C7",
  },
  btnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
  },
  statusConfirmationBackdrop: {
    flex: 1,
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  statusConfirmationCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  statusConfirmationIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  statusConfirmationIconAvailable: {
    backgroundColor: "#E0F2FE",
  },
  statusConfirmationTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  statusConfirmationDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
  },
  saleAgreementRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
  },
  saleAgreementCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  saleAgreementCheckboxChecked: {
    backgroundColor: "#0284C7",
    borderColor: "#0284C7",
  },
  saleAgreementText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: "#334155",
    fontWeight: "600",
  },
  statusErrorText: {
    alignSelf: "stretch",
    marginTop: 12,
    fontSize: 13,
    color: "#B91C1C",
    textAlign: "center",
  },
  statusConfirmationActions: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  statusCancelButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  statusCancelText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "700",
  },
  statusConfirmButton: {
    flex: 1.3,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: "#B91C1C",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  statusConfirmButtonAvailable: {
    backgroundColor: "#0284C7",
  },
  statusConfirmButtonDisabled: {
    backgroundColor: "#FCA5A5",
  },
  statusConfirmText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
});
