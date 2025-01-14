import { createRoot } from "react-dom/client";
import { calculatePPI, pixelsToMeters } from "../utils/calculations";
import ScrollDisplay from "../components/ScrollDisplay";
import { scrollDataStorage } from "../utils/storage";
import type { Root } from "react-dom/client";

export default defineContentScript({
  matches: ["<all_urls>"],
  async main() {
    let startTime: number = Date.now();
    let previousTimeSpent: number = 0;
    let totalScrollMeters: number = 0;
    let lastScrollY: number = 0;
    let isTabActive: boolean = true;
    let lastStorageUpdate: number = Date.now();
    let scrollTimeout: NodeJS.Timeout | null = null;
    let root: Root;

    const container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    const getCurrentData = async () => {
      const url = new URL(window.location.href);
      const domain = url.origin;
      console.log("Current domain:", domain);

      const currentDate = new Date().toLocaleDateString();
      const data = await scrollDataStorage.getValue();

      return {
        data,
        tabId: domain,
        currentDate,
        currentEntry: data[currentDate]?.[domain],
      };
    };

    const calculateTimeSpent = (): number => {
      if (!isTabActive) return previousTimeSpent;
      return Math.floor((Date.now() - startTime) / 1000 + previousTimeSpent);
    };

    const saveToStorage = async (
      meters: number,
      timeSpent: number
    ): Promise<void> => {
      const { data, tabId, currentDate } = await getCurrentData();

      if (!data[currentDate]) {
        data[currentDate] = {};
      }

      data[currentDate][tabId] = {
        scrollDistance: meters,
        timeSpent: timeSpent,
        lastActiveTimestamp: isTabActive ? Date.now() : undefined,
      };

      await scrollDataStorage.setValue(data);
      lastStorageUpdate = Date.now();
      console.log("Saved metrics:", { meters, timeSpent });
    };

    const updateDisplay = (meters: number, timeSpent: number): void => {
      root.render(<ScrollDisplay meters={meters} timeSpent={timeSpent} />);
    };

    const updateMetrics = async (): Promise<void> => {
      const ppi = calculatePPI();
      const currentScrollY =
        window.scrollY || document.documentElement.scrollTop;

      const scrollDelta = Math.abs(currentScrollY - lastScrollY);
      if (scrollDelta > 0) {
        const deltaMeters = pixelsToMeters(scrollDelta, ppi);
        totalScrollMeters += deltaMeters;
        lastScrollY = currentScrollY;
        console.log("Scroll delta:", deltaMeters, "Total:", totalScrollMeters);
      }

      const timeSpent = calculateTimeSpent();
      updateDisplay(totalScrollMeters, timeSpent);

      if (Date.now() - lastStorageUpdate >= 60000) {
        await saveToStorage(totalScrollMeters, timeSpent);
      }
    };

    const handleScroll = (): void => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      requestAnimationFrame(() => updateMetrics());

      scrollTimeout = setTimeout(async () => {
        await saveToStorage(totalScrollMeters, calculateTimeSpent());
        console.log(
          "Saved after scroll stopped. Total distance:",
          totalScrollMeters
        );
      }, 500);
    };

    document.addEventListener("visibilitychange", async () => {
      const wasActive = isTabActive;
      isTabActive = document.visibilityState === "visible";

      if (wasActive && !isTabActive) {
        previousTimeSpent = calculateTimeSpent();
        await saveToStorage(totalScrollMeters, previousTimeSpent);
      } else if (!wasActive && isTabActive) {
        const { currentEntry } = await getCurrentData();
        if (currentEntry) {
          totalScrollMeters = currentEntry.scrollDistance;
          previousTimeSpent = currentEntry.timeSpent;
        }
        startTime = Date.now();
        updateDisplay(totalScrollMeters, previousTimeSpent);
      }
    });

    const initializeState = async (): Promise<void> => {
      const { currentEntry } = await getCurrentData();
      if (currentEntry) {
        totalScrollMeters = currentEntry.scrollDistance;
        previousTimeSpent = currentEntry.timeSpent;
        lastScrollY = window.scrollY || document.documentElement.scrollTop;
      }
      startTime = Date.now();
      updateDisplay(totalScrollMeters, previousTimeSpent);
    };

    window.addEventListener("scroll", handleScroll);
    const timeUpdateInterval = setInterval(() => {
      const timeSpent = calculateTimeSpent();
      updateDisplay(totalScrollMeters, timeSpent);
    }, 1000);

    await initializeState();

    window.addEventListener("beforeunload", async () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      clearInterval(timeUpdateInterval);
      await saveToStorage(totalScrollMeters, calculateTimeSpent());
    });
  },
});
