import { SymbolView } from "expo-symbols";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { BookSort } from "../utils/bookSorting";
import { getMajorLabel, getYearLabel } from "../utils/labels";

interface BookSearchFiltersProps {
  searchQuery: string;
  selectedMajor: string;
  selectedYear: string;
  filtersVisible: boolean;
  bookSort: BookSort;
  onSearchChange: (value: string) => void;
  onSubmitSearch: () => void;
  onSelectMajor: (major: string) => void;
  onSelectYear: (year: string) => void;
  onSelectSort: (sort: BookSort) => void;
  onToggleFilters: () => void;
  onClearFilters: () => void;
}

const MAJOR_FILTERS = [
  "All",
  "CEIT",
  "EC",
  "EP",
  "Civil",
  "Archi",
  "ME",
  "MC",
];
const YEAR_FILTERS = [
  "All Years",
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year",
  "Final Year",
];
const SORT_OPTIONS: { value: BookSort; label: string }[] = [
  { value: "newest", label: "အသစ်" },
  { value: "price-asc", label: "ဈေးနည်းမှ များသို့" },
  { value: "price-desc", label: "ဈေးများမှ နည်းသို့" },
];

export default function BookSearchFilters({
  searchQuery,
  selectedMajor,
  selectedYear,
  filtersVisible,
  bookSort,
  onSearchChange,
  onSubmitSearch,
  onSelectMajor,
  onSelectYear,
  onSelectSort,
  onToggleFilters,
  onClearFilters,
}: BookSearchFiltersProps) {
  const activeFilterCount =
    Number(selectedMajor !== "All") + Number(selectedYear !== "All Years");

  return (
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
            onChangeText={onSearchChange}
            returnKeyType="search"
            onSubmitEditing={onSubmitSearch}
          />
          {Boolean(searchQuery) && (
            <TouchableOpacity
              onPress={() => onSearchChange("")}
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
          onPress={onToggleFilters}
          accessibilityRole="button"
          accessibilityLabel={
            filtersVisible ? "စစ်ထုတ်မှုများ ဖျောက်ရန်" : "စစ်ထုတ်မှုများ ပြရန်"
          }
          accessibilityState={{ expanded: filtersVisible }}
        >
          <SymbolView
            name={{ ios: "slider.horizontal.3", android: "tune", web: "tune" }}
            tintColor={activeFilterCount > 0 ? "#0284C7" : "#475569"}
            size={19}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterCount}>
              <Text style={styles.filterCountText}>{activeFilterCount}</Text>
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
                  onPress={() => onSelectMajor(item)}
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
                  style={[styles.sortChip, isActive && styles.sortChipActive]}
                  onPress={() => onSelectSort(option.value)}
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
                  style={[styles.yearChip, isActive && styles.yearChipActive]}
                  onPress={() => onSelectYear(item)}
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
              onPress={onClearFilters}
            >
              <Text style={styles.clearFiltersText}>
                ရွေးချယ်မှုများ ရှင်းရန်
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
});
