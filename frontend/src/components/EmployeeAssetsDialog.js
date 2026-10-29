import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const fmt = (d) => (d ? new Date(d).toLocaleDateString() : '—');

const ENDED_LABEL = {
  returned: 'Returned',
  retrieved: 'Retrieved',
  assigned: 'Reassigned',
  checked_out: 'Checked out by another',
  transferred: 'Transferred',
};

const AssetLink = ({ asset }) => (
  <Link to={`/assets/${asset.id}`} className="font-medium text-primary hover:underline">
    {asset.asset_tag}
  </Link>
);

export const EmployeeAssetsDialog = ({ employee, onClose }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!employee) return undefined;
    let cancelled = false;
    setData(null);
    setError(false);
    axios
      .get(`${API}/users/${employee.id}/assets`)
      .then((res) => !cancelled && setData(res.data))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [employee]);

  return (
    <Dialog open={!!employee} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" data-testid="employee-assets-dialog">
        <DialogHeader>
          <DialogTitle>Assets of {employee?.name}</DialogTitle>
          <DialogDescription>
            {employee?.employee_id ? `${employee.employee_id} · ` : ''}
            {employee?.email}
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">Failed to load assets.</p>}
        {!data && !error && <div className="h-24 shimmer rounded-md" />}

        {data && (
          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-semibold mb-2">Currently holding ({data.current.length})</h3>
              {data.current.length === 0 ? (
                <p className="text-sm text-muted-foreground">No assets assigned right now.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset tag</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Serial</TableHead>
                      <TableHead>Since</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.current.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell><AssetLink asset={a} /></TableCell>
                        <TableCell>{a.product_name || '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{a.serial_number || '—'}</TableCell>
                        <TableCell>{fmt(a.status === 'checked_out' ? a.checkout_date : a.assigned_date)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{a.status.replace(/_/g, ' ')}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </section>

            <section>
              <h3 className="text-sm font-semibold mb-2">Previously held ({data.past.length})</h3>
              {data.past.length === 0 ? (
                <p className="text-sm text-muted-foreground">No past assignments recorded.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset tag</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead>Released</TableHead>
                      <TableHead>How</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.past.map((r, i) => (
                      <TableRow key={`${r.asset.id}-${i}`}>
                        <TableCell><AssetLink asset={r.asset} /></TableCell>
                        <TableCell>{r.asset.product_name || '—'}</TableCell>
                        <TableCell>{fmt(r.assigned_on)}</TableCell>
                        <TableCell>{fmt(r.released_on)}</TableCell>
                        <TableCell className="text-muted-foreground">{ENDED_LABEL[r.ended_by] || r.ended_by}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
