import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AppState,
  FlatList,
  StyleSheet,
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
  editBook,
  getBooks,
  getIncomingAppointments,
  getMyBooks,
  getMyProfile,
  getMyRequestedAppointments,
  NetworkUnavailableError,
  registerPushToken,
  rejectAppointment,
  requestAppointment,
  saveProfile,
  unregisterPushToken,
  updateBookStatus,
} from "../services/api";
import {
  notifyAppointmentAccepted,
  notifyAppointmentRejected,
  registerDeviceForPush,
} from "../services/pushNotifications";
import {
  loadSeenNotificationIds,
  saveSeenNotificationIds,
} from "../services/seenNotifications";
import { SafeAreaView } from "react-native-safe-area-context";
import { sortBooks, type BookSort } from "../utils/bookSorting";
import AddBookModal from "./AddBookModal";
import AppointmentsModal from "./AppointmentsModal";
import BookSearchFilters from "./BookSearchFilters";
import DashboardBookFeed from "./DashboardBookFeed";
import DashboardHeader from "./DashboardHeader";
import BookDetailModal from "./BookDetailModal";
import ProfileModal from "./ProfileModal";
import SideBarDrawer, { ActiveTab } from "./SideBarDrawer";
import { useAppDialog } from "./AppDialogProvider";

interface DashboardViewProps {
  sessionToken: string;
  onSignOut: () => void;
  initialUserProfile?: UserProfile | null;
}

export default function DashboardView({
  sessionToken,
  onSignOut,
  initialUserProfile,
}: DashboardViewProps) {
  const showDialog = useAppDialog();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingBookStatusId, setUpdatingBookStatusId] = useState<string | null>(null);

  // The shelf shows other users' books; "my-books" contains this user's listings.
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

  const [seenNotificationIds, setSeenNotificationIds] = useState<string[]>([]);
  const [seenReady, setSeenReady] = useState(false);
  const pushTokenRef = useRef<string | null>(null);
  const networkDialogShownRef = useRef(false);
  const appointmentStatusRef = useRef<Map<string, Appointment["status"]> | null>(
    null,
  );

  useEffect(() => {
    const previous = appointmentStatusRef.current;
    appointmentStatusRef.current = new Map(
      myRequests.map((appointment) => [appointment.id, appointment.status]),
    );
    if (!previous) return;

    for (const appointment of myRequests) {
      const priorStatus = previous.get(appointment.id);
      if (
        (appointment.status === "ACCEPTED" || appointment.status === "REJECTED") &&
        !seenNotificationIds.includes(appointment.id) &&
        priorStatus &&
        priorStatus !== appointment.status
      ) {
        if (appointment.status === "ACCEPTED") {
          void notifyAppointmentAccepted(appointment.book.title);
        } else {
          void notifyAppointmentRejected(appointment.book.title);
        }
      }
    }
  }, [myRequests, seenNotificationIds]);

  // Modals state
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [appointmentsModalVisible, setAppointmentsModalVisible] =
    useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const token = await registerDeviceForPush();
        if (!active || !token) return;
        pushTokenRef.current = token;
        await registerPushToken(sessionToken, token);
      } catch (error) {
        console.error("Push registration failed:", error);
      }
    })();

    return () => {
      active = false;
    };
  }, [sessionToken]);

  useEffect(() => {
    const userId = userProfile?.id;
    if (!userId) return;
    let active = true;

    loadSeenNotificationIds(userId)
      .then((ids) => {
        if (!active) return;
        setSeenNotificationIds((current) => Array.from(new Set([...ids, ...current])));
        setSeenReady(true);
      })
      .catch(() => {
        if (active) setSeenReady(true);
      });

    return () => {
      active = false;
    };
  }, [userProfile?.id]);

  const handleSignOut = () => {
    const token = pushTokenRef.current;
    if (token) {
      void unregisterPushToken(sessionToken, token).catch((error) => {
        console.error("Push token removal failed:", error);
      });
    }
    onSignOut();
  };

  // Fetch books from server
  const fetchBooks = useCallback(async () => {
    try {
      const res = await getBooks({
        search: searchQuery.trim() || undefined,
        major: selectedMajor === "All" ? undefined : selectedMajor,
        year: selectedYear === "All Years" ? undefined : selectedYear,
      });
      setBooks(res.books);
      networkDialogShownRef.current = false;
    } catch (error) {
      console.error("Fetch books failed:", error);
      if (error instanceof NetworkUnavailableError && !networkDialogShownRef.current) {
        networkDialogShownRef.current = true;
        showDialog("အင်တာနက် ချိတ်ဆက်မှု မရှိပါ", error.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedMajor, selectedYear, showDialog]);

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

  useEffect(() => {
    const refresh = () => {
      void fetchBooks();
      void fetchUserData();
      void fetchAppointments();
    };
    const interval = setInterval(() => {
      if (AppState.currentState === "active") refresh();
    }, 10000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [fetchAppointments, fetchBooks, fetchUserData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBooks();
    fetchUserData();
    fetchAppointments();
  };

  const handleSaveBook = async (input: CreateBookInput) => {
    if (editingBook) {
      await editBook(sessionToken, editingBook.id, input);
    } else {
      await createBook(sessionToken, input);
    }
    fetchBooks();
    fetchUserData();
    setEditingBook(null);
  };

  const handleSaveProfile = async (profile: {
    name: string;
    email: string;
    year: string;
    phone: string;
    telegram: string;
  }) => {
    const result = await saveProfile(sessionToken, profile);
    setUserProfile(result.user);
  };

  const openAddBook = () => {
    setEditingBook(null);
    setAddModalVisible(true);
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

  const unseenIncomingCount = seenReady
    ? incomingAppointments.filter(
        (a) => a.status === "PENDING" && !seenNotificationIds.includes(a.id),
      ).length
    : 0;

  const unseenAcceptedCount = seenReady
    ? myRequests.filter(
        (appointment) =>
          appointment.status === "ACCEPTED" &&
          !seenNotificationIds.includes(appointment.id),
      ).length
    : 0;

  const markAllNotificationsSeen = useCallback(() => {
    const userId = userProfile?.id;
    if (!userId) return;
    setSeenNotificationIds((current) => {
      const incomingIds = incomingAppointments.map((a) => a.id);
      const acceptedIds = myRequests
        .filter(
          (appointment) =>
            appointment.status === "ACCEPTED" ||
            appointment.status === "REJECTED",
        )
        .map((appointment) => appointment.id);
      const next = Array.from(
        new Set([...current, ...incomingIds, ...acceptedIds]),
      );
      void saveSeenNotificationIds(userId, next);
      return next;
    });
  }, [incomingAppointments, myRequests, userProfile?.id]);

  const booksFromRequests = useCallback(
    (status: Appointment["status"]) => {
      return myRequests
        .filter((appointment) => appointment.status === status)
        .map((appointment) => {
          const listed = books.find((book) => book.id === appointment.bookId);
          if (listed) return listed;
          return {
            id: appointment.book.id,
            title: appointment.book.title,
            author: null,
            major: appointment.book.major,
            year: appointment.book.year,
            price: appointment.book.price,
            condition: "",
            status: status === "ACCEPTED" ? "SOLD" : "AVAILABLE",
            description: null,
            imageUrl: null,
            sellerId: appointment.seller?.id ?? "",
            createdAt: appointment.createdAt,
            seller: appointment.seller,
          } satisfies Book;
        });
    },
    [books, myRequests],
  );

  const currentUserId = userProfile?.id;
  const displayedBooks = useMemo(() => {
    const source =
      activeTab === "my-books"
        ? myBooks
        : activeTab === "purchased"
          ? booksFromRequests("ACCEPTED")
          : activeTab === "appointments"
            ? booksFromRequests("PENDING")
            : currentUserId
              ? books.filter((book) => book.sellerId !== currentUserId)
              : [];
    return sortBooks(source, bookSort);
  }, [activeTab, bookSort, books, booksFromRequests, currentUserId, myBooks]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <DashboardHeader
          activeTab={activeTab}
          pendingAppointmentsCount={unseenIncomingCount + unseenAcceptedCount}
          userProfile={userProfile}
          onOpenDrawer={() => setDrawerVisible(true)}
          onOpenAppointments={() => {
            setAppointmentsModalVisible(true);
            markAllNotificationsSeen();
          }}
          onOpenProfile={() => setProfileModalVisible(true)}
        />

        {/* Search and collapsible filters (Book Shelf only) */}
        {activeTab === "shelf" && (
          <BookSearchFilters
            searchQuery={searchQuery}
            selectedMajor={selectedMajor}
            selectedYear={selectedYear}
            filtersVisible={filtersVisible}
            bookSort={bookSort}
            onSearchChange={setSearchQuery}
            onSubmitSearch={fetchBooks}
            onSelectMajor={setSelectedMajor}
            onSelectYear={setSelectedYear}
            onSelectSort={setBookSort}
            onToggleFilters={() => setFiltersVisible((visible) => !visible)}
            onClearFilters={() => {
              setSelectedMajor("All");
              setSelectedYear("All Years");
            }}
          />
        )}

        <DashboardBookFeed
          activeTab={activeTab}
          books={displayedBooks}
          currentUserId={userProfile?.id}
          loading={loading}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onOpenBook={setSelectedBook}
          onAddBook={openAddBook}
          onEditBook={(book) => {
            setEditingBook(book);
            setAddModalVisible(true);
          }}
          onDeleteBook={handleDeleteBook}
        />

        {/* Side Bar Drawer */}
        <SideBarDrawer
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          userProfile={userProfile}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onSignOut={handleSignOut}
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
          key={editingBook?.id ?? "new-book"}
          visible={addModalVisible}
          initialBook={editingBook}
          onClose={() => {
            setAddModalVisible(false);
            setEditingBook(null);
          }}
          onSubmit={handleSaveBook}
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
          unseenAcceptedCount={unseenAcceptedCount}
          onViewSentRequests={markAllNotificationsSeen}
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
          onSignOut={handleSignOut}
          onRefresh={fetchUserData}
          onSaveProfile={handleSaveProfile}
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
