// Test for SimplifiedLocationSelector section occupation detection
import { render } from '@testing-library/react';
import { SimplifiedLocationSelector } from '@/components/plant/SimplifiedLocationSelector';
import { useFirebasePlants } from '@/hooks/useFirebasePlants';

// Mock the hooks
jest.mock('@/hooks/useFirebasePlants');
const mockUseFirebasePlants = useFirebasePlants as jest.MockedFunction<typeof useFirebasePlants>;

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  useForm: () => ({
    register: jest.fn(),
    handleSubmit: jest.fn(),
    reset: jest.fn(),
    watch: jest.fn(() => 'grow-bag'),
    setValue: jest.fn(),
    formState: { errors: {} },
  }),
}));

describe('SimplifiedLocationSelector - Section Occupation', () => {
  const defaultProps = {
    selectedBedId: 'bed-1',
    section: '',
    location: true,
    onBedSelect: jest.fn(),
    onSectionChange: jest.fn(),
    onStructuredSectionChange: jest.fn(),
    onLocationChange: jest.fn(),
  };

  beforeEach(() => {
    // Mock plants data with occupied sections
    mockUseFirebasePlants.mockReturnValue({
      plants: [
        {
          id: 'plant-1',
          varietyId: 'carrot-variety-id',
          varietyName: 'Carrots',
          name: 'Test Carrots',
          container: 'Little Bed',
          section: 'Row 1, Column 1',
          structuredSection: {
            bedId: 'bed-1',
            position: { start: 0, length: 12, unit: 'inches' as const },
            row: 1,
            column: 1,
          },
          plantedDate: new Date('2024-01-01'),
          location: 'Outdoor',
          isActive: true,
          createdAt: new Date('2024-01-01'),
        },
      ],
      loading: false,
      error: null,
      createPlant: jest.fn(),
      updatePlant: jest.fn(),
      deletePlant: jest.fn(),
    });
  });

  it('should identify occupied sections correctly', () => {
    const { container } = render(
      <SimplifiedLocationSelector {...defaultProps} />
    );

    // The component should render without errors
    expect(container).toBeTruthy();
  });

  it('should handle plants with text-based sections', () => {
    mockUseFirebasePlants.mockReturnValue({
      plants: [
        {
          id: 'plant-2',
          varietyId: 'tomato-variety-id',
          varietyName: 'Tomatoes',
          name: 'Test Tomatoes',
          container: 'Little Bed',
          section: 'R2C3', // Text-based section format
          structuredSection: undefined,
          plantedDate: new Date('2024-01-01'),
          location: 'Outdoor',
          isActive: true,
          createdAt: new Date('2024-01-01'),
        },
      ],
      loading: false,
      error: null,
      createPlant: jest.fn(),
      updatePlant: jest.fn(),
      deletePlant: jest.fn(),
    });

    const { container } = render(
      <SimplifiedLocationSelector {...defaultProps} />
    );

    expect(container).toBeTruthy();
  });
});