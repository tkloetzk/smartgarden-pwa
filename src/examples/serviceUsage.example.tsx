// src/examples/serviceUsage.example.tsx - Examples of how to use the new service pattern

import React, { useEffect, useState } from 'react';
import { getSchedulingService, getDynamicSchedulingService } from '@/services/serviceRegistry';
import { UpcomingTask } from '@/types';
import { Logger } from '@/utils/logger';

/**
 * Example component demonstrating proper service usage patterns
 * 
 * This shows:
 * 1. How to get service instances
 * 2. Error handling
 * 3. Loading states
 * 4. Async operations
 */
export const ServiceUsageExample: React.FC = () => {
  const [tasks, setTasks] = useState<UpcomingTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Example 1: Using the service registry to get service instances
  const loadUpcomingTasks = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get the service instance through dependency injection
      const schedulingService = getSchedulingService();
      
      // Use the service
      const upcomingTasks = await schedulingService.getUpcomingTasks();
      
      setTasks(upcomingTasks);
      Logger.info('Loaded upcoming tasks', { count: upcomingTasks.length });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      Logger.error('Failed to load upcoming tasks', err);
    } finally {
      setLoading(false);
    }
  };

  // Example 2: Recording task completion with proper error handling
  const recordTaskCompletion = async (plantId: string, taskType: string) => {
    try {
      const dynamicService = getDynamicSchedulingService();
      
      const now = new Date();
      await dynamicService.recordTaskCompletion(
        plantId,
        taskType as any, // In real code, use proper types
        now, // scheduled date
        now, // actual completion date
        'example-activity-id',
        'vegetative'
      );
      
      Logger.info('Task completion recorded', { plantId, taskType });
      
      // Reload tasks to show updated state
      await loadUpcomingTasks();
    } catch (err) {
      Logger.error('Failed to record task completion', err);
      setError('Failed to record task completion');
    }
  };

  // Load tasks on component mount
  useEffect(() => {
    loadUpcomingTasks();
  }, []);

  if (loading && tasks.length === 0) {
    return <div>Loading tasks...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Service Usage Example</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}
      
      <div className="mb-4">
        <button
          onClick={loadUpcomingTasks}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh Tasks'}
        </button>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Upcoming Tasks ({tasks.length})</h3>
        {tasks.length === 0 ? (
          <p className="text-gray-500">No upcoming tasks</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id} className="border p-3 rounded">
                <div className="flex justify-between items-center">
                  <div>
                    <strong>{task.plantName}</strong> - {task.task}
                    <div className="text-sm text-gray-600">
                      Due: {task.dueIn} | Priority: {task.priority}
                    </div>
                  </div>
                  <button
                    onClick={() => recordTaskCompletion(task.plantId, task.type)}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                  >
                    Complete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

/**
 * Example hook demonstrating service usage in custom hooks
 */
export const useTaskManagement = () => {
  const [tasks, setTasks] = useState<UpcomingTask[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTasks = async (plantId?: string) => {
    setLoading(true);
    try {
      const schedulingService = getSchedulingService();
      const tasks = await schedulingService.getUpcomingTasks(plantId);
      setTasks(tasks);
    } catch (error) {
      Logger.error('Failed to load tasks', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const completeTask = async (
    plantId: string,
    taskType: string,
    scheduledDate: Date,
    actualDate: Date = new Date()
  ) => {
    try {
      const dynamicService = getDynamicSchedulingService();
      await dynamicService.recordTaskCompletion(
        plantId,
        taskType as any,
        scheduledDate,
        actualDate,
        'hook-activity-id',
        'vegetative'
      );
      
      // Reload tasks after completion
      await loadTasks();
    } catch (error) {
      Logger.error('Failed to complete task', error);
      throw error;
    }
  };

  return {
    tasks,
    loading,
    loadTasks,
    completeTask,
  };
};

/**
 * Example service wrapper for backwards compatibility
 * This shows how to wrap the new services to maintain existing API
 */
export class LegacyTaskHelper {
  static async getTasksForPlant(plantId: string): Promise<UpcomingTask[]> {
    try {
      const schedulingService = getSchedulingService();
      return await schedulingService.getTasksForPlant(plantId);
    } catch (error) {
      Logger.error('Legacy task helper failed', error);
      return [];
    }
  }

  static async getAllTasks(): Promise<UpcomingTask[]> {
    try {
      const schedulingService = getSchedulingService();
      return await schedulingService.getUpcomingTasks();
    } catch (error) {
      Logger.error('Legacy task helper failed', error);
      return [];
    }
  }
}