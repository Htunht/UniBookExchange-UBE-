import { SymbolView } from "expo-symbols";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { Book } from "../services/api";
import type { ActiveTab } from "./SideBarDrawer";
import BookCard from "./BookCard";
import { useAppDialog } from "./AppDialogProvider";

interface DashboardBookFeedProps {
  activeTab: ActiveTab;
  books: Book[];
  currentUserId?: string;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onOpenBook: (book: Book) => void;
  onAddBook: () => void;
  onEditBook: (book: Book) => void;
  onDeleteBook: (bookId: string) => Promise<void>;
}

export default function DashboardBookFeed({
  activeTab,
  books,
  currentUserId,
  loading,
  refreshing,
  onRefresh,
  onOpenBook,
  onAddBook,
  onEditBook,
  onDeleteBook,
}: DashboardBookFeedProps) {
  const showDialog = useAppDialog();

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
            try {
              await onDeleteBook(book.id);
            } catch (error) {
              showDialog(
                "ဖျက်၍ မရပါ",
                error instanceof Error ? error.message : "စာအုပ်ဖျက်၍ မရပါ။",
              );
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={styles.loadingText}>စာအုပ်များ ဖွင့်နေပါသည်...</Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.bookList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <BookCard
            book={item}
            isOwnBook={item.sellerId === currentUserId}
            onPress={() => onOpenBook(item)}
            onEdit={() => onEditBook(item)}
            onDelete={() => confirmDelete(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIllustration}>
              <View style={styles.emptyIllustrationCircle} />
              <View style={styles.emptyBoxIcon}>
                <SymbolView
                  name={{
                    ios: "shippingbox.fill",
                    android: "inventory_2",
                    web: "inventory_2",
                  }}
                  tintColor="#0284C7"
                  size={56}
                />
              </View>
              <View style={styles.emptySearchBadge}>
                <SymbolView
                  name={{
                    ios: "magnifyingglass",
                    android: "search",
                    web: "search",
                  }}
                  tintColor="#64748B"
                  size={20}
                />
              </View>
            </View>
            <Text style={styles.emptyTitle}>
              {activeTab === "my-books"
                ? "တင်ထားသော စာအုပ် မရှိသေးပါ"
                : activeTab === "purchased"
                  ? "ဝယ်ပြီးသော စာအုပ် မရှိသေးပါ"
                  : activeTab === "appointments"
                    ? "Appointment လုပ်ထားသော စာအုပ် မရှိသေးပါ"
                    : "စာအုပ် မတွေ့ပါ"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === "my-books"
                ? "စာအုပ်တင်ပြီး အခြားကျောင်းသားများနှင့် မျှဝေပါ။"
                : activeTab === "purchased"
                  ? "ရောင်းသူလက်ခံထားသော စာအုပ်များကို ဒီနေရာမှာ ပြပါမယ်။"
                  : activeTab === "appointments"
                    ? "ဝယ်ယူရန် တောင်းဆိုထားသော စာအုပ်များကို ဒီနေရာမှာ ပြပါမယ်။"
                    : "ရှာဖွေထားသော စာအုပ် မတွေ့ပါ။ စာအုပ်အမည် ပြောင်းပြီး ထပ်ရှာကြည့်ပါ။"}
            </Text>
            {activeTab !== "purchased" && activeTab !== "appointments" && (
              <TouchableOpacity style={styles.emptyPostBtn} onPress={onAddBook}>
                <View style={styles.emptyPostBtnContent}>
                  <SymbolView
                    name={{ ios: "plus", android: "add", web: "add" }}
                    tintColor="#ffffff"
                    size={17}
                  />
                  <Text style={styles.emptyPostBtnText}>စာအုပ်တင်ရန်</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {books.length > 0 && (activeTab === "shelf" || activeTab === "my-books") && (
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.fab}
          onPress={onAddBook}
          accessibilityRole="button"
          accessibilityLabel="စာအုပ်အသစ် တင်ရန်"
        >
          <SymbolView
            name={{ ios: "plus", android: "add", web: "add" }}
            tintColor="#ffffff"
            size={24}
          />
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  bookList: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#64748B",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    paddingHorizontal: 30,
  },
  emptyIllustration: {
    width: 132,
    height: 132,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyIllustrationCircle: {
    position: "absolute",
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: "#E0F2FE",
  },
  emptyBoxIcon: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: "#F0F9FF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  emptySearchBadge: {
    position: "absolute",
    right: 3,
    bottom: 3,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyPostBtn: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyPostBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  emptyPostBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 52,
    height: 52,
    backgroundColor: "#0284C7",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
