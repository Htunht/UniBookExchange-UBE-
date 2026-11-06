const YEAR_LABELS: Record<string, string> = {
  "1st Year": "ပထမနှစ်",
  "2nd Year": "ဒုတိယနှစ်",
  "3rd Year": "တတိယနှစ်",
  "4th Year": "စတုတ္ထနှစ်",
  "5th Year": "ပဉ္စမနှစ်",
  "Final Year": "နောက်ဆုံးနှစ်",
  "All Years": "အားလုံး",
};

const CONDITION_LABELS: Record<string, string> = {
  "Brand New": "အသစ်",
  "Like New": "အသစ်နီးပါး",
  Good: "ကောင်း",
  Used: "အသုံးပြုပြီး",
};

export function getYearLabel(year: string): string {
  return YEAR_LABELS[year] ?? year;
}

export function getConditionLabel(condition: string): string {
  return CONDITION_LABELS[condition] ?? condition;
}

export function getMajorLabel(major: string): string {
  if (major === "All Majors") return "မေဂျာအားလုံး";
  return major;
}
