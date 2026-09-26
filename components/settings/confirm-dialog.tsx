"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/lib/i18n/provider";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  body: string;
  confirmLabel: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
};

/** Two-button confirmation. Destructive variant is reserved for irreversible actions. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  confirmLabel,
  destructive = false,
  busy = false,
  onConfirm,
}: ConfirmDialogProps) {
  const t = useT();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{body}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col">
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            size="lg"
            disabled={busy}
            onClick={() => void onConfirm()}
            className="pressable h-12 w-full rounded-xl text-base"
          >
            {busy ? t("pages.settings.data.working") : confirmLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={busy}
            onClick={() => onOpenChange(false)}
            className="h-12 w-full rounded-xl text-base"
          >
            {t("common.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
