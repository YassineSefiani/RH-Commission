import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ConstraintsProvider } from './context/ConstraintsContext';
import { HistoryProvider } from './context/HistoryContext';
import { PersonnelProvider } from './context/PersonnelContext';
import { PresenceProvider } from './context/PresenceContext';
import { UserProvider } from './context/UserContext';
import { ThemeProvider } from './context/ThemeContext';
import { LangProvider } from './context/LangContext';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
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
      </LangProvider>
      <Toaster />
    </ThemeProvider>
  );
}