import { useRef, useState } from "react";
import { ImagePlus, Link2, X } from "lucide-react";

type Kind = "avatar" | "profile_cover" | "project_cover";

const LIMITS: Record<Kind, number> = { avatar: 400, profile_cover: 1440, project_cover: 1440 };

async function compress(file: File, kind: Kind): Promise<Blob> {
  const maxW = LIMITS[kind];
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxW / bitmap.width, (kind === "avatar" ? maxW : 4096) / bitmap.height);
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("浏览器不支持图片处理");
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  // Keep GIF frames out: a still WebP thumbnail is enough for an avatar/cover.
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.84));
  if (blob) return blob;
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.84)) as Promise<Blob>;
}

/**
 * Click / drag an image, compressed client-side to WebP then uploaded to D1.
 * A collapsible URL row keeps external images (and cover videos) available.
 */
export function ImageUploader({
  name,
  value,
  onChange,
  kind,
  placeholder = "https://…",
  label = "图片",
  hint = "",
  error,
  allowVideoUrl = false,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  kind: Kind;
  placeholder?: string;
  label?: string;
  hint?: string;
  error?: string | null;
  allowVideoUrl?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [showUrl, setShowUrl] = useState(Boolean(value));

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setMsg(null);
    try {
      const blob = await compress(file, kind);
      const form = new FormData();
      form.set("file", blob, `${kind}.webp`);
      form.set("kind", kind);
      const res = await fetch("/actions/upload", { method: "POST", body: form });
      const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !data.ok || !data.url) throw new Error(data.error || "上传失败");
      onChange(data.url);
      setShowUrl(true);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "上传失败");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-[var(--color-ink)]">{label}</span>
        <button
          type="button"
          onClick={() => setShowUrl((v) => !v)}
          className="inline-flex items-center gap-1 text-[12px] text-[#536471] transition hover:text-[#0f1419]"
        >
          <Link2 size={13} strokeWidth={1.65} aria-hidden />
          {showUrl ? "收起链接" : "粘贴链接"}
        </button>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); void upload(e.dataTransfer.files?.[0]); }}
        className={`flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed px-4 py-4 text-center transition ${
          dragging ? "border-[#0f1419] bg-[#f7f9f9]" : "border-[#e2e5ea] bg-white"
        }`}
      >
        <ImagePlus size={20} strokeWidth={1.65} className="text-[#8b93a3]" aria-hidden />
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="rounded-full border border-[#e2e5ea] bg-white px-4 py-1.5 text-[13px] font-medium text-[#0f1419] transition hover:border-[#0f1419] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "上传中…" : "选择图片或拖到这里"}
        </button>
        <span className="text-[11.5px] text-[#8b93a3]">WebP / JPEG / PNG / GIF · 自动压缩，最大 1MB</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/webp,image/jpeg,image/png,image/gif"
          className="hidden"
          onChange={(e) => void upload(e.target.files?.[0])}
        />
      </div>

      {showUrl && (
        <div className="relative mt-2">
          <input
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={allowVideoUrl ? `${placeholder} · 支持 .mp4 / .webm` : placeholder}
            className="field pr-9"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="清除图片"
              className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-[#8b93a3] transition hover:bg-[#f3f4f6] hover:text-[#0f1419]"
            >
              <X size={14} strokeWidth={1.65} aria-hidden />
            </button>
          )}
        </div>
      )}
      {hint && !error && <p className="mt-1.5 text-[11.5px] text-[#8b93a3]">{hint}</p>}
      {error && <p className="mt-1.5 text-[12px] text-[#b42318]">{error}</p>}
      {msg && <p className="mt-1.5 text-[12px] text-[#b42318]">{msg}</p>}
    </div>
  );
}
