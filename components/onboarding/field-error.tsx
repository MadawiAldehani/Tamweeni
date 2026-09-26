"use client";

/** Inline validation message under a field; `id` pairs with the field's aria-describedby. */
export function FieldError({ id, message }: { id: string; message: string | undefined }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
      {message}
    </p>
  );
}
