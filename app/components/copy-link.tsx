import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { toast } from "sonner";

/**
 * "One shareable address" is the product's whole promise, so copying the
 * canonical URL gets a first-class button. `path` is relative; the absolute
 * URL is built at click time so it works on any origin (prod, preview, local).
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
      {copied ? (
        <Check size={15} strokeWidth={1.65} aria-hidden />
      ) : (
        <Link2 size={15} strokeWidth={1.65} aria-hidden />
      )}
      {copied ? "已复制" : label}
    </button>
  );
}
