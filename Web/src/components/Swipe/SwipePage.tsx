"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Keyboard, CheckCircle2, Zap } from "lucide-react";
import { api, type User } from "@/lib/api";
import { notify } from "@/components/Notifications/NotificationCenter";
import { WorkspaceShell } from "@/components/Layout";
import { SwipeCardStack } from "./SwipeCardStack";
import { SwipeControls } from "./SwipeControls";
import { SwipeInsightsModal } from "./SwipeInsightsModal";
import { SwipeEmptyState } from "./SwipeEmptyState";
import { SAMPLE_SWIPE_SHORTS } from "./sampleData";
import type { SwipeDirection, SwipeItem } from "./types";

// Redux & RTK Query
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  useGetSwipeDeckQuery,
  useGetSwipeStatsQuery,
  useSwipeActionMutation,
  useSwipeUndoMutation,
} from "@/store/api/swipeApi";
import {
  recordSwipe,
  undoSwipe,
  toggleMute,
  setInspectedItem,
  resetDeck,
} from "@/store/slices/swipeSlice";

// TanStack Query
import { useTanStackSwipeStats } from "@/lib/tanstackHooks";

export function SwipePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // 1. Redux Global State
  const { currentIndex, isMuted, history, acceptedItems, inspectedItem } =
    useAppSelector((state) => state.swipe);

  // 2. RTK Query Hooks (Auto-caching, deduplication, optimistic updates)
  const {
    data: rtkDeck,
    isLoading: isDeckLoading,
    refetch: refetchDeck,
  } = useGetSwipeDeckQuery();

  const { data: rtkStats } = useGetSwipeStatsQuery(undefined, {
    pollingInterval: 15000, // Background polling for render job progress
  });

  const [swipeActionMutation, { isLoading: isActionLoading }] =
    useSwipeActionMutation();
  const [swipeUndoMutation] = useSwipeUndoMutation();

  // 3. User session state
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("shortsyou_jwt");
      setToken(storedToken);
      if (!storedToken) {
        router.replace("/login");
        return;
      }
      api.me(storedToken).then(setUser).catch(() => {});
    }
  }, [router]);

  // 4. TanStack Query integration (Multi-tier caching & validation)
  const { data: tanstackStats } = useTanStackSwipeStats(token);
  const activeStats = rtkStats || tanstackStats;

  // 5. Merge server deck with starter fallbacks
  const deckItems: SwipeItem[] = useMemo(() => {
    const list: SwipeItem[] = [];

    if (rtkDeck && Array.isArray(rtkDeck) && rtkDeck.length > 0) {
      for (const d of rtkDeck) {
        list.push({
          id: d.id,
          videoId: d.videoId,
          videoTitle: d.videoTitle,
          hookText: d.hookText,
          reasoning: d.reasoning,
          viralScore: d.viralScore,
          durationSeconds: d.durationSeconds,
          startTime: d.startTime,
          endTime: d.endTime,
          category: d.category,
          thumbnailUrl: d.thumbnailUrl,
          playableUrl: d.playableUrl,
          audioTrackTitle: d.audioTrackTitle,
          tags: d.tags,
          emotionType: d.emotionType,
          scores: d.scores,
          isExistingClip: d.isExistingClip,
          status: d.status,
        });
      }
    }

    // Supplement with sample fallbacks if deck has fewer items
    for (const sample of SAMPLE_SWIPE_SHORTS) {
      if (!list.some((i) => i.id === sample.id || i.hookText === sample.hookText)) {
        list.push(sample);
      }
    }

    return list;
  }, [rtkDeck]);

  const hasCards = currentIndex < deckItems.length;

  // 6. Handle Swipe Gesture (Left = Reject, Right = Accept, Up = Super Create)
  const handleSwipe = useCallback(
    async (direction: SwipeDirection) => {
      const item = deckItems[currentIndex];
      if (!item) return;

      // 1. Dispatch instantaneous Redux state update (0ms UI transition)
      dispatch(recordSwipe({ item, direction }));

      if (direction === "right") {
        // ACCEPT / CREATE SHORT
        notify(
          "Short Queued for Generation! ⚡",
          `"${item.hookText}" is now rendering with AI captions & 9:16 layout.`,
          "success"
        );

        // 2. Dispatch RTK Query optimistic mutation (updates cache & enqueues backend job)
        try {
          await swipeActionMutation({
            clipId: item.id,
            videoId: item.videoId,
            action: "accept",
            startTime: item.startTime,
            endTime: item.endTime,
            hookText: item.hookText,
          }).unwrap();
        } catch {
          // Handled gracefully with optimistic fallback
        }
      } else if (direction === "left") {
        // REJECT / PASS
        notify("Passed", `"${item.hookText}" skipped.`, "info");
        swipeActionMutation({
          clipId: item.id,
          videoId: item.videoId,
          action: "reject",
        }).catch(() => {});
      } else if (direction === "up") {
        // SUPER CREATE / OPEN IN EDITOR
        notify(
          "Opening in Custom Editor",
          `Transferring "${item.hookText}" timeline to Agentic Director...`,
          "info"
        );
        swipeActionMutation({
          clipId: item.id,
          videoId: item.videoId,
          action: "super",
          startTime: item.startTime,
          endTime: item.endTime,
          hookText: item.hookText,
        }).catch(() => {});

        router.push(
          `/editor?videoId=${encodeURIComponent(
            item.videoId
          )}&start=${item.startTime}&end=${item.endTime}&hook=${encodeURIComponent(
            item.hookText
          )}`
        );
      }
    },
    [currentIndex, deckItems, dispatch, router, swipeActionMutation]
  );

  // 7. Undo / Rewind last swipe via Redux & RTK Query
  const handleUndo = useCallback(async () => {
    if (history.length === 0 || currentIndex === 0) return;

    const last = history[history.length - 1];
    dispatch(undoSwipe());
    notify("Swipe Undone", `Restored "${last.item.hookText}" to deck.`, "info");

    if (last.item.id) {
      try {
        await swipeUndoMutation({ clipId: last.item.id }).unwrap();
      } catch {
        // Fallback gracefully
      }
    }
  }, [history, currentIndex, dispatch, swipeUndoMutation]);

  // 8. Keyboard navigation shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        inspectedItem ||
        ["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)
      ) {
        return;
      }

      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
        e.preventDefault();
        void handleSwipe("left");
      } else if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
        e.preventDefault();
        void handleSwipe("right");
      } else if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") {
        e.preventDefault();
        void handleSwipe("up");
      } else if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        void handleUndo();
      } else if (e.key.toLowerCase() === "m") {
        e.preventDefault();
        dispatch(toggleMute());
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch, handleSwipe, handleUndo, inspectedItem]);

  const signOut = useCallback(() => {
    localStorage.removeItem("shortsyou_jwt");
    router.push("/login");
  }, [router]);

  return (
    <WorkspaceShell
      title="Swipe to Create"
      subtitle="Tinder-Style AI Viral Discovery (Redux & RTK Query Optimized)"
      user={user}
      refreshing={isDeckLoading}
      onRefresh={() => void refetchDeck()}
      onSignOut={signOut}
    >
      <div className="swipe-page-container">
        {/* Top Header Information Ribbon */}
        <div className="swipe-header-ribbon">
          <div className="swipe-ribbon-left">
            <span className="swipe-live-pill">
              <span className="swipe-live-dot" />
              <span>AI SUGGESTED SHORTS</span>
            </span>
            <span className="swipe-progress-counter">
              {hasCards
                ? `Short ${currentIndex + 1} of ${deckItems.length}`
                : "Batch Completed"}
            </span>
          </div>

          <div className="swipe-ribbon-right">
            {activeStats && activeStats.renderingJobs > 0 && (
              <div className="swipe-accepted-badge text-cyan-400">
                <Zap size={13} className="animate-pulse" />
                <span>{activeStats.renderingJobs} Rendering in BG</span>
              </div>
            )}

            {acceptedItems.length > 0 && (
              <div className="swipe-accepted-badge">
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span>{acceptedItems.length} Queued to Render</span>
              </div>
            )}

            <div className="swipe-shortcuts-hint" title="Keyboard Shortcuts">
              <Keyboard size={13} />
              <span>[←/A Pass] [→/D Create] [↑/W Edit] [Z Undo]</span>
            </div>
          </div>
        </div>

        {/* Center Main Stage (Stacked Cards or Empty State) */}
        <div className="swipe-main-stage">
          {hasCards ? (
            <SwipeCardStack
              items={deckItems}
              currentIndex={currentIndex}
              isMuted={isMuted}
              onToggleMute={() => dispatch(toggleMute())}
              onSwipe={handleSwipe}
              onOpenDetails={(item) => dispatch(setInspectedItem(item))}
              onInstantEdit={() => void handleSwipe("up")}
              isProcessingAction={isActionLoading}
            />
          ) : (
            <SwipeEmptyState
              acceptedCount={acceptedItems.length}
              totalSwiped={history.length}
              onReset={() => {
                dispatch(resetDeck());
                void refetchDeck();
              }}
            />
          )}
        </div>

        {/* Bottom Tinder Floating Action Deck */}
        {hasCards && (
          <div className="swipe-bottom-deck">
            <SwipeControls
              canUndo={history.length > 0 && currentIndex > 0}
              onUndo={handleUndo}
              onReject={() => void handleSwipe("left")}
              onSuperCreate={() => void handleSwipe("up")}
              onAccept={() => void handleSwipe("right")}
              isMuted={isMuted}
              onToggleMute={() => dispatch(toggleMute())}
              disabled={isActionLoading}
            />
          </div>
        )}

        {/* AI Viral Intelligence Breakdown Modal */}
        {inspectedItem && (
          <SwipeInsightsModal
            item={inspectedItem}
            onClose={() => dispatch(setInspectedItem(null))}
            onAccept={() => {
              dispatch(setInspectedItem(null));
              void handleSwipe("right");
            }}
            onEdit={() => {
              dispatch(setInspectedItem(null));
              void handleSwipe("up");
            }}
          />
        )}
      </div>
    </WorkspaceShell>
  );
}
