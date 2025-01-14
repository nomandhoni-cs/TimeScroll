interface ScrollData {
  [date: string]: {
    [tabId: string]: {
      scrollDistance: number;
      timeSpent: number;
    };
  };
}

interface StorageData {
  scrollData: ScrollData;
}
