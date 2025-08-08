import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useFirebasePlants } from '@/hooks/useFirebasePlants';
import { useFirebaseCareActivities } from '@/hooks/useFirebaseCareActivities';
import { inspectPlantData, generatePlantDataReport, createDataBackup } from '@/utils/dataMigration';

interface DataStats {
  totalPlants: number;
  validPlants: number;
  invalidPlants: number;
  needsMigration: number;
  varieties: Record<string, number>;
  fieldAnalysis: Record<string, { present: number; missing: number; types: string[] }>;
}

export function DataInspection() {
  const { plants, loading: plantsLoading } = useFirebasePlants(true); // Include inactive
  const { activities, loading: activitiesLoading } = useFirebaseCareActivities();
  const [stats, setStats] = useState<DataStats | null>(null);
  const [inspectionDetails, setInspectionDetails] = useState<any>(null);

  useEffect(() => {
    if (plants.length > 0) {
      analyzeData();
    }
  }, [plants]);

  const analyzeData = async () => {
    try {
      const report = await generatePlantDataReport(plants);
      
      // Analyze varieties
      const varieties = plants.reduce((acc, plant) => {
        const variety = plant.varietyName || 'Unknown';
        acc[variety] = (acc[variety] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Analyze fields
      const fieldAnalysis: Record<string, { present: number; missing: number; types: string[] }> = {};
      
      plants.forEach(plant => {
        Object.keys(plant).forEach(field => {
          if (!fieldAnalysis[field]) {
            fieldAnalysis[field] = { present: 0, missing: 0, types: [] };
          }
          
          const value = (plant as any)[field];
          if (value !== undefined && value !== null) {
            fieldAnalysis[field].present++;
            const type = typeof value;
            if (!fieldAnalysis[field].types.includes(type)) {
              fieldAnalysis[field].types.push(type);
            }
          } else {
            fieldAnalysis[field].missing++;
          }
        });
      });

      setStats({
        totalPlants: report.summary.total,
        validPlants: report.summary.valid,
        invalidPlants: report.summary.invalid,
        needsMigration: report.summary.needsMigration,
        varieties,
        fieldAnalysis
      });
      
      setInspectionDetails(report.details);
    } catch (error) {
      console.error('Failed to analyze data:', error);
    }
  };

  const handleInspectConsole = () => {
    inspectPlantData(plants);
  };

  const handleCreateBackup = () => {
    const backup = createDataBackup(plants, activities);
    
    // Download as file
    const blob = new Blob([backup], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartgarden-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (plantsLoading || activitiesLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Data Structure Inspection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={analyzeData}>
              Refresh Analysis
            </Button>
            <Button onClick={handleInspectConsole} variant="outline">
              Inspect in Console
            </Button>
            <Button onClick={handleCreateBackup} variant="outline">
              Create Backup
            </Button>
          </div>
          
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.totalPlants}</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Total Plants</div>
              </div>
              <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.validPlants}</div>
                <div className="text-sm text-green-700 dark:text-green-300">Valid Structure</div>
              </div>
              <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.invalidPlants}</div>
                <div className="text-sm text-red-700 dark:text-red-300">Invalid Structure</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-950/30 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats.needsMigration}</div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300">Need Migration</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {stats && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>🌱 Plant Varieties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(stats.varieties).map(([variety, count]) => (
                  <div key={variety} className="flex justify-between items-center p-2 border rounded">
                    <span className="font-medium">{variety}</span>
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📊 Field Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Field</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Missing</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Types</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(stats.fieldAnalysis).map(([field, analysis]) => (
                      <tr key={field}>
                        <td className="px-6 py-4 font-medium">{field}</td>
                        <td className="px-6 py-4 text-green-600">{analysis.present}</td>
                        <td className="px-6 py-4 text-red-600">{analysis.missing}</td>
                        <td className="px-6 py-4 text-gray-600">{analysis.types.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {inspectionDetails && inspectionDetails.some((d: any) => !d.validation.isValid || d.validation.needsMigration) && (
            <Card>
              <CardHeader>
                <CardTitle>⚠️ Data Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inspectionDetails
                    .filter((d: any) => !d.validation.isValid || d.validation.needsMigration)
                    .map((detail: any) => (
                      <div key={detail.id} className="border rounded-lg p-4">
                        <div className="font-medium text-lg">{detail.varietyName} ({detail.id})</div>
                        {detail.validation.errors.length > 0 && (
                          <div className="mt-2">
                            <div className="text-red-600 font-medium">Errors:</div>
                            <ul className="list-disc list-inside text-red-700">
                              {detail.validation.errors.map((error: string, i: number) => (
                                <li key={i}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {detail.validation.warnings.length > 0 && (
                          <div className="mt-2">
                            <div className="text-yellow-600 font-medium">Warnings:</div>
                            <ul className="list-disc list-inside text-yellow-700">
                              {detail.validation.warnings.map((warning: string, i: number) => (
                                <li key={i}>{warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {plants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🔬 Sample Plant Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(plants[0], null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}