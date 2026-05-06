import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ConstraintsProvider } from './context/ConstraintsContext';
import { HistoryProvider } from './context/HistoryContext';
import { PersonnelProvider } from './context/PersonnelContext';
import { PresenceProvider } from './context/PresenceContext';
import { UserProvider } from './context/UserContext';

export default function App() {
  return (
    <UserProvider>
      <ConstraintsProvider>
        <HistoryProvider>
          <PersonnelProvider>
            <PresenceProvider>
              <RouterProvider router={router} />
            </PresenceProvider>
          </PersonnelProvider>
        </HistoryProvider>
      </ConstraintsProvider>
    </UserProvider>
  );
}