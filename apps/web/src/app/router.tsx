import { createBrowserRouter } from 'react-router-dom';
import { BrowsePage } from '../pages/BrowsePage';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { KeyholdingPage } from '../pages/KeyholdingPage';
import { PaymentReturnPage } from '../pages/PaymentReturnPage';
import { TasksPage } from '../pages/TasksPage';

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/payment/return', element: <PaymentReturnPage /> },
  { path: '/clips', element: <BrowsePage /> },
  { path: '/clips/:clipId', element: <BrowsePage /> },
  { path: '/tasks', element: <TasksPage /> },
  { path: '/tasks/:tierId', element: <TasksPage /> },
  { path: '/keyholding', element: <KeyholdingPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
