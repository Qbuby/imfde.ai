import { X } from "lucide-react";
import {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContent,
  MorphingDialogContainer,
  MorphingDialogClose,
  MorphingDialogImage,
  MorphingDialogTitle,
} from "./motion/morphing-dialog";
import { CoverArt } from "./media";
import type { ReactNode } from "react";

/**
 * Shared-element lightbox for a work cover. The thumbnail stays visible in
 * SSR HTML; the morphing overlay only mounts after a click.
 */
export function GalleryLightbox({
  src,
  title,
  thumbnail,
}: {
  src: string;
  title: string;
  thumbnail?: ReactNode;
}) {
  return (
    <MorphingDialog transition={{ type: "spring", stiffness: 260, damping: 28 }}>
      <MorphingDialogTrigger
        aria-label="查看大图"
        className="group block w-full cursor-zoom-in overflow-hidden rounded-[16px] text-left"
      >
        {thumbnail ?? <CoverArt seed={title} src={src} aspect="16 / 9" />}
      </MorphingDialogTrigger>
      <MorphingDialogContainer>
        <MorphingDialogContent className="relative max-h-[92vh] max-w-[94vw] overflow-hidden rounded-[14px] bg-white">
          <MorphingDialogImage src={src} alt={title} className="max-h-[82vh] w-auto object-contain" />
          <div className="flex items-center justify-between gap-4 border-t border-[var(--color-line)] px-4 py-3">
            <MorphingDialogTitle className="truncate text-[13px] font-medium">{title}</MorphingDialogTitle>
            <MorphingDialogClose className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[var(--color-ink-soft)] transition hover:bg-[var(--color-paper)]">
              <X size={16} strokeWidth={1.65} aria-hidden />
            </MorphingDialogClose>
          </div>
        </MorphingDialogContent>
      </MorphingDialogContainer>
    </MorphingDialog>
  );
}
