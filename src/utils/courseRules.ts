export const ALL_MAJORS_VALUE = "All Majors";

export const BOOK_YEARS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year",
  "Final Year",
] as const;

export type CourseYearRule = "first-year-only" | "through-fourth-year";

const FIRST_YEAR_SUBJECTS =
  /\b(myanmar|physics|chemistry|drawing)\b|မြန်မာစာ|ရူပဗေဒ|ဓာတုဗေဒ|ပုံဆွဲ/iu;
const THROUGH_FOURTH_YEAR_SUBJECTS =
  /\b(english|math|mathematics)\b|အင်္ဂလိပ်|သင်္ချာ/iu;

export function getCourseYearRule(title: string): CourseYearRule | null {
  if (FIRST_YEAR_SUBJECTS.test(title)) return "first-year-only";
  if (THROUGH_FOURTH_YEAR_SUBJECTS.test(title)) return "through-fourth-year";
  return null;
}

export function getAllowedBookYears(rule: CourseYearRule | null): readonly string[] {
  if (rule === "first-year-only") return BOOK_YEARS.slice(0, 1);
  if (rule === "through-fourth-year") return BOOK_YEARS.slice(0, 4);
  return BOOK_YEARS;
}
