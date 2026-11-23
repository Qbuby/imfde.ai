import { useRef, useState } from "react";
import { useRevalidator } from "react-router";
import * as Dialog from "@radix-ui/react-dialog";
import * as Popover from "@radix-ui/react-popover";
import { Camera, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "./media";

type AvatarDialogProps = {
  name: string;
  src: string | null;
  isSelf: boolean;
  size?: number;
};

/** Big preview + (self only) one-step avatar replacement via /actions/upload. */
export function AvatarDialog({ name, src, isSelf, size = 64 }: AvatarDialogProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const revalidator = useRevalidator();

  const change = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 400 / bitmap.width, 400 / bitmap.height);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.84));
      if (!blob) throw new Error("图片处理失败");
      const form = new FormData();
      form.set("file", blob, "avatar.webp");
      form.set("kind", "avatar");
      form.set("apply_to_profile", "1");
      const res = await fetch("/actions/upload", { method: "POST", body: form });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || "上传失败");
      revalidator.revalidate();
      toast.success("头像已更新");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "上传失败");
    } finally {
      setBusy(false);
    }
  };

  const preview = (
    <div className="flex flex-col items-center">
      {src ? (
        <img src={src} alt="" className="max-h-[70vh] max-w-full rounded-[16px] object-contain" />
      ) : (
        <span className="grid h-32 w-32 place-items-center rounded-full bg-[#f0f2f5] text-[48px] font-semibold text-[#14171f]/70">
          {name.slice(0, 1)}
        </span>
      )}
      <p className="mt-3 text-[13px] text-[#536471]">{name}</p>
    </div>
  );

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="group/avatar relative block shrink-0 rounded-full transition"
      aria-label="查看头像"
    >
      <Avatar name={name} src={src} size={size} ring />
      <span className="absolute inset-0 rounded-full bg-black/0 transition group-hover/avatar:bg-black/10" />
      {isSelf && (
        <span className="absolute -bottom-0.5 -right-0.5 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-[#0f1419] text-white">
          <Camera size={12} strokeWidth={1.65} aria-hidden />
        </span>
      )}
    </button>
  );

  return (
    <>
      {isSelf ? (
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>{trigger}</Popover.Trigger>
          <Popover.Portal>
            <Popover.Content side="bottom" align="start" sideOffset={8} className="pop-in z-50 w-[220px] rounded-[12px] border border-[#e2e5ea] bg-white p-2 shadow-[0_14px_36px_rgba(15,20,25,0.10)]">
              <button type="button" onClick={() => setOpen(false)} className="block w-full rounded-[8px] px-3 py-2 text-left text-[13.5px] transition hover:bg-[#f7f9f9]">查看头像</button>
              <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="block w-full rounded-[8px] px-3 py-2 text-left text-[13.5px] transition hover:bg-[#f7f9f9] disabled:opacity-60">
                {busy ? "上传中…" : "更换头像"}
              </button>
              {src && (
                <button
                  type="button"
                  onClick={async () => {
                    await fetch("/actions/avatar-reset", { method: "POST" });
                    revalidator.revalidate();
                    toast.success("已恢复默认头像");
                    setOpen(false);
                  }}
                  className="block w-full rounded-[8px] px-3 py-2 text-left text-[13.5px] text-[#536471] transition hover:bg-[#f7f9f9]"
                >
                  恢复默认首字
                </button>
              )}
              <Popover.Arrow className="fill-white" />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      ) : (
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-[16px] bg-white p-6 shadow-xl">
              <Dialog.Title className="sr-only">{name} 的头像</Dialog.Title>
              {preview}
              <Dialog.Close asChild>
                <button type="button" aria-label="关闭" className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full hover:bg-[#f7f9f9]"><X size={16} /></button>
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
      <input ref={fileRef} type="file" accept="image/webp,image/jpeg,image/png,image/gif" className="hidden" onChange={(e) => void change(e.target.files?.[0])} />
    </>
  );
}
