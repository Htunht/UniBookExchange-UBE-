import React from "react";
import { SymbolView } from "expo-symbols";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Book } from "../services/api";
import {
  getConditionLabel,
  getMajorLabel,
  getYearLabel,
} from "../utils/labels";

interface BookCardProps {
  book: Book;
  isOwnBook?: boolean;
  onPress: () => void;
}

const MAJOR_COLORS: Record<string, { bg: string; text: string }> = {
  CEIT: { bg: "#E0F2FE", text: "#0284C7" },
  EC: { bg: "#FEF3C7", text: "#D97706" },
  EP: { bg: "#DCFCE7", text: "#16A34A" },
  Civil: { bg: "#FEE2E2", text: "#DC2626" },
  Mech: { bg: "#F3E8FF", text: "#9333EA" },
  Mechanical: { bg: "#F3E8FF", text: "#9333EA" },
  Arch: { bg: "#FFEDD5", text: "#EA580C" },
  Architecture: { bg: "#FFEDD5", text: "#EA580C" },
  Other: { bg: "#F1F5F9", text: "#475569" },
};

export default function BookCard({
  book,
  isOwnBook = false,
  onPress,
}: BookCardProps) {
  const majorColor =
    MAJOR_COLORS[book.major] || { bg: "#E2E8F0", text: "#334155" };

  const isFree = !book.price || book.price === 0;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.card}
      onPress={onPress}
    >
      <View style={styles.topRow}>
        <View style={[styles.badge, { backgroundColor: majorColor.bg }]}>
          <Text style={[styles.badgeText, { color: majorColor.text }]}>
            {getMajorLabel(book.major)}
          </Text>
        </View>
        <View style={styles.yearBadge}>
          <Text style={styles.yearText}>{getYearLabel(book.year)}</Text>
        </View>
        {book.status === "SOLD" && (
          <View style={styles.soldBadge}>
            <Text style={styles.soldBadgeText}>ရောင်းပြီး</Text>
          </View>
        )}
        <View style={styles.conditionBadge}>
          <Text style={styles.conditionText}>
            {getConditionLabel(book.condition)}
          </Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {book.title}
      </Text>

      {Boolean(book.author) && (
        <View style={styles.authorRow}>
          <SymbolView
            name={{ ios: "pencil", android: "edit", web: "edit" }}
            tintColor="#64748B"
            size={14}
          />
          <Text style={styles.author} numberOfLines={1}>{book.author}</Text>
        </View>
      )}

      {Boolean(book.description) && (
        <Text style={styles.description} numberOfLines={2}>
          {book.description}
        </Text>
      )}

      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          {isFree ? (
            <View style={styles.freeBadge}>
              <Text style={styles.freeText}>အခမဲ့</Text>
            </View>
          ) : (
            <Text style={styles.priceText}>
              {book.price.toLocaleString()} ကျပ်
            </Text>
          )}
        </View>

        <View style={styles.sellerInfo}>
          <View style={styles.sellerAvatar}>
            <SymbolView
              name={{ ios: "person.fill", android: "person", web: "person" }}
              tintColor="#64748B"
              size={15}
            />
          </View>
          <Text style={styles.sellerName} numberOfLines={1}>
            {isOwnBook
              ? "မိမိစာအုပ်"
              : book.seller?.year
              ? `${getYearLabel(book.seller.year)} ကျောင်းသား`
              : "ကျောင်းသား"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  yearBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  yearText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
  },
  conditionBadge: {
    marginLeft: "auto",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  soldBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  soldBadgeText: {
    color: "#B91C1C",
    fontSize: 11,
    fontWeight: "700",
  },
  conditionText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 22,
    marginBottom: 4,
  },
  author: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 6,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  description: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 10,
    marginTop: 4,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0284C7",
  },
  freeBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  freeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#059669",
  },
  sellerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "50%",
  },
  sellerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  sellerName: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
});
