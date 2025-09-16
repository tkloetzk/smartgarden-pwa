// Example of using the new organized hooks structure
import React from 'react';

// Option 1: Import hooks from their organized directories
// import { useFirebaseAuth } from '@/hooks/auth';
// import { useFirebasePlants } from '@/hooks/plants';
// import { useFirebaseCareActivities } from '@/hooks/care';
// import { useAllUpcomingTasks } from '@/hooks/dashboard';
// import { useDarkMode } from '@/hooks/ui';

// Option 2: Import multiple hooks from the same category
// import { 
//   useFirebaseAuth, 
//   useFirstTimeUser 
// } from '@/hooks/auth';

// import { 
//   useFirebasePlants, 
//   useFirebasePlant, 
//   useDynamicStage 
// } from '@/hooks/plants';

// Option 3: Import everything from the main hooks index (recommended)
import { 
  useFirebaseAuth,
  useFirebasePlants,
  useDarkMode
} from '@/hooks';

export const ExampleComponent: React.FC = () => {
  const { user, loading } = useFirebaseAuth();
  const { plants } = useFirebasePlants();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  
  return (
    <div>
      <h1>Example Component Using Organized Hooks</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <p>User: {user?.email}</p>
          <p>Plants count: {plants?.length}</p>
          <button onClick={toggleDarkMode}>
            Toggle {isDarkMode ? 'Light' : 'Dark'} Mode
          </button>
        </div>
      )}
    </div>
  );
};
