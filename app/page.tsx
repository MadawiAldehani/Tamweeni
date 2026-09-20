import { redirect } from "next/navigation";

/** Phase 2 replaces this with a household-aware gate. */
export default function RootPage() {
  redirect("/onboarding");
}
