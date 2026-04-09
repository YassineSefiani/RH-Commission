import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ConstraintsProvider } from './context/ConstraintsContext';
import { HistoryProvider } from './context/HistoryContext';
import { PersonnelProvider } from './context/PersonnelContext';

export default function App() {
  return (
    <ConstraintsProvider>
      <HistoryProvider>
        <PersonnelProvider>
          <RouterProvider router={router} />
        </PersonnelProvider>
      </HistoryProvider>
    </ConstraintsProvider>
  );
}