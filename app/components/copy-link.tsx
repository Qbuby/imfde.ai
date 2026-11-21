import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Link2 } from "lucide-react";
import { toast } from "sonner";

/**
 * "One shareable address" is the product's whole promise, so copying the
 * canonical URL gets a first-class button with a tiny icon morph.
 */
export function CopyLinkButton({
  path,
  label = "复制链接",
  className = "btn btn-ghost btn-sm",
}: {
  path: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = new URL(path, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("链接已复制");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("复制失败，请手动选择地址栏");
    }
  }

  return (
    <button type="button" onClick={copy} className={className} aria-label={label}>
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span key="check" initial={{ scale: 0.5, rotate: -35, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }} className="inline-flex">
            <Check size={15} strokeWidth={2} className="text-[#10b981]" aria-hidden />
          </motion.span>
        ) : (
          <motion.span key="link" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ scale: 0.5, rotate: -35, opacity: 0 }} transition={{ duration: 0.16 }} className="inline-flex">
            <Link2 size={15} strokeWidth={1.65} aria-hidden />
          </motion.span>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={copied ? "done" : "idle"} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.14 }}>
          {copied ? "已复制" : label}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
