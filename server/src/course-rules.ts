export const ALL_MAJORS_VALUE = "All Majors";

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

export function validateCommonCourseListing(
  title: string,
  major: string,
  year: string,
): "major" | "year" | null {
  const rule = getCourseYearRule(title);
  if (!rule) return null;
  if (major.toLowerCase() !== ALL_MAJORS_VALUE.toLowerCase()) return "major";
  if (rule === "first-year-only" && year !== "1st Year") return "year";
  if (
    rule === "through-fourth-year" &&
    !["1st Year", "2nd Year", "3rd Year", "4th Year"].includes(year)
  ) {
    return "year";
  }
  return null;
}
