import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Appointment,
  Book,
  CreateBookInput,
  UserProfile,
  acceptAppointment,
  createBook,
  deleteBook,
  getBooks,
  getIncomingAppointments,
  getMyBooks,
  getMyProfile,
  getMyRequestedAppointments,
  rejectAppointment,
  requestAppointment,
  updateBookStatus,
} from "../services/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { sortBooks, type BookSort } from "../utils/bookSorting";
import { getMajorLabel, getYearLabel } from "../utils/labels";
import AddBookModal from "./AddBookModal";
import AppointmentsModal from "./AppointmentsModal";
import BookCard from "./BookCard";
import BookDetailModal from "./BookDetailModal";
import ProfileModal from "./ProfileModal";
import SideBarDrawer, { ActiveTab } from "./SideBarDrawer";

interface DashboardViewProps {
  sessionToken: string;
  onSignOut: () => void;
  initialUserProfile?: UserProfile | null;
}

const MAJOR_FILTERS = ["All", "CEIT", "EC", "EP", "Civil", "Archi", "ME", "MC"];
const YEAR_FILTERS = [
  "All Years",
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year",
  "Final Year",
];
const SORT_OPTIONS = [
  { value: "newest", label: "အသစ်တင်ထားမှု" },
  { value: "price-asc", label: "ဈေးနည်းမှ များသို့" },
  { value: "price-desc", label: "ဈေးများမှ နည်းသို့" },
] as const;

export default function DashboardView({
  sessionToken,
  onSignOut,
  initialUserProfile,
}: DashboardViewProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingBookStatusId, setUpdatingBookStatusId] = useState<string | null>(null);

  // The shelf shows every book; "my-books" provides a separate view of owned listings.
  const [activeTab, setActiveTab] = useState<ActiveTab>("shelf");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All Years");
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [bookSort, setBookSort] = useState<BookSort>("newest");

  // User Profile & My Books
  const [userProfile, setUserProfile] = useState<UserProfile | null>(
    initialUserProfile ?? null,
  );
  const [myBooks, setMyBooks] = useState<Book[]>([]);

  // Appointments state
  const [incomingAppointments, setIncomingAppointments] = useState<
    Appointment[]
  >([]);
  const [myRequests, setMyRequests] = useState<Appointment[]>([]);

  // Modals state
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [appointmentsModalVisible, setAppointmentsModalVisible] =
    useState(false);

  // Fetch books from server
  const fetchBooks = useCallback(async () => {
    try {
      const res = await getBooks({
        search: searchQuery.trim() || undefined,
        major: selectedMajor === "All" ? undefined : selectedMajor,
        year: selectedYear === "All Years" ? undefined : selectedYear,
      });
      setBooks(res.books);
    } catch (error) {
      console.error("Fetch books failed:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedMajor, selectedYear]);

  // Fetch user profile and my books
  const fetchUserData = useCallback(async () => {
    try {
      const [profileRes, myBooksRes] = await Promise.all([
        getMyProfile(sessionToken),
        getMyBooks(sessionToken),
      ]);
      setUserProfile(profileRes.user);
      setMyBooks(myBooksRes.books);
    } catch (error) {
      console.error("Fetch user data failed:", error);
    }
  }, [sessionToken]);

  // Fetch appointments (both incoming for seller & requests made as buyer)
  const fetchAppointments = useCallback(async () => {
    try {
      const [incomingRes, myRequestsRes] = await Promise.all([
        getIncomingAppointments(sessionToken),
        getMyRequestedAppointments(sessionToken),
      ]);
      setIncomingAppointments(incomingRes.appointments);
      setMyRequests(myRequestsRes.appointments);
    } catch (error) {
      console.error("Fetch appointments failed:", error);
    }
  }, [sessionToken]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBooks();
    fetchUserData();
    fetchAppointments();
  };

  const handleCreateBook = async (input: CreateBookInput) => {
    await createBook(sessionToken, input);
    fetchBooks();
    fetchUserData();
  };

  const handleDeleteBook = async (bookId: string) => {
    await deleteBook(sessionToken, bookId);
    fetchBooks();
    fetchUserData();
  };

  const handleUpdateBookStatus = async (
    bookId: string,
    status: Book["status"],
  ) => {
    setUpdatingBookStatusId(bookId);
    try {
      const result = await updateBookStatus(sessionToken, bookId, status);
      setBooks((current) =>
        current.map((book) =>
          book.id === bookId ? { ...book, status: result.book.status } : book,
        ),
      );
      setMyBooks((current) =>
        current.map((book) =>
          book.id === bookId ? { ...book, status: result.book.status } : book,
        ),
      );
      setSelectedBook((current) =>
        current?.id === bookId
          ? { ...current, status: result.book.status }
          : current,
      );
    } finally {
      setUpdatingBookStatusId(null);
    }
  };

  const handleRequestAppointment = async (bookId: string) => {
    await requestAppointment(sessionToken, bookId);
    fetchAppointments();
  };

  const handleAcceptAppointment = async (appointmentId: string) => {
    await acceptAppointment(sessionToken, appointmentId);
    fetchAppointments();
  };

  const handleRejectAppointment = async (appointmentId: string) => {
    await rejectAppointment(sessionToken, appointmentId);
    fetchAppointments();
  };

  // Find existing appointment for currently opened book
  const currentBookAppointment = selectedBook
    ? myRequests.find((a) => a.bookId === selectedBook.id)
    : null;

  const pendingIncomingCount = incomingAppointments.filter(
    (a) => a.status === "PENDING",
  ).length;

  const displayedBooks = useMemo(() => {
    return sortBooks(activeTab === "my-books" ? myBooks : books, bookSort);
  }, [activeTab, bookSort, books, myBooks]);
  const activeFilterCount =
    Number(selectedMajor !== "All") + Number(selectedYear !== "All Years");

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Open the navigation drawer */}
            <TouchableOpacity
              style={styles.hamburgerBtn}
              onPress={() => setDrawerVisible(true)}
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
                <SymbolView
                  name={{ ios: "books.vertical.fill", android: "auto_stories", web: "auto_stories" }}
                  tintColor="#0284C7"
                  size={20}
                />
                <Text style={styles.appTitle}>UBE</Text>
              </View>
              <Text style={styles.tabBadge}>
                {activeTab === "shelf" ? "စာအုပ်စင်" : "မိမိစာအုပ်များ"}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            {/* Notification / Appointments Bell */}
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => setAppointmentsModalVisible(true)}
            >
              <SymbolView
                name={{ ios: "bell.fill", android: "notifications", web: "notifications" }}
                tintColor="#475569"
                size={20}
              />
              {pendingIncomingCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeCount}>
                    {pendingIncomingCount > 9 ? "9+" : pendingIncomingCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Profile Avatar Button */}
            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => setProfileModalVisible(true)}
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

        {/* Search and collapsible filters (Book Shelf only) */}
        {activeTab === "shelf" && (
          <View style={styles.searchFilterCard}>
            <View style={styles.searchToolbar}>
              <View style={styles.searchContainer}>
                <SymbolView
                  style={styles.searchIcon}
                  name={{ ios: "magnifyingglass", android: "search", web: "search" }}
                  tintColor="#64748B"
                  size={18}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="စာအုပ်အမည်ဖြင့် ရှာပါ"
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  onSubmitEditing={fetchBooks}
                />
                {Boolean(searchQuery) && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery("")}
                    style={styles.clearBtn}
                    accessibilityRole="button"
                    accessibilityLabel="ရှာဖွေမှု ရှင်းရန်"
                  >
                    <SymbolView
                      name={{ ios: "xmark", android: "close", web: "close" }}
                      tintColor="#94A3B8"
                      size={16}
                    />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={[
                  styles.filterToggle,
                  (filtersVisible || activeFilterCount > 0) &&
                    styles.filterToggleActive,
                ]}
                onPress={() => setFiltersVisible((visible) => !visible)}
                accessibilityRole="button"
                accessibilityLabel={
                  filtersVisible
                    ? "စစ်ထုတ်မှုများ ဖျောက်ရန်"
                    : "စစ်ထုတ်မှုများ ပြရန်"
                }
                accessibilityState={{ expanded: filtersVisible }}
              >
                <SymbolView
                  name={{
                    ios: "slider.horizontal.3",
                    android: "tune",
                    web: "tune",
                  }}
                  tintColor={activeFilterCount > 0 ? "#0284C7" : "#475569"}
                  size={19}
                />
                {activeFilterCount > 0 && (
                  <View style={styles.filterCount}>
                    <Text style={styles.filterCountText}>
                      {activeFilterCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {filtersVisible && (
              <View style={styles.filterPanel}>
                <Text style={styles.filterLabel}>မေဂျာ</Text>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={MAJOR_FILTERS}
                  keyExtractor={(item) => item}
                  contentContainerStyle={styles.filterList}
                  renderItem={({ item }) => {
                    const isActive = selectedMajor === item;
                    return (
                      <TouchableOpacity
                        style={[
                          styles.filterChip,
                          isActive && styles.filterChipActive,
                        ]}
                        onPress={() => setSelectedMajor(item)}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            isActive && styles.filterChipTextActive,
                          ]}
                        >
                          {item === "All" ? "အားလုံး" : getMajorLabel(item)}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />

                <Text style={styles.filterLabel}>အစီအစဉ်</Text>
                <View style={styles.sortOptions}>
                  {SORT_OPTIONS.map((option) => {
                    const isActive = bookSort === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.sortChip,
                          isActive && styles.sortChipActive,
                        ]}
                        onPress={() => setBookSort(option.value)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isActive }}
                      >
                        <Text
                          style={[
                            styles.sortChipText,
                            isActive && styles.sortChipTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.filterLabel}>သင်တန်းနှစ်</Text>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={YEAR_FILTERS}
                  keyExtractor={(item) => item}
                  contentContainerStyle={styles.filterList}
                  renderItem={({ item }) => {
                    const isActive = selectedYear === item;
                    return (
                      <TouchableOpacity
                        style={[
                          styles.yearChip,
                          isActive && styles.yearChipActive,
                        ]}
                        onPress={() => setSelectedYear(item)}
                      >
                        <Text
                          style={[
                            styles.yearChipText,
                            isActive && styles.yearChipTextActive,
                          ]}
                        >
                          {getYearLabel(item)}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
                {activeFilterCount > 0 && (
                  <TouchableOpacity
                    style={styles.clearFiltersBtn}
                    onPress={() => {
                      setSelectedMajor("All");
                      setSelectedYear("All Years");
                    }}
                  >
                    <Text style={styles.clearFiltersText}>
                      ရွေးချယ်မှုများ ရှင်းရန်
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        {/* Book Feed List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0284C7" />
            <Text style={styles.loadingText}>စာအုပ်များ ဖွင့်နေပါသည်...</Text>
          </View>
        ) : (
          <FlatList
            data={displayedBooks}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.bookList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            renderItem={({ item }) => {
              const isOwnBook = item.sellerId === userProfile?.id;
              return (
                <BookCard
                  book={item}
                  isOwnBook={isOwnBook}
                  onPress={() => setSelectedBook(item)}
                />
              );
            }}
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
                    : "စာအုပ် မတွေ့ပါ"}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {activeTab === "my-books"
                    ? "စာအုပ်တင်ပြီး အခြားကျောင်းသားများနှင့် မျှဝေပါ။"
                    : "ရှာဖွေထားသော စာအုပ် မတွေ့ပါ။ စာအုပ်အမည် ပြောင်းပြီး ထပ်ရှာကြည့်ပါ။"}
                </Text>
                <TouchableOpacity
                  style={styles.emptyPostBtn}
                  onPress={() => setAddModalVisible(true)}
                >
                  <View style={styles.emptyPostBtnContent}>
                    <SymbolView
                      name={{ ios: "plus", android: "add", web: "add" }}
                      tintColor="#ffffff"
                      size={17}
                    />
                    <Text style={styles.emptyPostBtnText}>စာအုပ်တင်ရန်</Text>
                  </View>
                </TouchableOpacity>
              </View>
            }
          />
        )}

        {/* Floating Action Button (FAB) */}
        {!loading && displayedBooks.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.fab}
            onPress={() => setAddModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="စာအုပ်အသစ် တင်ရန်"
          >
            <SymbolView
              name={{ ios: "plus", android: "add", web: "add" }}
              tintColor="#ffffff"
              size={20}
            />
            <Text style={styles.fabText}>စာအုပ်တင်ရန်</Text>
          </TouchableOpacity>
        )}

        {/* Side Bar Drawer */}
        <SideBarDrawer
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          userProfile={userProfile}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          pendingAppointmentsCount={pendingIncomingCount}
          onOpenAppointments={() => setAppointmentsModalVisible(true)}
          onSignOut={onSignOut}
        />

        {/* Book Detail Modal */}
        <BookDetailModal
          book={selectedBook}
          visible={Boolean(selectedBook)}
          onClose={() => setSelectedBook(null)}
          currentUserId={userProfile?.id}
          existingAppointment={currentBookAppointment}
          onRequestAppointment={handleRequestAppointment}
          onUpdateBookStatus={handleUpdateBookStatus}
          updatingBookStatus={updatingBookStatusId === selectedBook?.id}
        />

        {/* Add Book Modal */}
        <AddBookModal
          visible={addModalVisible}
          onClose={() => setAddModalVisible(false)}
          onSubmit={handleCreateBook}
        />

        {/* Appointments Modal */}
        <AppointmentsModal
          visible={appointmentsModalVisible}
          onClose={() => setAppointmentsModalVisible(false)}
          incomingAppointments={incomingAppointments}
          myRequests={myRequests}
          onAccept={handleAcceptAppointment}
          onReject={handleRejectAppointment}
          onRefresh={fetchAppointments}
        />

        {/* Profile Modal */}
        <ProfileModal
          visible={profileModalVisible}
          onClose={() => setProfileModalVisible(false)}
          userProfile={userProfile}
          myBooks={myBooks}
          onDeleteBook={handleDeleteBook}
          onOpenBook={(book) => {
            setProfileModalVisible(false);
            setSelectedBook(book);
          }}
          onSignOut={onSignOut}
          onRefresh={fetchUserData}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
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
  searchFilterCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
    padding: 8,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchToolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
    padding: 0,
  },
  clearBtn: {
    padding: 4,
  },
  filterToggle: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  filterToggleActive: {
    backgroundColor: "#E0F2FE",
  },
  filterCount: {
    position: "absolute",
    top: 3,
    right: 3,
    minWidth: 15,
    height: 15,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  filterCountText: {
    fontSize: 9,
    color: "#0284C7",
    fontWeight: "800",
  },
  filterPanel: {
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  filterLabel: {
    paddingHorizontal: 4,
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  filterList: {
    paddingHorizontal: 2,
    gap: 8,
    alignItems: "center",
  },
  sortOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 2,
  },
  sortChip: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#ffffff",
  },
  sortChipActive: {
    backgroundColor: "#E0F2FE",
    borderColor: "#0284C7",
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  sortChipTextActive: {
    color: "#0284C7",
  },
  clearFiltersBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0284C7",
  },
  filterChip: {
    backgroundColor: "#ffffff",
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipActive: {
    backgroundColor: "#0284C7",
    borderColor: "#0284C7",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  filterChipTextActive: {
    color: "#ffffff",
  },
  yearChip: {
    backgroundColor: "#ffffff",
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  yearChipActive: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  yearChipText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  yearChipTextActive: {
    color: "#ffffff",
  },
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
    backgroundColor: "#0284C7",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 28,
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    gap: 6,
  },
  fabText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
});
