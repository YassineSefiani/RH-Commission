import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ConstraintsProvider } from './context/ConstraintsContext';
import { HistoryProvider } from './context/HistoryContext';

export default function App() {
  return (
    <ConstraintsProvider>
      <HistoryProvider>
        <RouterProvider router={router} />
      </HistoryProvider>
    </ConstraintsProvider>
  );
}