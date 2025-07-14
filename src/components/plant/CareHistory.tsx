// src/components/plant/CareHistory.tsx
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CareRecord } from "@/types/database";
import CareActivityItem from "./CareActivityItem";
import { useNavigate } from "react-router-dom";

interface CareHistoryProps {
  careHistory: CareRecord[];
  plantId: string;
}

const CareHistory: React.FC<CareHistoryProps> = ({ plantId, careHistory }) => {
  const navigate = useNavigate();

  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  // Filter care history based on selected filter
  const filteredHistory = careHistory.filter((activity) => {
    if (filter === "all") return true;
    return activity.type === filter;
  });

  // Show only the first 5 activities unless "show all" is clicked
  const displayedHistory = showAll
    ? filteredHistory
    : filteredHistory.slice(0, 5);

  // Get unique activity types that actually exist in the care history
  const existingActivityTypes = [...new Set(careHistory.map(activity => activity.type))];
  
  // All possible activity type filters
  const allActivityTypeFilters = [
    { value: "water", label: "Watering", icon: "💧" },
    { value: "fertilize", label: "Fertilizing", icon: "🌱" },
    { value: "observe", label: "Observations", icon: "👁️" },
    { value: "harvest", label: "Harvest", icon: "🌾" },
    { value: "transplant", label: "Transplant", icon: "🏺" },
    { value: "photo", label: "Photos", icon: "📸" },
    { value: "note", label: "Notes", icon: "📝" },
    { value: "prune", label: "Pruning", icon: "✂️" },
    { value: "repot", label: "Repotting", icon: "🪴" },
  ];

  // Filter to only show activity types that have data, plus "All Activities"
  const activityTypeFilters = [
    { value: "all", label: "All Activities", icon: "📋" },
    ...allActivityTypeFilters.filter(filter => 
      existingActivityTypes.includes(filter.value)
    )
  ];

  // Reset filter to "all" if current filter is not available in the data
  useEffect(() => {
    if (filter !== "all" && !existingActivityTypes.includes(filter)) {
      setFilter("all");
    }
  }, [filter, existingActivityTypes]);

  const handleLogCare = () => {
    const params = new URLSearchParams();
    if (plantId) params.set("plantId", plantId);
    // if (activityType) params.set("type", activityType);
    navigate(`/log-care?${params.toString()}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          Care History
          <span className="text-sm font-normal text-muted-foreground">
            ({careHistory.length} activities)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {careHistory.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📝</div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No care activities yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Start logging care activities to track your plant's progress
            </p>
            <Button variant="primary" onClick={handleLogCare}>
              Log First Activity
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filter buttons */}
            <div className="flex gap-1 overflow-x-auto pb-2">
              {activityTypeFilters.map((filterOption) => (
                <Button
                  key={filterOption.value}
                  variant={
                    filter === filterOption.value ? "primary" : "outline"
                  }
                  size="sm"
                  onClick={() => setFilter(filterOption.value)}
                  className="whitespace-nowrap"
                >
                  <span className="mr-1">{filterOption.icon}</span>
                  {filterOption.label}
                </Button>
              ))}
            </div>

            {/* Activities list */}
            <div className="space-y-3">
              {displayedHistory.map((activity) => (
                <CareActivityItem key={activity.id} activity={activity} />
              ))}
            </div>

            {/* Show more/less button */}
            {filteredHistory.length > 5 && (
              <div className="text-center pt-4">
                <Button variant="outline" onClick={() => setShowAll(!showAll)}>
                  {showAll
                    ? "Show Less"
                    : `Show All ${filteredHistory.length} Activities`}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CareHistory;
