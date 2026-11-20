import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useState } from "react";

/**
 * Image lightbox. The thumbnail is always in the SSR HTML; the dialog only
 * mounts on click, so there is no animation-dependent first paint.
 */
export function Lightbox({
  src,
  alt,
  thumbnail,
}: {
  src: string;
  alt: string;
  thumbnail: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="查看大图"
          className="group block w-full cursor-zoom-in overflow-hidden rounded-[16px] text-left"
        >
          {thumbnail}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[rgba(10,12,16,0.88)] data-[state=open]:animate-[fade-in_.15s_ease-out]" />
        <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10">
          <Dialog.Title className="sr-only">{alt} 大图</Dialog.Title>
          <img
            src={src}
            alt={alt}
            className="max-h-full max-w-full rounded-[10px] object-contain shadow-[0_24px_80px_rgba(0,0,0,0.4)]"
          />
          <Dialog.Close asChild>
            <button
              aria-label="关闭大图"
              className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <X size={18} strokeWidth={1.65} aria-hidden />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
