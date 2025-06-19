import { GrowthStage, PlantCategory } from "./plants";

// Individual harvest record
export interface HarvestRecord {
  id: string;
  plantId: string;
  varietyId: string;
  harvestDate: Date;

  // Harvest details
  harvest: {
    method: HarvestMethod;
    amount: number;
    unit: "oz" | "lbs" | "count" | "bunches" | "cups";
    quality: QualityRating;
    maturity: MaturityLevel;
  };

  // Plant context at harvest
  plantContext: {
    age: number; // days since planting
    currentStage: GrowthStage;
    overallHealth: "excellent" | "good" | "fair" | "poor";
    growingConditions: string; // brief description
  };

  // Harvest technique details
  technique: {
    description: string; // e.g., "cut outer leaves", "selective picking"
    toolsUsed?: string[];
    timeOfDay: string;
    weatherConditions?: string; // for outdoor plants
    portionHarvested?: string; // e.g., "outer third", "whole plant", "top 6 inches"
  };

  // Quality assessment
  qualityDetails: {
    size: "baby" | "optimal" | "oversized" | "mixed";
    appearance: "excellent" | "good" | "fair" | "poor";
    flavor?: "excellent" | "good" | "fair" | "poor" | "bitter" | "bland";
    texture?: "tender" | "crisp" | "tough" | "wilted";
    defects?: string[]; // e.g., "insect damage", "bolting", "cracking"
  };

  // Post-harvest handling
  postHarvest?: {
    processingMethod?: string; // e.g., "washed", "trimmed", "dried"
    storageMethod?: string; // e.g., "refrigerated", "root cellar", "dried"
    shelfLifeExpectation?: string; // e.g., "1 week", "3 months"
    actualShelfLife?: number; // days if tracked
  };

  // Photos and documentation
  photos?: string[]; // photo IDs
  notes?: string;

  // Yield analysis (calculated fields)
  yieldAnalysis?: {
    expectedYield?: number;
    yieldComparison: "below-expected" | "as-expected" | "above-expected";
    efficiencyRating?: number; // 1-5 scale
  };
}

// Harvest method types (from your document)
export type HarvestMethod =
  | "cut-and-come-again" // leafy greens, herbs
  | "selective-picking" // berries, pods, individual fruits
  | "whole-plant" // lettuce heads, broccoli main head
  | "selective-pulling" // root vegetables (carrots, beets)
  | "zone-harvest" // clearing entire bed section
  | "continuous-harvest" // ongoing picking over weeks
  | "single-harvest"; // one-time harvest of entire plant

export type QualityRating =
  | "excellent"
  | "good"
  | "fair"
  | "poor"
  | "unsaleable";

export type MaturityLevel =
  | "baby" // baby carrots, baby spinach
  | "optimal" // perfect harvest timing
  | "mature" // fully developed
  | "overripe" // past optimal
  | "bolted" // gone to seed
  | "mixed"; // mixed maturities in same harvest

// Yield tracking for plant instances
export interface PlantYieldTracking {
  plantId: string;
  varietyId: string;

  // Expected vs actual yields
  yieldExpectations: {
    expectedTotalYield: number;
    expectedYieldUnit: string;
    expectedFirstHarvest: number; // days from planting
    expectedHarvestDuration: number; // days of productive harvest
    expectedHarvestFrequency?: string; // e.g., "every 3-5 days"
    source: "protocol" | "variety-data" | "user-estimate" | "historical";
  };

  // Actual performance
  actualPerformance: {
    totalYieldToDate: number;
    harvestCount: number;
    firstHarvestAge: number; // actual days to first harvest
    currentProductiveDays: number;
    averageHarvestInterval?: number; // days between harvests
    lastHarvestDate?: Date;
  };

  // Productivity metrics
  productivity: {
    yieldPerDay: number; // total yield / days since planting
    yieldPerSquareFoot?: number; // if space tracking available
    harvestEfficiency: number; // actual vs expected (0-2.0+)
    qualityConsistency: "excellent" | "good" | "variable" | "declining";
  };

  // Harvest predictions
  predictions: {
    nextHarvestPredicted?: Date;
    estimatedRemainingYield?: number;
    estimatedProductionEnd?: Date;
    confidenceLevel: "high" | "medium" | "low";
  };

  // Status
  status: {
    isActivelyHarvesting: boolean;
    productionPhase:
      | "pre-harvest"
      | "early-production"
      | "peak-production"
      | "declining"
      | "finished";
    replacementNeeded?: boolean;
    replacementPlanned?: Date;
  };
}

// Succession planting yield analysis
export interface SuccessionYieldAnalysis {
  id: string;
  cropName: string;
  varietyId: string;

  // Succession parameters
  successionPlan: {
    plannedInterval: number; // days between plantings
    actualIntervals: number[]; // actual intervals achieved
    totalPlantings: number;
    planningPeriod: {
      startDate: Date;
      endDate: Date;
    };
  };

  // Overall production metrics
  productionMetrics: {
    totalYield: number;
    totalYieldUnit: string;
    averageYieldPerPlanting: number;
    yieldConsistency: "excellent" | "good" | "variable" | "poor";

    // Continuous supply effectiveness
    gapsInSupply: number; // days without harvest
    overproductionDays: number; // days with excess harvest
    supplyConsistency: "excellent" | "good" | "variable" | "poor";
  };

  // Timing analysis
  timingAnalysis: {
    averageDaysToFirstHarvest: number;
    averageProductivePeriod: number; // days per planting
    optimalSuccessionInterval?: number; // calculated optimal interval
    seasonalVariations: {
      season: string;
      avgDaysToHarvest: number;
      avgYieldPerPlanting: number;
      notes?: string;
    }[];
  };

  // Individual planting performance
  plantingPerformance: {
    plantingDate: Date;
    harvestStartDate?: Date;
    harvestEndDate?: Date;
    totalYield: number;
    qualityRating: QualityRating;
    issues?: string[];
    notes?: string;
  }[];

  // Recommendations for optimization
  recommendations: {
    intervalAdjustments?: string;
    timingAdjustments?: string;
    yieldImprovements?: string[];
    qualityImprovements?: string[];
    efficiencyGains?: string[];
  };

  lastAnalysisDate: Date;
  nextAnalysisPlanned?: Date;
}

// Harvest planning and prediction system
export interface HarvestPlan {
  id: string;
  planningPeriod: {
    startDate: Date;
    endDate: Date;
    description?: string; // e.g., "Summer 2025 Succession Plan"
  };

  // Planned harvests
  plannedHarvests: PlannedHarvest[];

  // Actual vs planned tracking
  tracking: {
    planAccuracy: number; // 0-1 percentage of accurate predictions
    yieldAccuracy: number; // 0-1 actual vs predicted yields
    timingAccuracy: number; // 0-1 timing prediction accuracy
    adjustmentsMade: PlanAdjustment[];
  };

  // Resource planning
  resourcePlanning?: {
    expectedStorageNeeds: string;
    expectedProcessingTime: string;
    expectedPreservationMethods: string[];
    marketingPlan?: string; // if selling excess
  };
}

// Individual planned harvest
export interface PlannedHarvest {
  id: string;
  plantId: string;
  varietyId: string;

  // Predicted timing
  prediction: {
    expectedDate: Date;
    confidenceRange: [Date, Date]; // earliest to latest expected
    confidenceLevel: "high" | "medium" | "low";
    basedOn: "protocol" | "growth-tracking" | "historical" | "visual-cues";
  };

  // Expected yield
  expectedYield: {
    amount: number;
    unit: string;
    qualityExpected: QualityRating;
    harvestMethod: HarvestMethod;
  };

  // Planning details
  planning: {
    harvestWindow: number; // days of optimal harvest window
    followUpHarvests?: Date[]; // for cut-and-come-again crops
    replacementPlanting?: Date; // when to plant replacement
    storagePreparation?: string[];
  };

  // Status tracking
  status: "planned" | "ready" | "harvested" | "missed" | "cancelled";
  actualHarvestId?: string; // links to actual harvest record

  notes?: string;
}

// Plan adjustments using union types
export type PlanAdjustment =
  | TimingAdjustment
  | YieldAdjustment
  | QualityAdjustment
  | MethodAdjustment
  | SuccessionIntervalAdjustment;

export interface TimingAdjustment {
  date: Date;
  type: "timing";
  original: {
    description: string;
    expectedDate: Date;
  };
  adjusted: {
    description: string;
    newExpectedDate: Date;
    reason: string;
  };
  impact: AdjustmentImpact;
  effectiveness?: AdjustmentEffectiveness;
  notes?: string;
}

export interface YieldAdjustment {
  date: Date;
  type: "yield";
  original: {
    description: string;
    expectedAmount: number;
    unit: string;
  };
  adjusted: {
    description: string;
    newExpectedAmount: number;
    reason: string;
  };
  impact: AdjustmentImpact;
  effectiveness?: AdjustmentEffectiveness;
  notes?: string;
}

export interface QualityAdjustment {
  date: Date;
  type: "quality";
  original: {
    description: string;
    expectedQuality: QualityRating;
  };
  adjusted: {
    description: string;
    newExpectedQuality: QualityRating;
    reason: string;
  };
  impact: AdjustmentImpact;
  effectiveness?: AdjustmentEffectiveness;
  notes?: string;
}

export interface MethodAdjustment {
  date: Date;
  type: "method";
  original: {
    description: string;
    harvestMethod: HarvestMethod;
  };
  adjusted: {
    description: string;
    newHarvestMethod: HarvestMethod;
    reason: string;
  };
  impact: AdjustmentImpact;
  effectiveness?: AdjustmentEffectiveness;
  notes?: string;
}

export interface SuccessionIntervalAdjustment {
  date: Date;
  type: "succession-interval";
  original: {
    description: string;
    intervalDays: number;
  };
  adjusted: {
    description: string;
    newIntervalDays: number;
    reason: string;
  };
  impact: AdjustmentImpact;
  effectiveness?: AdjustmentEffectiveness;
  notes?: string;
}

export interface AdjustmentImpact {
  futureHarvests: string[];
  successionTiming?: string;
  resourcePlanning?: string;
}

export type AdjustmentEffectiveness =
  | "successful"
  | "partially-successful"
  | "unsuccessful";

// Overall garden productivity analysis
export interface ProductivityAnalysis {
  id: string;
  analysisType: "weekly" | "monthly" | "seasonal" | "annual";
  period: {
    startDate: Date;
    endDate: Date;
    daysAnalyzed: number;
  };

  // Overall metrics
  overallMetrics: {
    totalYield: number;
    totalYieldUnit: string;
    yieldPerSquareFoot?: number;
    yieldPerDay: number;
    varietyCount: number;
    harvestCount: number;
    averageQuality: QualityRating;
  };

  // Category breakdown
  categoryBreakdown: {
    category: PlantCategory;
    yield: number;
    yieldUnit: string;
    percentage: number; // of total yield
    plantCount: number;
    averageQuality: QualityRating;
    topPerformers: string[]; // plant IDs or variety names
  }[];

  // Succession effectiveness
  successionEffectiveness: {
    cropsWithSuccession: string[];
    averageSupplyConsistency: "excellent" | "good" | "variable" | "poor";
    gapsInSupply: {
      crop: string;
      gapDays: number[];
      totalGapDays: number;
    }[];
    overproduction: {
      crop: string;
      excessDays: number[];
      estimatedWaste: number;
    }[];
  };

  // Efficiency metrics
  efficiency: {
    spaceUtilization: number; // 0-1 percentage of space actively producing
    timeToFirstHarvest: Record<string, number>; // variety name -> days
    productivePeriod: Record<string, number>; // variety name -> days
    yieldPerInputHour?: number; // if labor tracking available
    costPerUnit?: number; // if cost tracking available
  };

  // Trends and patterns
  trends: {
    yieldTrend: "increasing" | "stable" | "decreasing";
    qualityTrend: "improving" | "stable" | "declining";
    efficiencyTrend: "improving" | "stable" | "declining";
    seasonalPatterns?: string[];
  };

  // Recommendations
  recommendations: {
    varietyChanges?: string[];
    successionAdjustments?: string[];
    spacingOptimizations?: string[];
    timingImprovements?: string[];
    qualityImprovements?: string[];
    efficiencyGains?: string[];
  };

  // Comparison data
  comparisons?: {
    previousPeriod?: {
      yieldChange: number; // percentage
      qualityChange: string;
      efficiencyChange: number;
    };
    targetMetrics?: {
      targetYield?: number;
      actualVsTarget: number; // percentage
      targetQuality?: QualityRating;
      targetEfficiency?: number;
    };
  };

  generatedAt: Date;
  nextAnalysisScheduled?: Date;
}

// Variety-specific performance tracking
export interface VarietyPerformanceRecord {
  varietyId: string;
  varietyName: string;
  category: PlantCategory;

  // Performance period
  trackingPeriod: {
    startDate: Date;
    endDate: Date;
    plantsTracked: number;
    harvestsRecorded: number;
  };

  // Aggregate performance
  performance: {
    averageYield: number;
    yieldUnit: string;
    yieldRange: [number, number]; // [min, max]
    averageQuality: QualityRating;
    successRate: number; // 0-1 percentage of plants that produced

    // Timing metrics
    averageDaysToFirstHarvest: number;
    averageProductivePeriod: number;
    harvestFrequency?: number; // harvests per week for continuous crops
  };

  // Growing condition correlations
  optimalConditions?: {
    bestYieldConditions: string;
    bestQualityConditions: string;
    problemConditions: string[];
    seasonalPerformance: {
      season: string;
      performanceRating: "excellent" | "good" | "fair" | "poor";
      notes?: string;
    }[];
  };

  // Issues and solutions
  commonIssues: {
    issue: string;
    frequency: number; // how often this occurred
    impact: "low" | "medium" | "high";
    solutions?: string[];
  }[];

  // Recommendations
  recommendations: {
    growingTips: string[];
    avoidConditions: string[];
    optimalTiming: string[];
    yieldImprovements: string[];
  };

  lastUpdated: Date;
}
