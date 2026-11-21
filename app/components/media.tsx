import { useMemo } from "react";
import { avatarTint, coverPalette, coverPhoto, initials } from "~/lib/format";

export function Avatar({
  name,
  src,
  size = 40,
  ring = false,
}: {
  name: string;
  src?: string | null;
  size?: number;
  ring?: boolean;
}) {
  const tint = useMemo(() => avatarTint(name), [name]);
  const fontSize = Math.max(11, Math.round(size * 0.36));

  return (
    <span
      className="avatar relative inline-flex items-center justify-center overflow-hidden"
      style={{
        width: size,
        height: size,
        boxShadow: ring ? "0 0 0 1px #fff, 0 0 0 3px #fcfcfc" : undefined,
        background: src ? undefined : tint,
      }}
      aria-hidden={src ? undefined : true}
    >
      {src ? (
        <img src={src} alt="" width={size} height={size} loading="lazy" />
      ) : (
        <span
          className="font-display font-semibold select-none"
          style={{ fontSize, color: "#14171f", opacity: 0.68 }}
        >
          {initials(name)}
        </span>
      )}
    </span>
  );
}

/**
 * Cover media for a piece of work. Three cases:
 *   1. a video URL (.mp4/.webm) plays a muted loop — a live demo beats a still;
 *   2. an image URL renders at full colour;
 *   3. no URL falls back to a deterministic photograph or, for a person's
 *      banner, a slow-drifting aurora field.
 *
 * No title is baked in: the title is always set in type next to the card.
 */
export function CoverArt({
  seed,
  src,
  aspect = "16 / 9",
  className = "",
  photo = true,
  poster,
  videoMode = "auto",
}: {
  seed: string;
  src?: string | null;
  aspect?: string;
  className?: string;
  /** Work gets photography; a person's banner stays an abstract field, so a
      profile never reads as somebody's holiday snap. */
  photo?: boolean;
  /** First-frame image shown before the video decodes — no black flash. */
  poster?: string | null;
  /** "auto" plays muted immediately; "hover" starts on pointer enter. */
  videoMode?: "auto" | "hover";
}) {
  const p = useMemo(() => coverPalette(seed), [seed]);

  if (src) {
    const isVideo = /\.(mp4|webm)(?:[?#].*)?$/i.test(src);
    return (
      <div
        className={`cover-photo overflow-hidden bg-[var(--color-sunken)] ${className}`}
        style={{ aspectRatio: aspect }}
      >
        {isVideo ? (
          <video
            src={src}
            poster={poster ?? undefined}
            autoPlay={videoMode === "auto"}
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
            className="h-full w-full object-cover"
          />
        ) : (
          <img src={src} alt="" loading="lazy" decoding="async" />
        )}
      </div>
    );
  }

  if (!photo) {
    return (
      <div
        className={`cover-art ${className}`}
        style={
          {
            aspectRatio: aspect,
            "--ta": p.ta,
            "--tb": p.tb,
            "--mark": p.mark,
          } as React.CSSProperties
        }
        aria-hidden="true"
      >
        <span className="cover-arc" />
        <span className="cover-rule" />
      </div>
    );
  }

  return (
    <div
      className={`cover-photo ${className}`}
      style={
        {
          aspectRatio: aspect,
          "--ta": p.ta,
          "--tb": p.tb,
        } as React.CSSProperties
      }
      aria-hidden="true"
    >
      <img src={coverPhoto(seed)} alt="" loading="lazy" decoding="async" />
    </div>
  );
}
