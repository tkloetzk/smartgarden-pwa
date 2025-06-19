import { GrowthStage, PlantCategory } from "./plants";

// Core environmental reading
export interface EnvironmentalReading {
  id: string;
  timestamp: Date;
  locationId: string; // which zone/area this reading is from

  // Core measurements
  measurements: {
    temperature?: number; // °F
    humidity?: number; // %
    lightLevel?: number; // PPFD µmol/m²/s (if measured)
    airflow?: number; // CFM or relative scale
    co2Level?: number; // ppm
    soilTemperature?: number; // °F for soil sensors
  };

  // Data source and quality
  source: "manual" | "sensor" | "weather-api" | "estimated";
  deviceId?: string;
  accuracy?: number; // confidence 0-1

  // Comparison to target conditions
  status?: {
    temperature: "low" | "optimal" | "high" | "critical";
    humidity: "low" | "optimal" | "high" | "critical";
    overall: "good" | "attention" | "critical";
  };
}

// Lighting zone management (core of your indoor system)
export interface LightingZone {
  id: string;
  name: string; // e.g., "Main Bed Front Zone", "Overhead Shelf Left"
  description?: string;

  // Physical coverage
  coverage: {
    area: string; // e.g., "2x4 ft", "75" width"
    height: number; // inches from plants
    shape: "rectangular" | "circular" | "custom";
    coordinates?: {
      x: number;
      y: number;
      width: number;
      depth: number;
    };
  };

  // Lighting hardware
  fixtures: LightingFixture[];

  // Current settings
  currentSettings: {
    ppfd: number; // current PPFD µmol/m²/s
    photoperiod: number; // hours per day
    intensity: number; // 0-100%
    schedule: string; // schedule ID or description
    isActive: boolean;
  };

  // Capabilities
  capabilities: {
    maxPPFD: number;
    minPPFD: number;
    dimmable: boolean;
    photoperiodControl: boolean;
    spectrumControl: boolean;
    individualFixtureControl: boolean;
  };

  // Current plant assignments
  plantAssignments?: {
    plantId: string;
    variety: string;
    currentStage: GrowthStage;
    requiredPPFD: [number, number];
    requiredPhotoperiod: number;
  }[];

  // Zone-specific environmental readings
  environmentalReadings?: string[]; // environmental reading IDs
}

// Individual lighting fixture
export interface LightingFixture {
  id: string;
  name: string; // e.g., "Spider Farmer SF2000", "HLG 65 V2"
  model: string;
  manufacturer?: string;

  // Technical specifications
  specs: {
    maxWattage: number;
    maxPPFD: number;
    coverage: string; // e.g., "2x4 ft flowering", "3x3 ft veg"
    efficacy?: number; // µmol/J
    spectrum: string; // e.g., "full spectrum", "3000K + 660nm"
  };

  // Current status
  status: {
    isOn: boolean;
    currentIntensity: number; // 0-100%
    currentWattage?: number;
    temperature?: number; // fixture temperature
    hoursUsed?: number;
  };

  // Control capabilities
  controls: {
    dimmable: boolean;
    spectrumControl: boolean;
    schedulable: boolean;
    daisyChain?: boolean;
  };

  // Physical installation
  installation: {
    height: number; // inches from canopy
    angle?: number; // degrees if adjustable
    position: string; // description of physical position
    installedDate?: Date;
  };
}

// Lighting schedule (for photoperiod management)
export interface LightingSchedule {
  id: string;
  name: string; // e.g., "Seedling Schedule", "Fruiting Schedule"
  description?: string;

  // Schedule periods
  periods: LightingPeriod[];

  // Target plant types/stages
  targetStages: GrowthStage[];
  targetCategories?: PlantCategory[];

  // Seasonal adjustments
  seasonalAdjustments?: {
    winter?: Partial<LightingPeriod>[];
    summer?: Partial<LightingPeriod>[];
    spring?: Partial<LightingPeriod>[];
    fall?: Partial<LightingPeriod>[];
  };

  // Dynamic adjustments
  dynamicFeatures?: {
    weatherResponsive: boolean; // adjust based on natural light
    plantStageResponsive: boolean; // auto-adjust as plants grow
    energyOptimized: boolean;
  };

  isActive: boolean;
  createdAt: Date;
  lastModified: Date;
}

// Individual lighting period within a schedule
export interface LightingPeriod {
  name?: string; // e.g., "Morning Ramp", "Main Period", "Evening Fade"
  startTime: string; // "06:00" format
  endTime: string; // "22:00" format

  // Light intensity
  intensity: number; // 0-100% of fixture capability
  targetPPFD?: number; // desired PPFD µmol/m²/s

  // Spectrum control (if available)
  spectrum?: {
    red?: number; // 0-100%
    blue?: number; // 0-100%
    white?: number; // 0-100%
    farRed?: number;
    uv?: number;
  };

  // Days active
  daysOfWeek: number[]; // 0-6, Sunday = 0

  // Gradual transitions
  transitions?: {
    fadeIn?: number; // minutes to reach full intensity
    fadeOut?: number; // minutes to fade from full intensity
  };

  // Conditional activation
  conditions?: {
    outdoorLightBelow?: number; // only if outdoor light below threshold
    temperatureBelow?: number;
    humidityAbove?: number;
    plantStageRequirement?: GrowthStage[];
  };

  notes?: string;
}

// Environmental control system
export interface EnvironmentalControlSystem {
  id: string;
  name: string;
  location: string;

  // Control capabilities
  capabilities: {
    temperatureControl: "heating" | "cooling" | "both" | "none";
    humidityControl: "increase" | "decrease" | "both" | "none";
    ventilationControl: boolean;
    lightingControl: boolean;
    co2Control?: boolean;
  };

  // Current status
  status: {
    isActive: boolean;
    mode: "auto" | "manual" | "off";
    lastUpdate: Date;
    alerts?: EnvironmentalAlert[];
  };

  // Target conditions
  targets: {
    temperature: {
      min: number;
      max: number;
      optimal: number;
      unit: "F" | "C";
    };
    humidity: {
      min: number;
      max: number;
      optimal: number;
    };
    co2?: {
      target: number;
      unit: "ppm";
    };
  };

  // Automation rules
  automationRules: AutomationRule[];

  // Seasonal adjustments (critical for Minnesota Zone 4b)
  seasonalSettings: SeasonalEnvironmentalSettings[];
}

// Automation rule for environmental control
export interface AutomationRule {
  id: string;
  name: string;
  isActive: boolean;
  priority: number; // 1-10, higher = more important

  // Trigger conditions
  trigger: {
    parameter: "temperature" | "humidity" | "light" | "time" | "plant-stage";
    condition: "above" | "below" | "between" | "equals" | "schedule";
    value: number | [number, number] | string;
    duration?: number; // minutes condition must persist
  };

  // Actions to take
  actions: {
    type:
      | "lighting"
      | "fan"
      | "heater"
      | "humidifier"
      | "dehumidifier"
      | "notification";
    parameters: { [key: string]: number | string | boolean };
    duration?: number; // how long to perform action
  }[];

  // Safety limits
  safetyLimits: {
    maxTemperature?: number;
    minTemperature?: number;
    maxHumidity?: number;
    minHumidity?: number;
  };

  // Logging
  lastTriggered?: Date;
  triggerCount: number;
  effectiveness?: number; // 1-5 scale
}

// Environmental alerts
export interface EnvironmentalAlert {
  id: string;
  type: "temperature" | "humidity" | "light" | "system" | "sensor";
  severity: "info" | "warning" | "critical" | "emergency";

  message: string;
  details?: string;

  // Alert conditions
  condition: {
    parameter: string;
    value: number;
    threshold: number;
    duration?: number; // how long condition persisted
  };

  // Affected areas
  affectedZones: string[];
  affectedPlants?: string[];

  // Response
  recommendedActions?: string[];
  autoActionsTriggered?: string[];

  // Status
  isActive: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;

  createdAt: Date;
}

// Seasonal environmental settings (critical for your Zone 4b location)
export interface SeasonalEnvironmentalSettings {
  season: "winter" | "spring" | "summer" | "fall";
  effectiveFrom: Date; // when this season's settings start
  effectiveTo: Date; // when they end

  // Environmental targets adjusted for season
  environmentalTargets: {
    temperature: {
      indoor: [number, number]; // [min, max] °F
      tolerance: number; // acceptable deviation
    };
    humidity: {
      target: [number, number]; // [min, max] %
      challenges: string[]; // e.g., "heating systems reduce humidity"
      solutions: string[]; // e.g., "use humidifier", "water trays"
    };
  };

  // Lighting adjustments for natural light changes
  lightingAdjustments: {
    naturalLightHours: number; // average for this season
    ledCompensation: "increase" | "decrease" | "maintain";
    photoperiodAdjustments: { [category: string]: number }; // hours to add/subtract
    intensityMultiplier: number; // 0.8-1.2 to adjust for season
  };

  // Seasonal challenges specific to Minnesota
  seasonalChallenges: {
    primaryIssues: string[];
    monitoringFocus: string[]; // what to watch carefully
    preventiveMeasures: string[];
  };

  // Equipment adjustments
  equipmentSettings: {
    fanSettings: "low" | "medium" | "high";
    humidifierNeeded: boolean;
    dehumidifierNeeded: boolean;
    heaterBackup?: boolean;
    additionalVentilation?: boolean;
  };
}

// Minnesota Zone 4b specific environmental profile
export interface MinnesotaZone4bProfile {
  // Basic location info
  location: {
    zone: "4b";
    state: "Minnesota";
    city?: string;
    latitude?: number;
    longitude?: number;
  };

  // Seasonal patterns
  seasonalPatterns: {
    winter: {
      challenges: [
        "low humidity from heating",
        "limited natural light",
        "temperature fluctuations"
      ];
      solutions: ["humidifier use", "increase LED duration", "thermal mass"];
      typicalIndoorHumidity: [20, 40]; // % typical range
      typicalOutdoorTemp: [-10, 25]; // °F range
    };
    summer: {
      challenges: ["heat buildup from LEDs", "potential cooling needs"];
      solutions: [
        "fan circulation",
        "evening LED schedules",
        "cooling strategies"
      ];
      typicalIndoorHumidity: [40, 60];
      typicalOutdoorTemp: [60, 85];
    };
    spring: {
      challenges: ["transition period", "variable conditions"];
      solutions: ["flexible schedules", "gradual adjustments"];
    };
    fall: {
      challenges: ["preparation for winter", "decreasing natural light"];
      solutions: ["equipment checks", "schedule adjustments"];
    };
  };

  // Environmental recommendations
  recommendations: {
    winterHumidityManagement: string[];
    summerCoolingStrategies: string[];
    yearRoundMonitoring: string[];
    equipmentMaintenance: string[];
  };
}

// Sensor configuration and management
export interface SensorConfiguration {
  id: string;
  name: string;
  type: "temperature" | "humidity" | "light" | "soil-moisture" | "co2" | "ph";
  location: string; // which zone this sensor is in

  // Technical specs
  specifications: {
    manufacturer?: string;
    model?: string;
    accuracy: string; // e.g., "±0.5°F", "±2%"
    range: string; // e.g., "32-100°F", "0-100%"
    resolution: string; // e.g., "0.1°F", "1%"
  };

  // Current status
  status: {
    isActive: boolean;
    lastReading?: Date;
    batteryLevel?: number; // %
    signalStrength?: number; // %
    calibrationDue?: boolean;
  };

  // Configuration
  settings: {
    readingInterval: number; // minutes between readings
    alertThresholds: {
      min?: number;
      max?: number;
      critical?: number;
    };
    dataRetention: number; // days to keep data
    autoCalibration: boolean;
  };

  // Installation details
  installation: {
    installedDate: Date;
    height?: number; // inches from ground/surface
    position: string; // description
    calibrationHistory: CalibrationRecord[];
  };
}

// Sensor calibration tracking
export interface CalibrationRecord {
  date: Date;
  method: "factory" | "manual" | "reference";
  beforeReading?: number;
  afterReading?: number;
  referenceValue?: number;
  notes?: string;
  performedBy: string;
}
