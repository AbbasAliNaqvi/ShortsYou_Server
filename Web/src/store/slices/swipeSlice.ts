import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { SwipeDirection, SwipeItem, SwipeHistoryItem } from "@/components/Swipe/types";

export interface SwipeState {
  currentIndex: number;
  isMuted: boolean;
  history: SwipeHistoryItem[];
  acceptedItems: SwipeItem[];
  inspectedItem: SwipeItem | null;
}

const initialState: SwipeState = {
  currentIndex: 0,
  isMuted: true,
  history: [],
  acceptedItems: [],
  inspectedItem: null,
};

export const swipeSlice = createSlice({
  name: "swipe",
  initialState,
  reducers: {
    setCurrentIndex(state, action: PayloadAction<number>) {
      state.currentIndex = action.payload;
    },
    advanceCard(state) {
      state.currentIndex += 1;
    },
    toggleMute(state) {
      state.isMuted = !state.isMuted;
    },
    setIsMuted(state, action: PayloadAction<boolean>) {
      state.isMuted = action.payload;
    },
    recordSwipe(
      state,
      action: PayloadAction<{ item: SwipeItem; direction: SwipeDirection }>
    ) {
      const { item, direction } = action.payload;
      state.history.push({
        item,
        direction,
        timestamp: Date.now(),
      });
      state.currentIndex += 1;
      if (direction === "right" || direction === "up") {
        if (!state.acceptedItems.some((i) => i.id === item.id)) {
          state.acceptedItems.push(item);
        }
      }
    },
    undoSwipe(state) {
      if (state.history.length === 0 || state.currentIndex === 0) return;
      const last = state.history.pop();
      state.currentIndex = Math.max(0, state.currentIndex - 1);
      if (last && (last.direction === "right" || last.direction === "up")) {
        state.acceptedItems = state.acceptedItems.filter((i) => i.id !== last.item.id);
      }
    },
    setInspectedItem(state, action: PayloadAction<SwipeItem | null>) {
      state.inspectedItem = action.payload;
    },
    resetDeck(state) {
      state.currentIndex = 0;
      state.history = [];
      state.acceptedItems = [];
      state.inspectedItem = null;
    },
  },
});

export const {
  setCurrentIndex,
  advanceCard,
  toggleMute,
  setIsMuted,
  recordSwipe,
  undoSwipe,
  setInspectedItem,
  resetDeck,
} = swipeSlice.actions;

export default swipeSlice.reducer;
