// src/pages/catch-up/index.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { FirebaseCareSchedulingService } from "@/services/firebaseCareSchedulingService";
import { FirebaseCareActivityService } from "@/services/firebase/careActivityService";
import { ArrowLeft } from "lucide-react";
import { UpcomingTask } from "@/types";

export const CatchUpPage = () => {
  const navigate = useNavigate();
  const { plants, loading } = useFirebasePlants();
  const { user } = useFirebaseAuth();
  const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  // Load upcoming tasks
  useEffect(() => {
    const loadTasks = async () => {
      if (!plants || !user?.uid) {
        setTasksLoading(false);
        return;
      }

      try {
        const getLastActivityByType = async (plantId: string, type: any) => {
          return FirebaseCareActivityService.getLastActivityByType(plantId, user.uid, type);
        };
        
        const tasks = await FirebaseCareSchedulingService.getUpcomingTasks(
          plants,
          getLastActivityByType
        );
        
        setUpcomingTasks(tasks);
      } catch (error) {
        console.error("Failed to load tasks:", error);
      } finally {
        setTasksLoading(false);
      }
    };

    loadTasks();
  }, [plants, user?.uid]);

  if (loading || tasksLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" onClick={() => navigate("/")} size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-foreground">
              Catch-Up Tasks
            </h1>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/")} size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Catch-Up Tasks
            </h1>
            <p className="text-muted-foreground">
              Review and handle missed care activities for your plants
            </p>
          </div>
        </div>

        {upcomingTasks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground">
                Your plants are well taken care of. No immediate actions needed.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Found {upcomingTasks.length} task{upcomingTasks.length !== 1 ? 's' : ''} requiring attention
            </p>
            
            {upcomingTasks.map((task) => (
              <Card key={task.id} className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg text-foreground">{task.plantName}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${{
                          'overdue': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
                          'high': 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
                          'medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
                          'low': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                        }[task.priority]}`}>
                          {task.priority}
                        </span>
                      </div>
                      
                      <p className="text-muted-foreground mb-2">
                        <strong className="text-foreground">{task.task}</strong> - {task.dueIn}
                      </p>
                      
                      <div className="text-sm text-muted-foreground">
                        Growth Stage: <span className="text-foreground">{task.plantStage}</span> | Category: <span className="text-foreground">{task.category}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        onClick={() => navigate(`/log-care/${task.plantId}`)}
                        size="sm"
                      >
                        Log Care
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/plants/${task.plantId}`)}
                        size="sm"
                      >
                        View Plant
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CatchUpPage;
