import type { ComponentType } from "react";

/**
 * Brand marks drawn as flat single-colour line art, sized to sit beside 12.5px
 * text. Deliberately not the official multi-colour assets: the rest of the
 * interface is monochrome, and a full-colour logo would pull the eye off the
 * link it belongs to.
 */
type IconProps = { size?: number; className?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  "aria-hidden": true,
});

function Github({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M12 2.4a9.6 9.6 0 0 0-3 18.7c.5.1.7-.2.7-.5v-1.8c-2.7.6-3.3-1.3-3.3-1.3-.4-1.1-1-1.4-1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.4-1.1.7-1.3-2.2-.3-4.4-1.1-4.4-4.9 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.8-2.3 4.6-4.4 4.9.4.3.7.9.7 1.8v2.7c0 .3.2.6.7.5A9.6 9.6 0 0 0 12 2.4z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

function Linkedin({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3.4" y="3.4" width="17.2" height="17.2" rx="2.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7.6 10.6v6.2M7.6 7.7v.1M11.4 16.8v-6.2M11.4 13.2c0-1.5 3.9-2 3.9.6v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function Huggingface({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="8.4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="9.4" cy="11" r="1.1" fill="currentColor" />
      <circle cx="14.6" cy="11" r="1.1" fill="currentColor" />
      <path d="M9.6 14.4c.7 1 1.4 1.5 2.4 1.5s1.7-.5 2.4-1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function X({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4.6 4.4l14.8 15.2M19.4 4.4L4.6 19.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function Website({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.9 12h16.2M12 3.9c2.2 2.3 3.3 5.1 3.3 8.1s-1.1 5.8-3.3 8.1c-2.2-2.3-3.3-5.1-3.3-8.1S9.8 6.2 12 3.9z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function Blog({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M5 4.6h9.4l4.6 4.4v10.4a1 1 0 01-1 1H5a1 1 0 01-1-1V5.6a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14.2 4.8V9h4.4M7.4 12.4h8M7.4 15.6h5.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export const BRAND_ICONS: Record<string, ComponentType<IconProps>> = {
  github: Github,
  linkedin: Linkedin,
  huggingface: Huggingface,
  x: X,
  website: Website,
  blog: Blog,
};
