import { createRoot } from "react-dom/client";
import { calculatePPI, pixelsToMeters } from "../utils/calculations";
import ScrollDisplay from "../components/ScrollDisplay";
import { scrollDataStorage } from "../utils/storage";

export default defineContentScript({
  matches: ["<all_urls>"],
  async main() {
    let startTime: number;
    let previousTimeSpent = 0;
    let totalScrollMeters = 0;
    let lastScrollY = 0;
    let isTabActive = true;
    let lastStorageUpdate = Date.now();
    let scrollTimeout: NodeJS.Timeout | null = null;

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const getCurrentData = async () => {
      const url = new URL(window.location.href);
      const domain = url.origin;
      const currentDate = new Date().toLocaleDateString();
      const data = await scrollDataStorage.getValue();

      return {
        data,
        tabId: domain,
        currentDate,
        currentEntry: data[currentDate]?.[domain],
      };
    };

    const calculateTimeSpent = () => {
      if (!isTabActive) return previousTimeSpent;
      return Math.floor((Date.now() - startTime) / 1000 + previousTimeSpent);
    };

    const updateMetrics = async () => {
      const ppi = calculatePPI();
      const currentScrollY =
        window.scrollY || document.documentElement.scrollTop;

      const scrollDelta = Math.abs(currentScrollY - lastScrollY);
      const deltaMeters = pixelsToMeters(scrollDelta, ppi);
      totalScrollMeters += deltaMeters;
      lastScrollY = currentScrollY;

      const timeSpent = calculateTimeSpent();
      updateDisplay(totalScrollMeters, timeSpent);
    };

    const handleScroll = () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      requestAnimationFrame(updateMetrics);

      scrollTimeout = setTimeout(async () => {
        await saveToStorage(totalScrollMeters, calculateTimeSpent());
        console.log("Saved after scroll stopped:", totalScrollMeters);
      }, 500);
    };

    const saveToStorage = async (meters: number, timeSpent: number) => {
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
    };

    const updateDisplay = (meters: number, timeSpent: number) => {
      root.render(<ScrollDisplay meters={meters} timeSpent={timeSpent} />);
    };

    document.addEventListener("visibilitychange", async () => {
      const wasActive = isTabActive;
      isTabActive = document.visibilityState === "visible";

      if (wasActive && !isTabActive) {
        previousTimeSpent = calculateTimeSpent();
        await saveToStorage(scrollMeters, previousTimeSpent);
      } else if (!wasActive && isTabActive) {
        const { currentEntry } = await getCurrentData();
        if (currentEntry) {
          scrollMeters = currentEntry.scrollDistance;
          previousTimeSpent = currentEntry.timeSpent;
        }
        startTime = Date.now();
        updateDisplay(scrollMeters, previousTimeSpent);
      }
    });

    const initializeState = async () => {
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
    const timeUpdateInterval = setInterval(async () => {
      updateDisplay(totalScrollMeters, calculateTimeSpent());
      if (Date.now() - lastStorageUpdate >= 60000) {
        await saveToStorage(totalScrollMeters, calculateTimeSpent());
      }
    }, 1000);

    await initializeState();

    window.addEventListener("beforeunload", async () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      clearInterval(timeUpdateInterval);
      await saveToStorage(totalScrollMeters, calculateTimeSpent());
    });
  },
});
