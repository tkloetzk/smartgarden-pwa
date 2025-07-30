/**
 * Mobile-first component for applying care activities to all plants in a section
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { 
  SectionApplyOption, 
  BulkCareResult, 
  formatSectionDisplayMobile,
  validateBulkCareOperation,
  findPlantsInSameSection
} from '@/services/sectionBulkService';
import { PlantRecord, CareActivityType } from '@/types/consolidated';

export interface SectionApplyCardProps {
  targetPlant: PlantRecord;
  allPlants: PlantRecord[];
  sectionOption: SectionApplyOption;
  activityType: CareActivityType;
  activityLabel: string;
  onApplyToSection: (plantIds: string[]) => Promise<BulkCareResult[]>;
  disabled?: boolean;
  className?: string;
}

export const SectionApplyCard: React.FC<SectionApplyCardProps> = ({
  targetPlant,
  allPlants,
  sectionOption,
  activityType,
  activityLabel,
  onApplyToSection,
  disabled = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [results, setResults] = useState<BulkCareResult[] | null>(null);

  const sectionPlants = findPlantsInSameSection(targetPlant, allPlants);
  const validation = validateBulkCareOperation(sectionPlants, activityType);
  const displayInfo = formatSectionDisplayMobile(sectionOption);

  const handleApplyToSection = async () => {
    setIsApplying(true);
    setResults(null);
    
    try {
      const plantIds = sectionPlants.map(p => p.id);
      const bulkResults = await onApplyToSection(plantIds);
      setResults(bulkResults);
      
      // Auto-collapse after success if all succeeded
      const allSucceeded = bulkResults.every(r => r.success);
      if (allSucceeded) {
        setTimeout(() => setIsExpanded(false), 2000);
      }
    } catch (error) {
      console.error('Failed to apply to section:', error);
      setResults([{
        plantId: 'error',
        plantName: 'Section Apply',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }]);
    } finally {
      setIsApplying(false);
    }
  };

  const getButtonVariant = () => {
    if (results) {
      const allSucceeded = results.every(r => r.success);
      return allSucceeded ? 'outline' : 'destructive';
    }
    return validation.warnings.length > 0 ? 'outline' : 'primary';
  };

  const getButtonText = () => {
    if (isApplying) return 'Applying...';
    if (results) {
      const succeeded = results.filter(r => r.success).length;
      const total = results.length;
      if (succeeded === total) return `✓ Applied to ${total}`;
      return `${succeeded}/${total} succeeded`;
    }
    return `Apply ${activityLabel} to Section`;
  };

  return (
    <Card className={`border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 ${className}`}>
      <CardContent className="p-4">
        {/* Main Action Button */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-shrink-0 text-xl">{displayInfo.emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-emerald-900 dark:text-emerald-100 text-sm">
              {displayInfo.primary}
            </div>
            <div className="text-emerald-700 dark:text-emerald-300 text-xs truncate">
              {displayInfo.secondary}
            </div>
          </div>
          <Button
            size="sm"
            variant={getButtonVariant()}
            onClick={handleApplyToSection}
            disabled={disabled || isApplying || !validation.isValid}
            className="flex-shrink-0 text-xs px-3 py-2"
          >
            {isApplying && <LoadingSpinner size="sm" className="mr-2" />}
            {getButtonText()}
          </Button>
        </div>

        {/* Warnings */}
        {validation.warnings.length > 0 && (
          <div className="flex items-start gap-2 mb-3 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 dark:text-amber-200">
              <div className="font-medium mb-1">Consider differences:</div>
              {validation.warnings.map((warning, index) => (
                <div key={index}>• {warning}</div>
              ))}
            </div>
          </div>
        )}

        {/* Errors */}
        {validation.errors.length > 0 && (
          <div className="flex items-start gap-2 mb-3 p-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-red-800 dark:text-red-200">
              <div className="font-medium mb-1">Cannot apply:</div>
              {validation.errors.map((error, index) => (
                <div key={index}>• {error}</div>
              ))}
            </div>
          </div>
        )}

        {/* Expandable Plant List */}
        <div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full text-left text-xs text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 transition-colors"
          >
            <span>
              {isExpanded ? 'Hide' : 'Show'} plants in section ({sectionOption.plantCount})
            </span>
            {isExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>

          {isExpanded && (
            <div className="mt-2 space-y-1">
              {sectionPlants.map((plant) => {
                const plantResult = results?.find(r => r.plantId === plant.id);
                return (
                  <div
                    key={plant.id}
                    className="flex items-center justify-between py-1 px-2 bg-white dark:bg-gray-800 rounded border border-emerald-100 dark:border-emerald-800"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                        {plant.name || plant.varietyName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {plant.varietyName}
                      </div>
                    </div>
                    {plantResult && (
                      <div className="flex-shrink-0 ml-2">
                        {plantResult.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Results Summary */}
        {results && results.length > 0 && (
          <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {results.filter(r => r.success).length} of {results.length} plants updated successfully
            </div>
            {results.some(r => !r.success) && (
              <div className="mt-1">
                {results.filter(r => !r.success).map((result, index) => (
                  <div key={index} className="text-xs text-red-600 dark:text-red-400">
                    • {result.plantName}: {result.error}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SectionApplyCard;