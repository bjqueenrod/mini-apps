import { createBrowserRouter } from 'react-router-dom';
import { BrowsePage } from '../pages/BrowsePage';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { TasksPage } from '../pages/TasksPage';

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/clips', element: <BrowsePage /> },
  { path: '/clips/:clipId', element: <BrowsePage /> },
  { path: '/tasks', element: <TasksPage /> },
  { path: '/tasks/:tierId', element: <TasksPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
