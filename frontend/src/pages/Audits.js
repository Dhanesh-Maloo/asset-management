import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { cachedGet } from '../lib/cache';
import { toast } from 'sonner';
import { ClipboardCheck, Plus, MapPin, Trash2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Audits = () => {
  const navigate = useNavigate();
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [locationOptions, setLocationOptions] = useState([]);
  const [creating, setCreating] = useState(false);

  const fetchAudits = async () => {
    try {
      const res = await axios.get(`${API}/audits`);
      setAudits(res.data);
    } catch {
      toast.error('Failed to load stock-takes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
    cachedGet(axios, `${API}/locations`, {}, 120000)
      .then((res) => setLocationOptions(res.data.map((l) => l.name).filter(Boolean)))
      .catch(() => { /* locations are only a suggestion list */ });
  }, []);

  const handleCreate = async () => {
    if (!name.trim() || !location.trim()) {
      toast.error('Enter a name and the location to check');
      return;
    }
    setCreating(true);
    try {
      const res = await axios.post(`${API}/audits`, { name: name.trim(), location: location.trim() });
      toast.success(`Stock-take started: ${res.data.expected_count} asset(s) expected`);
      setCreateOpen(false);
      setName('');
      setLocation('');
      navigate(`/audits/${res.data.id}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Could not start the stock-take');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e, audit) => {
    e.stopPropagation();
    if (!window.confirm(`Delete the stock-take "${audit.name}"?`)) return;
    try {
      await axios.delete(`${API}/audits/${audit.id}`);
      setAudits((list) => list.filter((a) => a.id !== audit.id));
    } catch {
      toast.error('Could not delete the stock-take');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto animate-fade-in" data-testid="audits-page">
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-1">Stock-take</h1>
            <p className="text-sm text-muted-foreground">Scan the assets in a place and see what is missing or out of place</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} data-testid="new-audit-btn">
            <Plus className="h-4 w-4 mr-2" />
            New stock-take
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-20 shimmer rounded-lg" />)}
          </div>
        ) : audits.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium mb-1">No stock-takes yet</p>
              <p className="text-sm text-muted-foreground">Start one for a room, floor or office to check what is really there.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {audits.map((a) => {
              const done = a.found_count;
              const pct = a.expected_count ? Math.round((done / a.expected_count) * 100) : 0;
              return (
                <Card
                  key={a.id}
                  className="cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => navigate(`/audits/${a.id}`)}
                  data-testid={`audit-row-${a.id}`}
                >
                  <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{a.name}</span>
                        <Badge variant={a.status === 'open' ? 'default' : 'secondary'}>{a.status === 'open' ? 'In progress' : 'Completed'}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {a.location}
                        <span className="mx-1">·</span>
                        {new Date(a.created_at).toLocaleDateString()}
                        {a.created_by_name && <> · {a.created_by_name}</>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-emerald-600 dark:text-emerald-400">{a.found_count} found</span>
                      <span className={a.missing_count ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}>{a.missing_count} missing</span>
                      <span className={a.unexpected_count ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}>{a.unexpected_count} extra</span>
                      <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => handleDelete(e, a)} aria-label="Delete stock-take">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent data-testid="create-audit-dialog">
          <DialogHeader>
            <DialogTitle>New stock-take</DialogTitle>
            <DialogDescription>
              The assets the system places at this location become the checklist. Scan what you find there.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Q4 office check" data-testid="audit-name" />
            </div>
            <div>
              <Label>Location to check</Label>
              <Input
                list="audit-locations"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Mumbai Office"
                data-testid="audit-location"
              />
              <datalist id="audit-locations">
                {locationOptions.map((n) => <option key={n} value={n} />)}
              </datalist>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating} data-testid="confirm-create-audit">
              {creating ? 'Starting…' : 'Start stock-take'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Audits;
