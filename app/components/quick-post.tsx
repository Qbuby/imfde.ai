import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useFetcher } from "react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Avatar } from "./media";
import type { Me } from "~/lib/session.server";

const KINDS = [
  { v: "show", t: "Show Work" },
  { v: "build", t: "Build in Public" },
  { v: "thought", t: "Thoughts" },
  { v: "discussion", t: "Discussion" },
];

/**
 * Quick Post modal opened from the rail. Uses a fetcher so publishing keeps
 * the reader in place; on success we close, clear and let the current route
 * revalidate. The full /new/post route stays available as a direct link.
 */
export function QuickPostModal({
  me,
  trigger,
}: {
  me: Me;
  trigger?: React.ReactNode;
}) {
  const fetcher = useFetcher();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("build");
  const [length, setLength] = useState(0);
  const sent = useRef<string | null>(null);
  const pending = fetcher.state !== "idle";

  useEffect(() => {
    const data = fetcher.data as { ok?: boolean; id?: string } | undefined;
    if (!data?.ok || !data.id || sent.current === data.id) return;
    sent.current = data.id;
    formRef.current?.reset();
    setLength(0);
    setKind("build");
    setOpen(false);
    toast.success("动态已发布");
  }, [fetcher.data]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {trigger ? (
        <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      ) : null}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[rgba(20,23,31,0.32)] backdrop-blur-[3px] data-[state=open]:animate-[fade-in_.15s_ease-out]" />
        <Dialog.Content className="frost grain fixed left-1/2 top-[12vh] z-50 w-[min(94vw,600px)] -translate-x-1/2 rounded-[18px] border border-[#e2e5ea] bg-white/95 p-5 shadow-[var(--shadow-lift)] ring-1 ring-inset ring-white/60">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
          >
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-[16px] font-semibold tracking-[-0.01em]">
              写点什么
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                aria-label="关闭"
                className="grid h-8 w-8 place-items-center rounded-full text-[var(--color-faint)] transition hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)]"
              >
                <X size={16} strokeWidth={1.65} aria-hidden />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description asChild>
            <p className="mt-1 text-[12.5px] text-[var(--color-faint)]">
              以 @{me.handle} 发布到广场。写 #话题 会自动归类。
            </p>
          </Dialog.Description>

          <fetcher.Form ref={formRef} method="post" action="/feed" className="mt-4">
            <div className="flex items-start gap-3">
              <Avatar name={me.display_name} src={me.avatar_url} size={38} />
              <textarea
                name="body"
                required
                autoFocus
                maxLength={4000}
                rows={5}
                onChange={(e) => setLength(e.currentTarget.value.length)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="分享你现在在做的事…"
                className="min-h-[120px] w-full resize-none border-0 bg-transparent pt-1.5 text-[15px] leading-[1.6] outline-none placeholder:text-[var(--color-faint)]"
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--color-line-soft)] pt-3">
              <input type="hidden" name="kind" value={kind} />
              <div className="flex flex-wrap gap-1.5">
                {KINDS.map((k) => (
                  <motion.button
                    type="button"
                    key={k.v}
                    onClick={() => setKind(k.v)}
                    whileTap={{ scale: 0.96 }}
                    className={`rounded-full border px-3 py-1.5 text-[12.5px] transition ${
                      kind === k.v
                        ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                        : "border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]"
                    }`}
                  >
                    {k.t}
                  </motion.button>
                ))}
              </div>
              <span className="ml-auto flex items-center gap-3">
                {length > 3500 && (
                  <span className="font-mono text-[11.5px] text-[var(--color-like)] tabular-nums">
                    {length}/4000
                  </span>
                )}
                <button
                  disabled={pending || length === 0}
                  className="btn btn-primary btn-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pending ? "发布中…" : "发布到广场"}
                </button>
              </span>
            </div>
          </fetcher.Form>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Small helper so callers can open the modal imperatively from a button. */
export function QuickPostTrigger({ me }: { me: Me }) {
  return (
    <QuickPostModal
      me={me}
      trigger={
        <button className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-[24px] bg-[var(--color-ink-2)] text-[14px] font-semibold text-white transition hover:bg-[#2f3746] active:scale-[0.99]">
          <Plus size={16} strokeWidth={1.8} aria-hidden />
          写点什么
        </button>
      }
    />
  );
}
