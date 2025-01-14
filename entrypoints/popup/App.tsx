import { useEffect, useState } from "react";
import { scrollDataStorage } from "../../utils/storage";
import logo from "/icon/48.png";
import {
  Clock,
  MousePointerClick,
  ScrollText,
  ChevronDown,
} from "lucide-react";

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
    <div className="w-80 p-4 bg-background text-foreground">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
        <img src={logo} alt="TimeScroll" className="w-6 h-6" />
        <h1 className="text-lg font-semibold">TimeScroll</h1>
      </div>

      {Object.entries(summaries)
        .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
        .map(([date, sites]) => (
          <div key={date} className="mb-3 bg-muted rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-medium">{date}</h2>
            </div>

            <div className="space-y-2">
              <div className="flex gap-4 p-2 bg-background rounded-md border border-border">
                <div className="flex items-center gap-1.5">
                  <ScrollText className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">
                    {sites
                      .reduce((acc, site) => acc + site.scrollDistance, 0)
                      .toFixed(2)}
                    m
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-green-500" />
                  <span className="text-sm">
                    {Math.floor(
                      sites.reduce((acc, site) => acc + site.timeSpent, 0) / 60
                    )}
                    m
                  </span>
                </div>
              </div>

              <ul className="space-y-2">
                {sites.map((site) => (
                  <li
                    key={site.domain}
                    className="p-2 bg-background rounded-md border border-border"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <MousePointerClick className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium">{site.domain}</span>
                    </div>
                    <div className="flex gap-3 text-muted-foreground text-xs pl-5">
                      <span>{site.scrollDistance.toFixed(2)}m</span>
                      <span>
                        {Math.floor(site.timeSpent / 60)}m{" "}
                        {Math.floor(site.timeSpent % 60)}s
                      </span>
                    </div>
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
