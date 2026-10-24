"use client";

import { useEffect, useState } from "react";
import { FollowerPointerCard } from "@/components/ui/following-pointer";
import { api } from "@/lib/api";

export function FollowingPointerDemo() {
  const [authorName, setAuthorName] = useState("Abbas Ali");
  const [authorAvatar, setAuthorAvatar] = useState(
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop"
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("shortsyou_user");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed?.name) setAuthorName(parsed.name);
          if (parsed?.profilePicture) setAuthorAvatar(parsed.profilePicture);
        } catch {}
      }

      const token = localStorage.getItem("shortsyou_jwt");
      if (token) {
        api.me(token)
          .then((data) => {
            if (data?.name) setAuthorName(data.name);
            if (data?.profilePicture) setAuthorAvatar(data.profilePicture);
          })
          .catch(() => {});
      }
    }
  }, []);

  return (
    <div className="mx-auto w-80">
      <FollowerPointerCard
        title={<TitleComponent title={authorName} avatar={authorAvatar} />}
      >
        <div className="group relative h-full overflow-hidden rounded-2xl border border-zinc-700/50 bg-[#161a22] transition duration-200 hover:shadow-2xl">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-tl-lg rounded-tr-lg bg-gray-900">
            <img
              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop"
              alt="thumbnail"
              className="h-full w-full transform object-cover transition duration-200 group-hover:scale-95 group-hover:rounded-2xl"
            />
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded-full border border-sky-800/50">
                Verified Creator
              </span>
            </div>
            <h2 className="my-2 text-lg font-bold text-white tracking-tight">
              Shorts Momentum Studio
            </h2>
            <h2 className="my-2 text-xs font-normal text-zinc-400 leading-relaxed">
              Real-time AI video editing engine curated for {authorName}. Hover to test follower pointer physics.
            </h2>
            <div className="mt-6 flex flex-row items-center justify-between">
              <span className="text-xs text-zinc-500">Today</span>
              <div className="relative z-10 block rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-1.5 text-xs font-bold text-white shadow-md transition">
                Active Session
              </div>
            </div>
          </div>
        </div>
      </FollowerPointerCard>
    </div>
  );
}

export default FollowingPointerDemo;

const TitleComponent = ({
  title,
  avatar,
}: {
  title: string;
  avatar: string;
}) => (
  <div className="flex items-center space-x-2">
    <img
      src={avatar}
      height="20"
      width="20"
      alt={title}
      className="rounded-full border-2 border-white object-cover w-5 h-5"
    />
    <p className="font-semibold text-xs tracking-wide">{title}</p>
  </div>
);
