import { storage } from "wxt/storage";

interface ScrollDataEntry {
  scrollDistance: number;
  timeSpent: number;
  lastActiveTimestamp?: number;
  lastScrollPosition?: number;
}

interface ScrollData {
  [date: string]: {
    [tabId: string]: ScrollDataEntry;
  };
}

export const scrollDataStorage = storage.defineItem<ScrollData>(
  "local:scrollData",
  {
    fallback: {},
  }
);
