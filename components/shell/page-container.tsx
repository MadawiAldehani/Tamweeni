import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

/** Phone-width content column; bottom padding clears the fixed bottom nav. */
export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <main className={cn("mx-auto w-full max-w-md px-4 pt-4 pb-28", className)}>
      {children}
    </main>
  );
}
