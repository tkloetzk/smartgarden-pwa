import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderComponent } from '../utils/testSetup';
import SectionApplyCard from '@/components/care/SectionApplyCard';
import { PlantRecord, CareActivityType } from '@/types/consolidated';
import { SectionApplyOption, BulkCareResult } from '@/services/sectionBulkService';

const mockPlants: PlantRecord[] = [
  {
    id: 'plant-1',
    varietyId: 'tomato-1',
    varietyName: 'Cherry Tomato',
    name: 'Tom 1',
    plantedDate: new Date('2024-01-01'),
    location: 'Indoor',
    container: '🌱 Greenhouse A',
    section: 'Row 1',
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'plant-2', 
    varietyId: 'tomato-1',
    varietyName: 'Cherry Tomato',
    name: 'Tom 2',
    plantedDate: new Date('2024-01-01'),
    location: 'Indoor',
    container: '🌱 Greenhouse A',
    section: 'Row 1',
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'plant-3',
    varietyId: 'basil-1',
    varietyName: 'Sweet Basil',
    name: 'Basil 1',
    plantedDate: new Date('2024-01-01'),
    location: 'Indoor',
    container: '🌱 Greenhouse A',
    section: 'Row 1',
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
] as PlantRecord[];

const mockSectionOption: SectionApplyOption = {
  sectionKey: 'indoor|🌱 greenhouse a|row 1',
  plantCount: 2,
  varieties: ['Cherry Tomato', 'Sweet Basil'],
  location: 'Indoor',
  container: '🌱 Greenhouse A',
  section: 'Row 1',
  hasVarietyMix: true,
  displayText: '🌱 Greenhouse A • Row 1'
};

const mockOnApplyToSection = jest.fn<Promise<BulkCareResult[]>, [string[]]>();

describe('SectionApplyCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    targetPlant: mockPlants[0],
    allPlants: mockPlants,
    sectionOption: mockSectionOption,
    activityType: 'water' as CareActivityType,
    activityLabel: 'Watering',
    onApplyToSection: mockOnApplyToSection,
  };

  it('renders section apply card with correct information', () => {
    renderComponent(<SectionApplyCard {...defaultProps} />);

    expect(screen.getByText('2 plants')).toBeInTheDocument();
    expect(screen.getByText('🌱 Greenhouse A • Row 1 • Mixed varieties')).toBeInTheDocument();
    expect(screen.getByText('Apply Watering to Section')).toBeInTheDocument();
  });

  it('shows variety mix warning when plants have different varieties', () => {
    renderComponent(<SectionApplyCard {...defaultProps} />);

    expect(screen.getByText('Consider differences:')).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === '• Mixed varieties: Cherry Tomato, Sweet Basil';
    })).toBeInTheDocument();
  });

  it('shows expandable plant list', async () => {
    const user = userEvent.setup();
    renderComponent(<SectionApplyCard {...defaultProps} />);

    // Initially collapsed
    expect(screen.queryByText('Tom 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Basil 1')).not.toBeInTheDocument();

    // Click to expand
    await user.click(screen.getByText(/Show plants in section/));

    // Should show the other plants in section
    expect(screen.getByText('Tom 2')).toBeInTheDocument();
    expect(screen.getByText('Basil 1')).toBeInTheDocument();
  });

  it('handles successful bulk apply', async () => {
    const user = userEvent.setup();
    const mockResults: BulkCareResult[] = [
      { plantId: 'plant-2', plantName: 'Tom 2', success: true },
      { plantId: 'plant-3', plantName: 'Basil 1', success: true }
    ];
    
    mockOnApplyToSection.mockResolvedValue(mockResults);

    renderComponent(<SectionApplyCard {...defaultProps} />);

    // Click apply button
    await user.click(screen.getByText('Apply Watering to Section'));

    await waitFor(() => {
      expect(mockOnApplyToSection).toHaveBeenCalledWith(['plant-2', 'plant-3']);
    });

    // Should show success state
    await waitFor(() => {
      expect(screen.getByText('✓ Applied to 2')).toBeInTheDocument();
    });
  });

  it('handles partial success in bulk apply', async () => {
    const user = userEvent.setup();
    const mockResults: BulkCareResult[] = [
      { plantId: 'plant-2', plantName: 'Tom 2', success: true },
      { plantId: 'plant-3', plantName: 'Basil 1', success: false, error: 'Network error' }
    ];
    
    mockOnApplyToSection.mockResolvedValue(mockResults);

    renderComponent(<SectionApplyCard {...defaultProps} />);

    await user.click(screen.getByText('Apply Watering to Section'));

    await waitFor(() => {
      expect(screen.getByText('1/2 succeeded')).toBeInTheDocument();
    });

    // Expand to see individual results
    await user.click(screen.getByText(/Show plants in section/));

    await waitFor(() => {
      // Should show success/failure icons for each plant
      expect(screen.getByText('Tom 2')).toBeInTheDocument();
      expect(screen.getByText('Basil 1')).toBeInTheDocument();
    });
  });

  it('shows loading state during bulk apply', async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: BulkCareResult[]) => void;
    const promise = new Promise<BulkCareResult[]>((resolve) => {
      resolvePromise = resolve;
    });
    
    mockOnApplyToSection.mockReturnValue(promise);

    renderComponent(<SectionApplyCard {...defaultProps} />);

    await user.click(screen.getByText('Apply Watering to Section'));

    expect(screen.getByText('Applying...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /applying/i })).toBeDisabled();

    // Resolve the promise
    resolvePromise!([]);

    await waitFor(() => {
      expect(screen.queryByText('Applying...')).not.toBeInTheDocument();
    });
  });

  it('filters out target plant from section plants', () => {
    renderComponent(<SectionApplyCard {...defaultProps} />);

    // Should show 2 plants (excluding the target plant)
    expect(screen.getByText('2 plants')).toBeInTheDocument();
    
    // Target plant (Tom 1) should not be in the list when expanded
    expect(screen.queryByText('Tom 1')).not.toBeInTheDocument();
  });

  it('disables apply button when disabled prop is true', () => {
    renderComponent(<SectionApplyCard {...defaultProps} disabled />);

    const applyButton = screen.getByRole('button', { name: /apply watering to section/i });
    expect(applyButton).toBeDisabled();
  });
});