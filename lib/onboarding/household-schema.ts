// One set of household rules for onboarding and Settings. Messages are i18n keys so the
// form that shows them can pass them straight through t().
import { z } from "zod";
import type { TKey } from "@/lib/i18n/translate";
import { GOVERNORATE_IDS } from "@/lib/ration/governorates";

const NAME_KEY = "pages.onboarding.household.errors.name" satisfies TKey;
const GOVERNORATE_KEY = "pages.onboarding.household.errors.governorate" satisfies TKey;
const COOP_KEY = "pages.onboarding.household.errors.coop" satisfies TKey;
const MEMBERS_KEY = "pages.onboarding.household.errors.members" satisfies TKey;
const MEMBER_NAME_KEY = "pages.onboarding.household.errors.memberName" satisfies TKey;

export const householdFieldsSchema = z.object({
  name: z.string().trim().min(2, { error: NAME_KEY }),
  governorate: z.enum(GOVERNORATE_IDS, { error: GOVERNORATE_KEY }),
  coop_name: z.string().trim().min(2, { error: COOP_KEY }),
});

export type HouseholdFields = z.infer<typeof householdFieldsSchema>;

export const memberSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, { error: MEMBER_NAME_KEY }),
  is_infant: z.boolean(),
});

export const householdSchema = householdFieldsSchema.extend({
  members: z.array(memberSchema).min(1, { error: MEMBERS_KEY }),
});

export type HouseholdForm = z.infer<typeof householdSchema>;

/** First error per top-level field, keyed by field name, message as a TKey. */
export type FieldErrors = Partial<Record<string, TKey>>;

export function fieldErrors(issues: z.core.$ZodIssue[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const field = String(issue.path[0] ?? "form");
    if (!errors[field]) errors[field] = issue.message as TKey;
  }
  return errors;
}
