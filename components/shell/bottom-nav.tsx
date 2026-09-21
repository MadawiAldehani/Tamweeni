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
import { useLanguage, useT } from "@/lib/i18n/provider";
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

/**
 * Floating pill nav: a white 64px pill inset from the edges, floating above the
 * home indicator. One shared light-green indicator glides between tabs (300ms).
 * On routes outside the five tabs (/scan, /pantry) nothing is highlighted.
 */
export function BottomNav() {
  const t = useT();
  const { isRtl } = useLanguage();
  const pathname = usePathname();

  const activeIndex = tabs.findIndex(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  );

  // In RTL the tabs run right-to-left, so the indicator slides the other way.
  const direction = isRtl ? -1 : 1;
  const offset = direction * Math.max(activeIndex, 0) * 100;

  return (
    <nav
      aria-label={t("nav.label")}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
    >
      <ul className="pointer-events-auto relative mx-auto flex h-16 w-full max-w-md items-stretch rounded-full bg-card/90 p-1.5 shadow-[0_8px_30px_rgba(30,42,38,0.12)] ring-1 ring-foreground/10 backdrop-blur-md">
        <li
          role="presentation"
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-1.5 start-1.5 w-[calc((100%-0.75rem)/5)] rounded-full bg-accent transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
            activeIndex < 0 && "opacity-0",
          )}
          style={{ transform: `translateX(${offset}%)` }}
        />

        {tabs.map(({ href, labelKey, icon: Icon }, index) => {
          const active = index === activeIndex;
          return (
            <li key={href} className="relative z-10 flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "pressable flex h-full flex-col items-center justify-center gap-0.5 rounded-full text-nav-label font-medium transition-colors",
                  active ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  className={cn("size-5 transition-transform duration-200", active && "scale-110")}
                  strokeWidth={active ? 2.25 : 2}
                  aria-hidden="true"
                />
                <span>{t(labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
