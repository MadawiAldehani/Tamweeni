import { RequireHousehold } from "@/components/data/require-household";
import { BottomNav } from "@/components/shell/bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireHousehold>
      {children}
      <BottomNav />
    </RequireHousehold>
  );
}
