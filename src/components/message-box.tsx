"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, SendHorizonal } from "lucide-react";

export default function MessageBox({
  onSend,
  placeholder = "Type a message…",
}: {
  onSend: (body: string) => Promise<{ ok: boolean; error?: string }>;
  placeholder?: string;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = String(fd.get("body") || "").trim();
    if (!body) return;
    start(async () => {
      const res = await onSend(body);
      if (res.ok) {
        ref.current?.reset();
        router.refresh();
      }
    });
  }

  return (
    <form ref={ref} onSubmit={submit} className="flex gap-2">
      <input
        name="body"
        placeholder={placeholder}
        autoComplete="off"
        className="flex-1 rounded-xl border border-line bg-carbon px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-volt focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="grid size-10 shrink-0 place-items-center rounded-xl bg-volt text-carbon transition-colors hover:bg-volt-dim disabled:opacity-60"
      >
        {pending ? (
          <LoaderCircle size={16} className="animate-spin" />
        ) : (
          <SendHorizonal size={16} />
        )}
      </button>
    </form>
  );
}
