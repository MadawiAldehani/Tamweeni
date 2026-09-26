"use client";

import { QRCodeSVG } from "qrcode.react";

import { cn } from "@/lib/utils";

type VoucherQrProps = {
  /** The voucher code; encoded as-is so a scanner reads "TW-7K3Q9". */
  value: string;
  size?: number;
  /** Translated accessible name for the QR. */
  label: string;
  className?: string;
};

/** The voucher QR on a white card; always light so it scans in dark mode too. */
export function VoucherQr({ value, size = 168, label, className }: VoucherQrProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn("inline-flex rounded-2xl bg-white p-3 ring-1 ring-foreground/10", className)}
    >
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        fgColor="#1E2A26"
        bgColor="#FFFFFF"
        marginSize={2}
        title={value}
        aria-hidden="true"
      />
    </div>
  );
}
