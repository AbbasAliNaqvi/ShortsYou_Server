"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api, type Job } from "@/lib/api";

type Notice = { id: number; title: string; message: string; tone: "success" | "error" | "info" };
type NoticeEvent = CustomEvent<{ title: string; message: string; tone?: Notice["tone"] }>;

export function notify(title: string, message: string, tone: Notice["tone"] = "info") {
  window.dispatchEvent(new CustomEvent("shortsyou:notify", { detail: { title, message, tone } }));
}

export function NotificationCenter() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const knownJobs = useRef(new Map<string, string>());

  function addNotice(title: string, message: string, tone: Notice["tone"] = "info") {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setNotices((current) => [...current.slice(-2), { id, title, message, tone }]);
    window.setTimeout(() => setNotices((current) => current.filter((notice) => notice.id !== id)), 10_000);
  }

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as NoticeEvent).detail;
      if (detail?.title) addNotice(detail.title, detail.message, detail.tone);
    };
    window.addEventListener("shortsyou:notify", handler);
    return () => window.removeEventListener("shortsyou:notify", handler);
  }, []);

  useEffect(() => {
    let initialSnapshot = true;
    let mounted = true;
    const checkJobs = async () => {
      const token = localStorage.getItem("shortsyou_jwt");
      if (!token) return;
      try {
        const jobs = await api.jobs(token);
        if (!mounted) return;
        jobs.forEach((job: Job) => {
          const previous = knownJobs.current.get(job.jobId);
          knownJobs.current.set(job.jobId, job.status);
          if (initialSnapshot || previous === job.status) return;
          if (job.status === "completed") addNotice("Your video is ready", `${job.clipsFound} clip${job.clipsFound === 1 ? "" : "s"} ready to review.`, "success");
          if (job.status === "failed") addNotice("Video processing needs attention", job.error || "The video could not be processed. You can try again from Videos.", "error");
        });
        initialSnapshot = false;
      } catch { /* The normal page-level API handling remains responsible for errors. */ }
    };
    void checkJobs();
    const interval = window.setInterval(() => void checkJobs(), 15_000);
    return () => { mounted = false; window.clearInterval(interval); };
  }, []);

  return <div className="notification-center" role="status" aria-live="polite">
    {notices.map((notice) => <article className={`apple-notification ${notice.tone}`} key={notice.id}>
      <span className="notification-icon">{notice.tone === "success" ? <CheckCircle2 size={18} /> : notice.tone === "error" ? <XCircle size={18} /> : <Info size={18} />}</span>
      <div><strong>{notice.title}</strong><p>{notice.message}</p></div>
      <button onClick={() => setNotices((current) => current.filter((item) => item.id !== notice.id))} aria-label="Dismiss notification"><X size={15} /></button>
    </article>)}
  </div>;
}
