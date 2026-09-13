"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  Clapperboard,
  LoaderCircle,
  Music2,
  ScanFace,
  Sparkles,
  Subtitles,
  WandSparkles,
} from "lucide-react";
import { api, type EditSettings, type Video } from "@/lib/api";

const layouts = [
  ["standard", "Smart portrait", "One focused speaker, intelligently framed."],
  ["two_frame", "Two faces", "Pin two speakers to upper and lower panels."],
  [
    "multi_face",
    "Multi-faces",
    "Keep up to three people visible in stacked panels.",
  ],
  [
    "auto_face",
    "Auto face",
    "Adapts from one to three panels as faces change.",
  ],
] as const;

export default function CustomShortEditor() {
  const params = useParams<{ videoId: string }>();
  const router = useRouter();

  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [notice, setNotice] = useState("");

  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(30);
  const [hook, setHook] = useState("");

  const [settings, setSettings] = useState<EditSettings>({
    backgroundStyle: "blur",
    colorGrade: "warm",
    musicMood: "energetic",
    captionStyle: "bold",
    layout: "standard",
    removeSilences: true,
    removeFillers: true,
  });

  useEffect(() => {
    const token = localStorage.getItem("shortsyou_jwt");

    if (!token) {
      router.replace("/login");
      return;
    }

    api
      .videos(token)
      .then((items) => {
        const found =
          items.find((item) => item.id === params.videoId) ?? null;

        setVideo(found);

        if (found) {
          setEnd(
            Math.min(
              30,
              Math.max(1, found.durationSeconds || 30),
            ),
          );
        } else {
          setNotice("This video is no longer available in your studio.");
        }
      })
      .catch(() => {
        setNotice("We couldn't load this video.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [params.videoId, router]);

  const duration = video?.durationSeconds ?? 0;

  const clipLength = useMemo(
    () => Math.max(0, end - start),
    [start, end],
  );

  // EditSettings.layout is optional in the API type,
  // so provide a safe fallback for rendering.
  const layout = settings.layout ?? "standard";

  function update<K extends keyof EditSettings>(
    key: K,
    value: EditSettings[K],
  ) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function render() {
    const token = localStorage.getItem("shortsyou_jwt");

    if (!token || !video) {
      return;
    }

    if (
      start < 0 ||
      end <= start ||
      (duration && end > duration)
    ) {
      setNotice("Choose a valid in-video range.");
      return;
    }

    setRendering(true);
    setNotice("");

    try {
      await api.createManualShort(
        token,
        video.id,
        start,
        end,
        hook,
        settings,
      );

      setNotice(
        "Render started. Your finished short will appear in Clips Review.",
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "We couldn't start the render.",
      );
    } finally {
      setRendering(false);
    }
  }

  if (loading) {
    return (
      <main className="editor-page editor-loading">
        <LoaderCircle className="spin" />
        Loading your editor…
      </main>
    );
  }

  if (!video) {
    return (
      <main className="editor-page editor-loading">
        <p>{notice || "Video not found."}</p>
        <Link href="/videos">Back to videos</Link>
      </main>
    );
  }

  return (
    <main className="editor-page">
      <header className="editor-header">
        <Link href="/videos">
          <ChevronLeft size={17} />
          Videos
        </Link>

        <span>
          <Sparkles size={14} />
          Custom short studio
        </span>

        <Link href="/clips">Clips Review</Link>
      </header>

      <section className="editor-title">
        <div>
          <p>SELECTED VIDEO</p>

          <h1>{video.title}</h1>

          <small>
            {format(duration)} source · {format(clipLength)} selected
          </small>
        </div>

        <button
          onClick={() => void render()}
          disabled={rendering}
        >
          {rendering ? (
            <LoaderCircle className="spin" size={16} />
          ) : (
            <WandSparkles size={16} />
          )}

          {rendering
            ? "Starting render…"
            : "Create short"}
        </button>
      </section>

      {notice && (
        <p className="editor-notice">
          {notice}
        </p>
      )}

      <div className="editor-grid">
        <section className="editor-preview">
          <div className="phone-preview">
            {video.thumbnailUrl ? (
              <img
                src={video.thumbnailUrl}
                alt=""
              />
            ) : (
              <Clapperboard size={50} />
            )}

            <div className="preview-scrim" />

            <b>
              {hook || "Your hook appears here"}
            </b>

            <span>
              {layout === "auto_face"
                ? "ADAPTIVE FACE FRAMING"
                : layout
                    .replace("_", " ")
                    .toUpperCase()}
            </span>
          </div>

          <div className="timeline">
            <div>
              <label>
                Start{" "}
                <input
                  type="number"
                  min="0"
                  max={Math.max(0, end - 0.1)}
                  step="0.1"
                  value={start}
                  onChange={(e) =>
                    setStart(Number(e.target.value))
                  }
                />
              </label>

              <label>
                End{" "}
                <input
                  type="number"
                  min="0.1"
                  max={duration || undefined}
                  step="0.1"
                  value={end}
                  onChange={(e) =>
                    setEnd(Number(e.target.value))
                  }
                />
              </label>
            </div>

            <input
              aria-label="Clip end"
              type="range"
              min="1"
              max={duration || 60}
              value={end}
              onChange={(e) =>
                setEnd(
                  Math.max(
                    start + 0.1,
                    Number(e.target.value),
                  ),
                )
              }
            />

            <small>
              Choose the exact moment to turn into a
              vertical short.
            </small>
          </div>
        </section>

        <aside className="editor-controls">
          <Control
            icon={<ScanFace size={17} />}
            title="Frame people"
          >
            <div className="layout-options">
              {layouts.map(
                ([value, title, description]) => (
                  <button
                    key={value}
                    className={
                      layout === value
                        ? "selected"
                        : ""
                    }
                    onClick={() =>
                      update("layout", value)
                    }
                  >
                    <span>
                      {layout === value && (
                        <Check size={13} />
                      )}
                    </span>

                    <b>
                      {title}

                      <small>
                        {description}
                      </small>
                    </b>
                  </button>
                ),
              )}
            </div>

            <p className="assist-note">
              Auto face analyzes the video through
              time: one face fills the frame; two or
              three faces are split vertically only
              while they are present.
            </p>
          </Control>

          <Control
            icon={<Subtitles size={17} />}
            title="Captions & hook"
          >
            <label className="field-label">
              Opening hook

              <input
                value={hook}
                maxLength={100}
                onChange={(e) =>
                  setHook(e.target.value)
                }
                placeholder="Stop the scroll…"
              />
            </label>

            <div className="choice-row">
              {[
                "bold",
                "karaoke",
                "minimal",
              ].map((value) => (
                <button
                  className={
                    settings.captionStyle === value
                      ? "selected"
                      : ""
                  }
                  key={value}
                  onClick={() =>
                    update(
                      "captionStyle",
                      value,
                    )
                  }
                >
                  {value}
                </button>
              ))}
            </div>
          </Control>

          <Control
            icon={<Music2 size={17} />}
            title="Polish"
          >
            <label className="field-label">
              Music mood

              <select
                value={settings.musicMood}
                onChange={(e) =>
                  update(
                    "musicMood",
                    e.target.value,
                  )
                }
              >
                {[
                  "energetic",
                  "calm",
                  "motivational",
                  "dramatic",
                  "neutral",
                  "none",
                ].map((item) => (
                  <option key={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <div className="choice-row">
              {[
                "warm",
                "cool",
                "vibrant",
                "cinematic",
                "natural",
              ].map((value) => (
                <button
                  className={
                    settings.colorGrade === value
                      ? "selected"
                      : ""
                  }
                  key={value}
                  onClick={() =>
                    update(
                      "colorGrade",
                      value,
                    )
                  }
                >
                  {value}
                </button>
              ))}
            </div>

            <label className="field-label">
              Background

              <select
                value={settings.backgroundStyle}
                onChange={(e) =>
                  update(
                    "backgroundStyle",
                    e.target.value,
                  )
                }
              >
                {[
                  "blur",
                  "dark_gradient",
                  "original",
                  "brand_color",
                ].map((item) => (
                  <option key={item}>
                    {item.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>

            <Toggle
              label="Remove pauses"
              checked={settings.removeSilences}
              onChange={(checked) =>
                update(
                  "removeSilences",
                  checked,
                )
              }
            />

            <Toggle
              label="Remove filler words"
              checked={settings.removeFillers}
              onChange={(checked) =>
                update(
                  "removeFillers",
                  checked,
                )
              }
            />
          </Control>
        </aside>
      </div>
    </main>
  );
}

function Control({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="editor-control">
      <h2>
        {icon}
        {title}
      </h2>

      {children}
    </section>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="toggle">
      <span>{label}</span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(e) =>
          onChange(e.target.checked)
        }
      />

      <i />
    </label>
  );
}

function format(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(
    Math.floor(seconds % 60),
  ).padStart(2, "0")}`;
}
