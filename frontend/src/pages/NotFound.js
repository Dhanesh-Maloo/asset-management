import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { FileQuestion } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <FileQuestion className="h-16 w-16 text-slate-300 mb-6" />
      <h1 className="text-6xl font-bold font-heading text-slate-800 mb-2">404</h1>
      <p className="text-xl font-medium text-slate-600 mb-2">Page not found</p>
      <p className="text-sm text-slate-400 mb-8 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
        <Button onClick={() => navigate('/dashboard')}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
