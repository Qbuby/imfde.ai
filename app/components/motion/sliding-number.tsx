'use client';
import { useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';

/**
 * SSR-friendly animated number. The server and the first client render emit
 * exactly one clean `<span>{value}</span>` — no hidden 0–9 ladder, no blank
 * first frame, no `0123456789` in the HTML source. Only genuine value changes
 * on the client trigger a lightweight vertical slide.
 */
export function SlidingNumber({
  value,
  padStart = false,
  decimalSeparator = '.',
}: {
  value: number;
  padStart?: boolean;
  decimalSeparator?: string;
}) {
  const prev = useRef(value);
  const dir = value >= prev.current ? 1 : -1;
  const changed = value !== prev.current;
  prev.current = value;

  const abs = Math.abs(value);
  const [integerPart, decimalPart] = abs.toString().split('.');
  const integerValue = parseInt(integerPart, 10);
  const padded = padStart && integerValue < 10 ? `0${integerPart}` : integerPart;
  const text = `${value < 0 ? '-' : ''}${padded}${decimalPart ? decimalSeparator + decimalPart : ''}`;

  // Server render / first mount: clean, visible, tabular number.
  if (!changed) {
    return <span className="inline-block tabular-nums">{text}</span>;
  }

  // Client-only change: slide old out, new in.
  return (
    <span className="relative inline-grid overflow-hidden align-bottom tabular-nums">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={text}
          initial={{ y: dir * 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -dir * 8, opacity: 0 }}
          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block"
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
