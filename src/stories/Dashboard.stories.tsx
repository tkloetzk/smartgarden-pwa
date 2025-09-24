import { Dashboard } from '@/pages/dashboard';
import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';

// Mock Firebase user
const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
  isAnonymous: false,
  metadata: {
    creationTime: '2024-08-01T00:00:00Z',
    lastSignInTime: '2024-08-01T00:00:00Z',
  },
  providerData: [],
  refreshToken: 'mock-token',
  tenantId: null,
  phoneNumber: null,
  photoURL: null,
  providerId: 'firebase',
};

// Mock plants data
const mockPlants = [
  {
    id: 'plant-1',
    name: 'Cherry Tomato',
    varietyName: 'Cherry Tomato',
    plantedDate: new Date('2024-08-01'),
    container: '6-inch pot',
    location: 'Kitchen window',
  },
  {
    id: 'plant-2',
    name: 'Sweet Basil',
    varietyName: 'Sweet Basil',
    plantedDate: new Date('2024-08-01'),
    container: '4-inch pot',
    location: 'Kitchen window',
  },
  {
    id: 'plant-3',
    name: 'Roma Tomato',
    varietyName: 'Roma Tomato',
    plantedDate: new Date('2024-07-15'),
    container: '8-inch pot',
    location: 'Balcony',
  },
];

const meta: Meta<typeof Dashboard> = {
  title: 'Pages/Dashboard',
  component: Dashboard,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="min-h-screen bg-background">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Dashboard component showing plant management overview with different states.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Loading state
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        // Simulate slow loading
        http.get('*/plants', async () => {
          await new Promise(resolve => setTimeout(resolve, 2000));
          return HttpResponse.json([]);
        }),
      ],
    },
  },
};

// Empty garden state
export const EmptyGarden: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('*/auth/user', () => {
          return HttpResponse.json(mockUser);
        }),
        http.get('*/plants', () => {
          return HttpResponse.json([]);
        }),
        http.get('*/care-activities', () => {
          return HttpResponse.json([]);
        }),
      ],
    },
  },
};

// Populated garden with few plants
export const SmallGarden: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('*/auth/user', () => {
          return HttpResponse.json(mockUser);
        }),
        http.get('*/plants', () => {
          return HttpResponse.json(mockPlants.slice(0, 2));
        }),
        http.get('*/care-activities', () => {
          return HttpResponse.json([
            {
              id: 'activity-1',
              plantId: 'plant-1',
              type: 'water',
              timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
              notes: 'Watered thoroughly',
            },
          ]);
        }),
        http.get('*/scheduled-tasks', () => {
          return HttpResponse.json([
            {
              id: 'task-1',
              plantId: 'plant-2',
              type: 'fertilize',
              dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
              priority: 'medium',
            },
          ]);
        }),
      ],
    },
  },
};

// Populated garden with multiple plants
export const LargeGarden: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('*/auth/user', () => {
          return HttpResponse.json(mockUser);
        }),
        http.get('*/plants', () => {
          return HttpResponse.json(mockPlants);
        }),
        http.get('*/care-activities', () => {
          return HttpResponse.json([
            {
              id: 'activity-1',
              plantId: 'plant-1',
              type: 'water',
              timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
              notes: 'Watered thoroughly',
            },
            {
              id: 'activity-2',
              plantId: 'plant-2',
              type: 'fertilize',
              timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
              notes: 'Applied organic fertilizer',
            },
          ]);
        }),
        http.get('*/scheduled-tasks', () => {
          return HttpResponse.json([
            {
              id: 'task-1',
              plantId: 'plant-2',
              type: 'water',
              dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000), // In 12 hours
              priority: 'high',
            },
            {
              id: 'task-2',
              plantId: 'plant-3',
              type: 'fertilize',
              dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // In 2 days
              priority: 'medium',
            },
            {
              id: 'task-3',
              plantId: 'plant-1',
              type: 'observe',
              dueDate: new Date(),
              priority: 'low',
            },
          ]);
        }),
      ],
    },
  },
};

// Garden with urgent tasks needing attention
export const GardenWithUrgentTasks: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('*/auth/user', () => {
          return HttpResponse.json(mockUser);
        }),
        http.get('*/plants', () => {
          return HttpResponse.json(mockPlants);
        }),
        http.get('*/care-activities', () => {
          return HttpResponse.json([]);
        }),
        http.get('*/scheduled-tasks', () => {
          return HttpResponse.json([
            {
              id: 'task-1',
              plantId: 'plant-1',
              type: 'water',
              dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Overdue
              priority: 'high',
            },
            {
              id: 'task-2',
              plantId: 'plant-2',
              type: 'water',
              dueDate: new Date(Date.now() - 12 * 60 * 60 * 1000), // Overdue
              priority: 'high',
            },
            {
              id: 'task-3',
              plantId: 'plant-3',
              type: 'fertilize',
              dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Very overdue
              priority: 'high',
            },
          ]);
        }),
      ],
    },
  },
};

// Error state
export const ErrorState: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('*/auth/user', () => {
          return HttpResponse.json(mockUser);
        }),
        http.get('*/plants', () => {
          return HttpResponse.error();
        }),
        http.get('*/care-activities', () => {
          return HttpResponse.error();
        }),
      ],
    },
  },
};

// No user authenticated
export const NotAuthenticated: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('*/auth/user', () => {
          return HttpResponse.json(null);
        }),
      ],
    },
  },
};