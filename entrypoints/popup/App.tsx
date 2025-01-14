import { useEffect, useState } from "react";
import { scrollDataStorage } from "../../utils/storage";

interface SiteSummary {
  domain: string;
  scrollDistance: number;
  timeSpent: number;
}

function App() {
  const [summaries, setSummaries] = useState<Record<string, SiteSummary[]>>({});

  useEffect(() => {
    const loadData = async () => {
      const data = await scrollDataStorage.getValue();
      console.log("Loading popup data:", data);

      const summaryData: Record<string, SiteSummary[]> = {};

      Object.entries(data).forEach(([date, sites]) => {
        summaryData[date] = Object.entries(sites).map(([domain, stats]) => ({
          domain,
          scrollDistance: stats.scrollDistance,
          timeSpent: stats.timeSpent,
        }));
      });

      setSummaries(summaryData);
    };

    loadData();
  }, []);

  return (
    <div className="container">
      <h1>Scroll Statistics</h1>
      {Object.entries(summaries)
        .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
        .map(([date, sites]) => (
          <div key={date} className="summary-card">
            <h2>{date}</h2>
            <div className="stats">
              <div className="totals">
                Total Distance:{" "}
                {sites
                  .reduce((acc, site) => acc + site.scrollDistance, 0)
                  .toFixed(2)}
                m
                <br />
                Total Time:{" "}
                {Math.floor(
                  sites.reduce((acc, site) => acc + site.timeSpent, 0) / 60
                )}
                m
              </div>
              <ul className="sites-list">
                {sites.map((site) => (
                  <li key={site.domain}>
                    <strong>{site.domain}</strong>
                    <br />
                    D: {site.scrollDistance.toFixed(2)}m | T:{" "}
                    {Math.floor(site.timeSpent / 60)}m{" "}
                    {Math.floor(site.timeSpent % 60)}s
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
    </div>
  );
}

export default App;
