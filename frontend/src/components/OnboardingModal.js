import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { Package, Laptop, Users, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

const STEPS = [
  {
    icon: Package,
    color: 'bg-blue-100 text-blue-600',
    title: 'Add a Product',
    description: 'Start by adding products to your catalog — laptops, monitors, accessories, etc.',
    href: '/products',
    key: 'product',
  },
  {
    icon: Laptop,
    color: 'bg-green-100 text-green-600',
    title: 'Add an Asset',
    description: 'Onboard a physical asset and assign it to an employee or location.',
    href: '/assets',
    key: 'asset',
  },
  {
    icon: Users,
    color: 'bg-purple-100 text-purple-600',
    title: 'Invite a User',
    description: 'Invite your team members so they can request orders and raise tickets.',
    href: '/users',
    key: 'user',
  },
];

const STORAGE_KEY = 'onboarding_dismissed';
const COMPLETED_KEY = 'onboarding_steps';

const OnboardingModal = () => {
  const [open, setOpen] = useState(false);
  const [completed, setCompleted] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      const timer = setTimeout(() => setOpen(true), 1200);
      return () => clearTimeout(timer);
    }
    const saved = localStorage.getItem(COMPLETED_KEY);
    if (saved) {
      try { setCompleted(JSON.parse(saved)); } catch {}
    }
  }, []);

  const markDone = (key) => {
    const updated = { ...completed, [key]: true };
    setCompleted(updated);
    localStorage.setItem(COMPLETED_KEY, JSON.stringify(updated));
  };

  const handleGo = (step) => {
    markDone(step.key);
    setOpen(false);
    navigate(step.href);
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
  };

  const allDone = STEPS.every(s => completed[s.key]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle className="text-xl">Welcome to IT Assets!</DialogTitle>
          </div>
          <DialogDescription>
            Let's get you set up in 3 quick steps. You can always come back to this later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const done = completed[step.key];
            return (
              <div
                key={step.key}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${done ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-white border-slate-200 hover:border-primary/40 hover:shadow-sm'}`}
              >
                <div className={`p-2.5 rounded-lg flex-shrink-0 ${step.color}`}>
                  {done ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <Icon className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${done ? 'line-through text-slate-400' : 'text-slate-800'}`}>{step.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                </div>
                {!done && (
                  <Button size="sm" variant="outline" className="flex-shrink-0" onClick={() => handleGo(step)}>
                    Go <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {allDone ? (
            <Button className="w-full" onClick={handleDismiss}>
              <CheckCircle2 className="h-4 w-4 mr-2" /> All Done — Close
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={handleDismiss} className="text-muted-foreground text-sm">
                Skip for now
              </Button>
              <p className="text-xs text-muted-foreground text-center sm:text-right flex-1">
                {STEPS.filter(s => completed[s.key]).length} of {STEPS.length} steps complete
              </p>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
