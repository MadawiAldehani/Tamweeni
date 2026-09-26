export const GOVERNORATE_IDS = [
  "capital",
  "hawalli",
  "farwaniya",
  "ahmadi",
  "jahra",
  "mubarak_al_kabeer",
] as const;

export type Governorate = (typeof GOVERNORATE_IDS)[number];

export const GOVERNORATES: { id: Governorate; name_en: string; name_ar: string }[] = [
  { id: "capital", name_en: "Capital", name_ar: "العاصمة" },
  { id: "hawalli", name_en: "Hawalli", name_ar: "حولي" },
  { id: "farwaniya", name_en: "Farwaniya", name_ar: "الفروانية" },
  { id: "ahmadi", name_en: "Ahmadi", name_ar: "الأحمدي" },
  { id: "jahra", name_en: "Jahra", name_ar: "الجهراء" },
  { id: "mubarak_al_kabeer", name_en: "Mubarak Al-Kabeer", name_ar: "مبارك الكبير" },
];
