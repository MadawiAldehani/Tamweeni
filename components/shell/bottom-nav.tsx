"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartColumn,
  ClipboardList,
  HeartHandshake,
  House,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { useT } from "@/lib/i18n/provider";
import type { TKey } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

type Tab = { href: string; labelKey: TKey; icon: LucideIcon };

const tabs: Tab[] = [
  { href: "/home", labelKey: "nav.home", icon: House },
  { href: "/plan", labelKey: "nav.plan", icon: ClipboardList },
  { href: "/donate", labelKey: "nav.donate", icon: HeartHandshake },
  { href: "/insights", labelKey: "nav.insights", icon: ChartColumn },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
];

export function BottomNav() {
  const t = useT();
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur">
      <ul className="pb-safe mx-auto flex w-full max-w-md">
        {tabs.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 py-1.5 text-nav-label font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-12 items-center justify-center rounded-full",
                    active && "bg-accent",
                  )}
                >
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <span>{t(labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
