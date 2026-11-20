import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Form } from "react-router";

/**
 * Confirmation dialog for irreversible actions. Radix handles ESC, outside
 * click, focus trapping and returning focus; we only add the product rules:
 * a sentence naming exactly what disappears, and — for account deletion — a
 * typed handle so nobody deletes a year of work by double-clicking.
 *
 * The submit button lives inside a real <Form>, so the existing action routes
 * keep working unchanged.
 */
export function ConfirmDialog({
  action,
  hidden = {},
  title,
  description,
  confirmLabel = "删除",
  cancelLabel = "取消",
  requireText,
  requireHint,
  trigger,
}: {
  action: string;
  hidden?: Record<string, string>;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** When set, the user must type this exact text before the button enables. */
  requireText?: string;
  requireHint?: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const armed = requireText
    ? typed.trim().toLowerCase() === requireText.toLowerCase()
    : true;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setTyped("");
      }}
    >
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[rgba(20,23,31,0.28)] backdrop-blur-[2px] data-[state=open]:animate-[fade-in_.15s_ease-out]" />
        <Dialog.Content className="grain fixed left-1/2 top-1/2 z-50 w-[min(94vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-[14px] border border-[var(--color-line)] bg-white p-5 shadow-[0_24px_60px_rgba(0,0,0,0.18)] data-[state=open]:animate-[pop-in_.18s_cubic-bezier(.2,.8,.2,1)]">
          <Dialog.Title className="text-[16px] font-semibold tracking-[-0.01em]">
            {title}
          </Dialog.Title>
          <Dialog.Description asChild>
            <div className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-soft)]">
              {description}
            </div>
          </Dialog.Description>

          {requireText && (
            <label className="mt-4 block">
              <span className="mb-1.5 block text-[12.5px] text-[var(--color-ink-soft)]">
                {requireHint ?? `输入 ${requireText} 确认`}
              </span>
              <input
                value={typed}
                onChange={(e) => setTyped(e.currentTarget.value)}
                autoComplete="off"
                autoFocus
                className="field !h-[40px] font-mono !text-[13px]"
                placeholder={requireText}
              />
            </label>
          )}

          <div className="mt-5 flex items-center justify-end gap-2">
            <Dialog.Close asChild>
              <button type="button" className="btn btn-ghost btn-sm">
                {cancelLabel}
              </button>
            </Dialog.Close>
            <Form method="post" action={action}>
              {Object.entries(hidden).map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
              <button
                disabled={!armed}
                className="btn btn-sm border border-[#e0c0bc] bg-white text-[#8c3b2f] hover:bg-[#fdf0ee] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {confirmLabel}
              </button>
            </Form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
