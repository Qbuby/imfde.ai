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
 * Cover art for work that has no image of its own. Ten openly licensed
 * photographs stand in, desaturated and tinted with a per-slug palette so a
 * project without a screenshot still looks like part of the set — and keeps
 * looking the same across visits.
 *
 * No title is baked in: the title is always set in type next to the card.
 */
export function CoverArt({
  seed,
  src,
  aspect = "16 / 9",
  className = "",
  photo = true,
}: {
  seed: string;
  src?: string | null;
  aspect?: string;
  className?: string;
  /** Work gets photography; a person's banner stays an abstract field, so a
      profile never reads as somebody's holiday snap. */
  photo?: boolean;
}) {
  const p = useMemo(() => coverPalette(seed), [seed]);

  if (src) {
    return (
      <div
        className={`overflow-hidden bg-[var(--color-sunken)] ${className}`}
        style={{ aspectRatio: aspect }}
      >
        <img
          src={src}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
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
