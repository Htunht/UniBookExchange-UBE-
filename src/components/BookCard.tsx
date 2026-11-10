import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Book } from "../services/api";
import {
  getConditionLabel,
  getMajorLabel,
  getYearLabel,
} from "../utils/labels";

interface BookCardProps {
  book: Book;
  isOwnBook?: boolean;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function BookCard({
  book,
  isOwnBook = false,
  onPress,
  onEdit,
  onDelete,
}: BookCardProps) {
  const isFree = !book.price || book.price === 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.bookInfo}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`${book.title}, ${getMajorLabel(book.major)}, ${getYearLabel(book.year)}`}
        >
          <Text style={styles.title} numberOfLines={2}>
            {book.title}
          </Text>
        </TouchableOpacity>
        <View style={styles.conditionBadge}>
          <Text style={styles.conditionText} numberOfLines={1}>
            {getConditionLabel(book.condition)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onPress}
        accessibilityRole="button"
      >
        <Text style={styles.detailText}>{getMajorLabel(book.major)}</Text>
        <Text style={styles.detailText}>{getYearLabel(book.year)}</Text>
        {isFree ? (
          <Text style={styles.freeText}>ညှိနှိုင်းမည်</Text>
        ) : (
          <Text style={styles.priceText}>{book.price.toLocaleString()} ကျပ်</Text>
        )}
      </TouchableOpacity>

      <View style={styles.footer}>
        <View style={styles.statusSlot}>
          {book.status === "SOLD" && (
            <View style={styles.soldBadge}>
              <Text style={styles.soldText}>ရောင်းပြီး</Text>
            </View>
          )}
        </View>
        {isOwnBook ? (
          <View style={styles.ownerActions}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.deleteButton}
              onPress={onDelete}
              accessibilityRole="button"
              accessibilityLabel={`${book.title} ကို ဖျက်မည်`}
            >
              <Text style={styles.deleteButtonText}>ဖျက်မည်</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.buyButton}
              onPress={onEdit}
              accessibilityRole="button"
              accessibilityLabel={`${book.title} ကို ပြန်ပြင်မည်`}
            >
              <Text style={styles.buyButtonText}>ပြန်ပြင်မည်</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.buyButton}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${book.title} ကို ဝယ်မည်`}
          >
            <Text style={styles.buyButtonText}>ဝယ်မည်</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E8EEF4",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.045,
    shadowRadius: 6,
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 6,
  },
  bookInfo: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 22,
  },
  conditionBadge: {
    maxWidth: "40%",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  conditionText: {
    fontSize: 10,
    color: "#0369A1",
    fontWeight: "600",
  },
  detailText: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
  },
  priceText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0277A8",
    marginTop: 2,
  },
  freeText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#059669",
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 10,
    marginTop: 10,
  },
  statusSlot: {
    flex: 1,
    alignItems: "flex-start",
  },
  soldBadge: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  soldText: {
    color: "#B91C1C",
    fontSize: 12,
    fontWeight: "700",
  },
  buyButton: {
    minWidth: 88,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0284C7",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  buyButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  ownerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  deleteButton: {
    minWidth: 68,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
  },
  deleteButtonText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "700",
  },
});
