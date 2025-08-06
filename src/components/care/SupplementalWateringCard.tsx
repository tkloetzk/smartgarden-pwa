// src/components/care/SupplementalWateringCard.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Droplets, Plus, CheckCircle } from 'lucide-react';
import { PartialWateringAnalysis } from '@/services/partialWateringService';
import { PlantRecord } from '@/types/database';
import { VolumeUnit } from '@/types/consolidated';

export interface SupplementalWateringCardProps {
  plant: PlantRecord;
  analysis: PartialWateringAnalysis;
  onSupplementAdded: (amount: number, unit: VolumeUnit) => Promise<void>;
  onSkip: () => void;
  disabled?: boolean;
  className?: string;
}

export const SupplementalWateringCard: React.FC<SupplementalWateringCardProps> = ({
  plant: _plant, // Prefixed with _ to indicate intentionally unused
  analysis,
  onSupplementAdded,
  onSkip,
  disabled = false,
  className = ''
}) => {
  const [supplementAmount, setSupplementAmount] = useState(analysis.supplementAmount.value);
  const [isAdding, setIsAdding] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleAddSupplement = async () => {
    if (supplementAmount <= 0) return;
    
    setIsAdding(true);
    try {
      await onSupplementAdded(supplementAmount, analysis.supplementAmount.unit);
      setIsCompleted(true);
      setTimeout(() => {
        onSkip(); // Auto-hide after completion
      }, 3000);
    } catch (error) {
      console.error('Failed to add supplemental watering:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddRecommended = () => {
    setSupplementAmount(analysis.supplementAmount.value);
  };

  if (isCompleted) {
    return (
      <Card className={`border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 text-green-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-green-900 dark:text-green-100 text-sm">
                Supplemental watering added!
              </div>
              <div className="text-green-700 dark:text-green-300 text-xs">
                Plant now has adequate water
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 text-amber-600">
              <Droplets className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-amber-900 dark:text-amber-100 text-sm">
                Add remaining water?
              </div>
              <div className="text-amber-700 dark:text-amber-300 text-xs">
                {analysis.supplementAmount.value} {analysis.supplementAmount.unit} more needed for optimal watering
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                type="number"
                value={supplementAmount}
                onChange={(e) => setSupplementAmount(Number(e.target.value))}
                step="0.1"
                min="0"
                max={analysis.supplementAmount.value}
                className="text-sm"
                disabled={disabled || isAdding}
                placeholder="Amount"
              />
            </div>
            <div className="text-sm text-muted-foreground min-w-0">
              {analysis.supplementAmount.unit}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddRecommended}
              disabled={disabled || isAdding}
              className="text-xs px-2"
            >
              Use {analysis.supplementAmount.value}
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleAddSupplement}
              disabled={disabled || isAdding || supplementAmount <= 0}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-sm"
              size="sm"
            >
              {isAdding ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Water
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={onSkip}
              disabled={disabled || isAdding}
              className="px-4 text-sm text-muted-foreground hover:text-foreground"
              size="sm"
            >
              Skip
            </Button>
          </div>

          {/* Info */}
          <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/20 p-2 rounded">
            💡 Adding supplemental water immediately helps ensure optimal plant hydration
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupplementalWateringCard;