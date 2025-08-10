// src/pages/admin/CareActivityGroupingTest.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useFirebaseCareActivities } from "@/hooks/useFirebaseCareActivities";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";
import { groupCareActivities, isGroupedActivity } from "@/utils/careActivityGrouping";
import CareActivityItem from "@/components/plant/CareActivityItem";
import GroupedCareActivityItem from "@/components/plant/GroupedCareActivityItem";

export function CareActivityGroupingTest() {
  const { activities, loading: activitiesLoading } = useFirebaseCareActivities();
  const { plants } = useFirebasePlants();
  const [showGrouped, setShowGrouped] = useState(true);

  // Get recent activities (last 7 days) to see potential groupings
  const recentActivities = activities.filter(activity => {
    const activityDate = new Date(activity.date);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return activityDate >= sevenDaysAgo;
  }).slice(0, 20); // Limit to 20 most recent

  const groupedActivities = groupCareActivities(recentActivities);

  const getPlantName = (plantId: string) => {
    const plant = plants.find(p => p.id === plantId);
    return plant?.varietyName || `Plant ${plantId.slice(0, 8)}`;
  };

  if (activitiesLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading activities...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            🧪 Care Activity Grouping Test
            <div className="flex gap-2">
              <Button
                variant={showGrouped ? "primary" : "outline"}
                onClick={() => setShowGrouped(true)}
                size="sm"
              >
                Grouped View
              </Button>
              <Button
                variant={!showGrouped ? "primary" : "outline"}
                onClick={() => setShowGrouped(false)}
                size="sm"
              >
                Individual View
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{recentActivities.length}</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Total Activities (7 days)</div>
            </div>
            <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{groupedActivities.length}</div>
              <div className="text-sm text-green-700 dark:text-green-300">Display Items</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {groupedActivities.filter(isGroupedActivity).length}
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">Grouped Activities</div>
            </div>
          </div>

          <div className="space-y-4">
            {showGrouped ? (
              <>
                <h3 className="font-medium text-lg">Grouped View (as it would appear in care history):</h3>
                {groupedActivities.length === 0 ? (
                  <p className="text-muted-foreground">No recent activities to display</p>
                ) : (
                  <div className="space-y-3">
                    {groupedActivities.map((item) => {
                      if (isGroupedActivity(item)) {
                        return (
                          <div key={item.id} className="relative">
                            <GroupedCareActivityItem groupedActivity={item} />
                            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                              GROUPED
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div key={item.id} className="relative">
                            <CareActivityItem activity={item} />
                            <div className="absolute top-2 right-2 bg-gray-400 text-white text-xs px-2 py-1 rounded">
                              INDIVIDUAL
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 className="font-medium text-lg">Individual View (traditional):</h3>
                {recentActivities.length === 0 ? (
                  <p className="text-muted-foreground">No recent activities to display</p>
                ) : (
                  <div className="space-y-3">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="relative">
                        <CareActivityItem activity={activity} />
                        <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          {getPlantName(activity.plantId)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {groupedActivities.filter(isGroupedActivity).length > 0 && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">✅ Grouping Analysis:</h4>
              <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
                {groupedActivities.filter(isGroupedActivity).map((group) => (
                  <div key={group.id}>
                    • Found {group.plantCount} similar {group.type} activities logged within 2 minutes
                    {group.activities.length > 1 && (
                      <div className="ml-4 text-xs">
                        Plants: {group.activities.map(a => getPlantName(a.plantId)).join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {groupedActivities.filter(isGroupedActivity).length === 0 && (
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">ℹ️ No Grouped Activities Found</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                To test grouping, try logging the same type of activity (water, fertilize, etc.) for multiple plants 
                within 2 minutes using the bulk actions on the dashboard. Then refresh this page to see them grouped together.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}