import { Card, CardContent } from "@/components/ui/Card";

export interface CareStatusCardProps {
  plantsNeedingCatchUp: number;
  careStatusLoading: boolean;
  onCatchUpClick: () => void;
}

export const CareStatusCard = ({
  plantsNeedingCatchUp,
  careStatusLoading,
  onCatchUpClick,
}: CareStatusCardProps) => {
  return (
    <Card
      role="button"
      aria-label="Plant Care Status"
      className={`cursor-pointer transition-all duration-200 ${
        careStatusLoading
          ? "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
          : plantsNeedingCatchUp > 0
          ? "border-orange-200 bg-orange-50 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950/30 dark:hover:bg-orange-950/50"
          : "border-green-200 bg-green-50 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/30 dark:hover:bg-green-950/50"
      }`}
      onClick={careStatusLoading ? undefined : onCatchUpClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2
              className={`text-sm font-medium ${
                careStatusLoading
                  ? "text-gray-600 dark:text-gray-400"
                  : plantsNeedingCatchUp > 0
                  ? "text-orange-800 dark:text-orange-200"
                  : "text-green-800 dark:text-green-200"
              }`}
            >
              Plant Care Status
            </h2>
            {careStatusLoading ? (
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                ⏳
              </p>
            ) : (
              <p
                data-testid="care-status-subtext"
                className={`text-2xl font-bold ${
                  plantsNeedingCatchUp > 0
                    ? "text-orange-900 dark:text-orange-100"
                    : "text-green-900 dark:text-green-100"
                }`}
              >
                {plantsNeedingCatchUp === 0 ? "✅" : plantsNeedingCatchUp}
              </p>
            )}
            <p
              className={`text-xs ${
                careStatusLoading
                  ? "text-gray-500 dark:text-gray-400"
                  : plantsNeedingCatchUp > 0
                  ? "text-orange-700 dark:text-orange-300"
                  : "text-green-700 dark:text-green-300"
              }`}
            >
              {careStatusLoading
                ? "Checking plants..."
                : plantsNeedingCatchUp === 0
                ? "All caught up!"
                : `plants need attention`}
            </p>
          </div>
          <div className="text-2xl">
            {careStatusLoading ? "🔄" : plantsNeedingCatchUp > 0 ? "⚠️" : "🌱"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
