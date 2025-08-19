
import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/router';
import { useAppDispatch } from './store';
import { getCurrentUser } from './features/auth/authSlice';
import './App.css';

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Try to authenticate user with stored token on app load
    if (localStorage.getItem('token')) {
      dispatch(getCurrentUser());
    }
  }, [dispatch]);

  return <RouterProvider router={router} />;
}

export default App;
