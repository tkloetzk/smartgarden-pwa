// src/components/plant/CareHistory.tsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CareRecord } from "@/types/database";
import CareActivityItem from "./CareActivityItem";

interface CareHistoryProps {
  careHistory: CareRecord[];
}

const CareHistory: React.FC<CareHistoryProps> = ({ careHistory }) => {
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

  const activityTypeFilters = [
    { value: "all", label: "All Activities", icon: "📋" },
    { value: "water", label: "Watering", icon: "💧" },
    { value: "fertilize", label: "Fertilizing", icon: "🌱" },
    { value: "observe", label: "Observations", icon: "👁️" },
    { value: "harvest", label: "Harvest", icon: "🌾" },
    { value: "transplant", label: "Transplant", icon: "🏺" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          Care History
          <span className="text-sm font-normal text-gray-500">
            ({careHistory.length} activities)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {careHistory.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No care activities yet
            </h3>
            <p className="text-gray-600 mb-4">
              Start logging care activities to track your plant's progress
            </p>
            <Button variant="primary">Log First Activity</Button>
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
