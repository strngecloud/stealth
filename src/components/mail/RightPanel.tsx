import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Calendar,
  Paperclip,
  Send,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";
import type { Email } from "./data";

export type ContextAction = "snooze" | "translate" | "schedule" | "summarize";

export function RightPanel({
  email,
  onAction,
  onDraftReply,
}: {
  email: Email | null;
  onAction: (action: ContextAction, email: Email) => void;
  onDraftReply: (email: Email, prompt: string) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [summary, setSummary] = useState<string | null>(null);

  const runAction = (action: ContextAction) => {
    if (!email) return;
    if (action === "summarize") {
      setSummary(
        `${email.from} is writing about ${email.subject.toLowerCase()}. The next step is to respond or review the attached context.`,
      );
    }
    onAction(action, email);
  };

  const draftReply = () => {
    if (!email || !prompt.trim()) return;
    onDraftReply(email, prompt.trim());
    setPrompt("");
  };

  return (
    <aside className="scrollbar-thin m-3 ml-0 hidden h-[calc(100vh-1.5rem-3.5rem)] w-[292px] shrink-0 flex-col gap-3 overflow-y-auto 2xl:flex">
      <Card>
        <SectionHeader icon={Sparkles} title="AI assistant" badge="beta" />
        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-foreground/80">
          {email
            ? `Summary: ${email.from} is sharing the latest direction on "${email.subject}". Action items inferred.`
            : "Pick a thread and I'll summarize it, suggest replies, and extract action items."}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            placeholder="Ask AI to draft a reply…"
            className="glow-ring h-9 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs placeholder:text-muted-foreground/70"
          />
          <motion.button whileTap={{ scale: 0.94 }} className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.06] text-foreground transition hover:bg-white/[0.1]">
            <Send className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      </Card>

      {/* Quick actions */}
      <Card>
        <SectionHeader icon={ArrowUpRight} title="Quick actions" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          {["Snooze", "Translate", "Schedule", "Summarize"].map((a) => (
            <motion.button
              key={a}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onShowToast(`${a} action applied`)}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-foreground/90 transition hover:bg-white/[0.08]"
            >
              {a}
            </motion.button>
          ))}
        </div>
      </Card>

      {/* Calendar */}
      <Card>
        <SectionHeader icon={Calendar} title="Today" />
        <ul className="mt-3 space-y-2">
          {[
            { t: "10:00", title: "Design review", color: "oklch(0.85 0.005 270)" },
            { t: "13:30", title: "1:1 with Marcus", color: "oklch(0.7 0.005 270)" },
            { t: "16:00", title: "Investor sync", color: "oklch(0.6 0.005 270)" },
          ].map((e) => (
            <li key={e.title} className="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-white/[0.04]">
              <span className="h-8 w-1 rounded-full" style={{ background: e.color }} />
              <div className="flex-1">
                <div className="text-[11px] tabular-nums text-muted-foreground">{e.t}</div>
                <div className="text-xs text-foreground">{e.title}</div>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {/* Attachments */}
      {email?.attachments?.length ? (
        <Card>
          <SectionHeader icon={Paperclip} title="Attachments" />
          <ul className="mt-3 space-y-1.5">
            {email.attachments.map((a) => (
              <li key={a.name} className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-white/[0.04]">
                <div className="grid h-7 w-7 place-items-center rounded-md bg-white/[0.05] text-[9px] font-bold uppercase text-muted-foreground">{a.type}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs text-foreground">{a.name}</div>
                  <div className="text-[10px] text-muted-foreground">{a.size}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {/* Contact */}
      {email && (
        <Card>
          <SectionHeader icon={User} title="Contact" />
          <div className="mt-3 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full text-xs font-medium text-white/90"
                 style={{ background: `linear-gradient(135deg, ${email.avatarColor}, #1a1a1d)` }}>
              {email.from.split(" ").map(n => n[0]).slice(0,2).join("")}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm text-foreground">{email.from}</div>
              <div className="truncate text-[11px] text-muted-foreground">{email.email}</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              { k: "Threads", v: 24 },
              { k: "Replied", v: "97%" },
              { k: "Avg time", v: "2h" },
            ].map((s) => (
              <div key={s.k} className="rounded-lg border border-white/5 bg-white/[0.03] py-2">
                <div className="text-sm font-medium text-foreground">{s.v}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.k}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </aside>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="glass rounded-2xl p-4">{children}</div>;
}

function SectionHeader({ icon: Icon, title, badge }: { icon: any; title: string; badge?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{title}</span>
      {badge && <span className="ml-auto rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-foreground/80">{badge}</span>}
    </div>
  );
}
