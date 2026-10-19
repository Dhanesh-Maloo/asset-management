import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Ticket as TicketIcon, Plus, Trash2, MessageSquare, Send, X, CheckSquare, Square } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Tickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [allTickets, setAllTickets] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [linkedAsset, setLinkedAsset] = useState(null); // { id, tag } when the ticket is raised from an asset page
  const [cannedReplies, setCannedReplies] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'general'
  });

  const [updateData, setUpdateData] = useState({
    status: '',
    assigned_to: ''
  });

  useEffect(() => {
    fetchTickets();
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Opened from an asset page ("Report Issue"): link that asset and open the form
  useEffect(() => {
    const assetId = searchParams.get('asset');
    if (!assetId) return;
    axios.get(`${API}/assets/${assetId}`).then((res) => {
      setLinkedAsset({ id: res.data.id, tag: res.data.asset_tag });
      setFormData({ title: `Issue with ${res.data.asset_tag}`, description: '', priority: 'medium', category: 'hardware' });
      setCreateDialogOpen(true);
    }).catch(() => toast.error('Could not load that asset'));
    setSearchParams({}, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (statusFilter === 'all') {
      setTickets(allTickets);
    } else {
      setTickets(allTickets.filter(t => t.status === statusFilter));
    }
    setSelectedIds([]);
  }, [statusFilter, allTickets]);

  const fetchTickets = async () => {
    try {
      const ticketsRes = await axios.get(`${API}/tickets`);
      setAllTickets(ticketsRes.data);
      setTickets(ticketsRes.data);
    } catch (error) {
      console.error('Failed to fetch tickets', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (user.role === 'employee') return;
    try {
      const usersRes = await axios.get(`${API}/users`);
      const usersMap = {};
      usersRes.data.forEach(u => usersMap[u.id] = u);
      setUsers(usersMap);
    } catch (error) {
      // Users endpoint may not be accessible for all roles
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/tickets`, linkedAsset ? { ...formData, asset_id: linkedAsset.id } : formData);
      toast.success('Ticket created successfully');
      setCreateDialogOpen(false);
      setLinkedAsset(null);
      setFormData({ title: '', description: '', priority: 'medium', category: 'general' });
      fetchTickets();
    } catch (error) {
      toast.error('Failed to create ticket');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/tickets/${ticketToDelete.id}`);
      toast.success('Ticket deleted successfully');
      setDeleteDialogOpen(false);
      setTicketToDelete(null);
      fetchTickets();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete ticket');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await axios.post(`${API}/tickets/bulk-delete`, { ticket_ids: selectedIds });
      toast.success(`${selectedIds.length} ticket(s) deleted`);
      setBulkDeleteDialogOpen(false);
      setSelectedIds([]);
      fetchTickets();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to bulk delete tickets');
    }
  };

  const handleUpdate = async () => {
    try {
      const payload = {};
      if (updateData.status) payload.status = updateData.status;
      if (updateData.assigned_to) payload.assigned_to = updateData.assigned_to;

      await axios.patch(`${API}/tickets/${selectedTicket.id}`, payload);
      toast.success('Ticket updated successfully');
      setUpdateDialogOpen(false);
      setUpdateData({ status: '', assigned_to: '' });
      fetchTickets();
    } catch (error) {
      toast.error('Failed to update ticket');
    }
  };

  const getPriorityBadge = (priority) => {
    const config = {
      low: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
      medium: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
      high: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
      critical: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
    };
    return <Badge className={config[priority]}>{priority.toUpperCase()}</Badge>;
  };

  const getStatusBadge = (status) => {
    const config = {
      open: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
      in_progress: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
      resolved: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
      closed: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
    };
    return <Badge className={config[status]}>{status.replace('_', ' ').toUpperCase()}</Badge>;
  };

  // SLA: time left for open tickets, met/missed for finished ones
  const renderSla = (ticket) => {
    if (!ticket.sla_due_at) return <span className="text-muted-foreground">-</span>;
    const due = new Date(ticket.sla_due_at).getTime();
    if (['resolved', 'closed'].includes(ticket.status)) {
      const done = ticket.resolved_at ? new Date(ticket.resolved_at).getTime() : Date.now();
      return done <= due
        ? <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">Met</Badge>
        : <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">Missed</Badge>;
    }
    const mins = Math.round((due - Date.now()) / 60000);
    const fmt = (m) => { const a = Math.abs(m); return a >= 1440 ? `${Math.floor(a / 1440)}d ${Math.floor((a % 1440) / 60)}h` : a >= 60 ? `${Math.floor(a / 60)}h ${a % 60}m` : `${a}m`; };
    if (mins < 0) return <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20" data-testid="sla-breached">Breached {fmt(mins)} ago</Badge>;
    if (mins < 120) return <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">Due in {fmt(mins)}</Badge>;
    return <span className="text-sm text-muted-foreground">Due in {fmt(mins)}</span>;
  };

  const canManage = ['super_admin', 'tenant_admin', 'asset_manager', 'helpdesk_agent'].includes(user?.role);

  const toggleSelect = (id) => setSelectedIds(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );
  const toggleAll = () => setSelectedIds(prev =>
    prev.length === tickets.length ? [] : tickets.map(t => t.id)
  );

  // ── Comments State ───────────────────────────────────────────────────────
  const [commentTicket, setCommentTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentSending, setCommentSending] = useState(false);
  const commentsEndRef = useRef(null);

  const openComments = async (ticket) => {
    setCommentTicket(ticket);
    setCommentsLoading(true);
    if (canManage) {
      axios.get(`${API}/canned-replies`).then((r) => setCannedReplies(r.data)).catch(() => {});
    }
    try {
      const res = await axios.get(`${API}/tickets/${ticket.id}/comments`);
      setComments(res.data);
    } catch { toast.error('Failed to load comments'); }
    finally { setCommentsLoading(false); }
  };

  const sendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setCommentSending(true);
    try {
      const res = await axios.post(`${API}/tickets/${commentTicket.id}/comments`, { content: newComment.trim() });
      setComments(prev => [...prev, res.data]);
      setNewComment('');
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to send comment'); }
    finally { setCommentSending(false); }
  };

  const saveCannedReply = async () => {
    const content = newComment.trim();
    if (!content) { toast.error('Type the reply text first, then save it'); return; }
    const title = window.prompt('Name for this saved reply:');
    if (!title || !title.trim()) return;
    try {
      const res = await axios.post(`${API}/canned-replies`, { title: title.trim(), content });
      setCannedReplies((prev) => [...prev, res.data]);
      toast.success('Reply saved');
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to save reply'); }
  };

  const deleteCannedReply = async (reply) => {
    if (!window.confirm(`Delete saved reply "${reply.title}"?`)) return;
    try {
      await axios.delete(`${API}/canned-replies/${reply.id}`);
      setCannedReplies((prev) => prev.filter((r) => r.id !== reply.id));
    } catch { toast.error('Failed to delete reply'); }
  };

  const deleteComment = async (commentId) => {
    try {
      await axios.delete(`${API}/tickets/${commentTicket.id}/comments/${commentId}`);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch { toast.error('Failed to delete comment'); }
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in" data-testid="tickets-page">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-1">
              Helpdesk Tickets
            </h1>
            <p className="text-sm text-muted-foreground">
              Submit and track IT support requests
            </p>
          </div>
          <Button onClick={() => { setLinkedAsset(null); setFormData({ title: '', description: '', priority: 'medium', category: 'general' }); setCreateDialogOpen(true); }} data-testid="create-ticket-btn">
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle>All Tickets</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 h-9">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                {/* Bulk Delete */}
                {canManage && selectedIds.length > 0 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setBulkDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete ({selectedIds.length})
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 shimmer rounded-md"></div>
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12">
                <TicketIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {statusFilter !== 'all' ? `No ${statusFilter.replace('_', ' ')} tickets found` : 'No tickets found'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {canManage && (
                        <TableHead className="w-10">
                          <button onClick={toggleAll} className="text-slate-400 hover:text-primary">
                            {selectedIds.length === tickets.length && tickets.length > 0
                              ? <CheckSquare className="h-4 w-4 text-primary" />
                              : <Square className="h-4 w-4" />}
                          </button>
                        </TableHead>
                      )}
                      <TableHead>Ticket #</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Asset</TableHead>
                      <TableHead>SLA</TableHead>
                      {canManage && <TableHead>Assigned To</TableHead>}
                      {canManage && <TableHead>Created By</TableHead>}
                      <TableHead>Date</TableHead>
                      {canManage && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket) => (
                      <TableRow
                        key={ticket.id}
                        data-testid={`ticket-row-${ticket.id}`}
                        className={selectedIds.includes(ticket.id) ? 'bg-primary/5' : ''}
                      >
                        {canManage && (
                          <TableCell>
                            <button onClick={() => toggleSelect(ticket.id)} className="text-slate-400 hover:text-primary">
                              {selectedIds.includes(ticket.id)
                                ? <CheckSquare className="h-4 w-4 text-primary" />
                                : <Square className="h-4 w-4" />}
                            </button>
                          </TableCell>
                        )}
                        <TableCell className="font-mono font-semibold text-primary">
                          {ticket.ticket_number}
                        </TableCell>
                        <TableCell className="font-medium">{ticket.title}</TableCell>
                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                        <TableCell className="capitalize">{ticket.category}</TableCell>
                        <TableCell className="font-mono text-xs">{ticket.asset_tag || <span className="text-muted-foreground">-</span>}</TableCell>
                        <TableCell>{renderSla(ticket)}</TableCell>
                        {canManage && (
                          <TableCell>
                            {ticket.assigned_to ? (
                              <span className="font-medium">{users[ticket.assigned_to]?.name || 'Unknown'}</span>
                            ) : (
                              <span className="text-muted-foreground italic">Unassigned</span>
                            )}
                          </TableCell>
                        )}
                        {canManage && (
                          <TableCell>{users[ticket.created_by]?.name || 'Unknown'}</TableCell>
                        )}
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </TableCell>
                        {canManage && (
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openComments(ticket)}
                                title="View comments"
                              >
                                <MessageSquare className="h-3.5 w-3.5 mr-1" /> Comments
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedTicket(ticket);
                                  setUpdateData({ status: ticket.status, assigned_to: ticket.assigned_to || '' });
                                  setUpdateDialogOpen(true);
                                }}
                                data-testid={`update-ticket-btn-${ticket.id}`}
                              >
                                Update
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setTicketToDelete(ticket);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Ticket Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(o) => { setCreateDialogOpen(o); if (!o) setLinkedAsset(null); }}>
        <DialogContent className="max-w-md" data-testid="create-ticket-dialog">
          <DialogHeader>
            <DialogTitle>Create New Ticket</DialogTitle>
            <DialogDescription>Submit a new IT support request</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {linkedAsset && (
              <p className="text-sm rounded-md bg-primary/10 text-primary px-3 py-2" data-testid="linked-asset-note">
                Linked asset: <strong className="font-mono">{linkedAsset.tag}</strong>
              </p>
            )}
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                maxLength={200}
                data-testid="ticket-title-input"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                maxLength={2000}
                data-testid="ticket-description-input"
              />
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(val) => setFormData({ ...formData, priority: val })}>
                <SelectTrigger data-testid="ticket-priority-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                data-testid="ticket-category-input"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button type="submit" data-testid="submit-ticket-btn">Create Ticket</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update Ticket Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent data-testid="update-ticket-dialog">
          <DialogHeader>
            <DialogTitle>Update Ticket</DialogTitle>
            <DialogDescription>Update ticket status or assignment</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Status</Label>
              <Select value={updateData.status} onValueChange={(val) => setUpdateData({ ...updateData, status: val })}>
                <SelectTrigger data-testid="update-status-select">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assign To</Label>
              <div className="flex gap-2 items-center mt-1">
                <Select value={updateData.assigned_to} onValueChange={(val) => setUpdateData({ ...updateData, assigned_to: val })}>
                  <SelectTrigger data-testid="update-assign-select" className="flex-1">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— Unassigned —</SelectItem>
                    {Object.values(users).map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name} ({u.role?.replace('_', ' ')})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setUpdateData({ ...updateData, assigned_to: user?.id || '' })}
                  title="Assign to me"
                >
                  Me
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} data-testid="confirm-update-ticket-btn">Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Ticket</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete ticket <strong>{ticketToDelete?.ticket_number}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Delete Tickets</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedIds.length}</strong> ticket(s)? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleBulkDelete}>Delete All Selected</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comments Drawer */}
      {commentTicket && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setCommentTicket(null)} />
          <div className="relative bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <h3 className="font-semibold text-lg">Comments</h3>
                <p className="text-xs text-slate-500">{commentTicket.ticket_number} — {commentTicket.title}</p>
              </div>
              <button onClick={() => setCommentTicket(null)} className="p-2 hover:bg-muted rounded-full">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {commentsLoading ? (
                <div className="text-center py-10 text-slate-400 text-sm">Loading...</div>
              ) : comments.length === 0 ? (
                <div className="text-center py-10">
                  <MessageSquare className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-400 text-sm">No comments yet. Be the first!</p>
                </div>
              ) : (
                comments.map(c => (
                  <div key={c.id} className={`flex gap-3 ${c.author_id === user?.id ? 'flex-row-reverse' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                      {(c.author_name || 'U')[0].toUpperCase()}
                    </div>
                    <div className={`max-w-[75%] ${c.author_id === user?.id ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`px-3 py-2 rounded-2xl text-sm ${c.author_id === user?.id ? 'bg-primary text-white rounded-tr-sm' : 'bg-muted text-slate-800 rounded-tl-sm'}`}>
                        {c.content}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400">{c.author_name}</span>
                        <span className="text-xs text-slate-300">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {(c.author_id === user?.id || ['super_admin', 'tenant_admin'].includes(user?.role)) && (
                          <button onClick={() => deleteComment(c.id)} className="text-xs text-slate-300 hover:text-red-400 transition-colors">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={commentsEndRef} />
            </div>

            {canManage && (
              <div className="px-4 pt-3 border-t flex flex-wrap gap-1.5 items-center" data-testid="canned-replies">
                {cannedReplies.map((r) => (
                  <span key={r.id} className="inline-flex items-center rounded-full border border-slate-300 text-xs text-slate-700">
                    <button type="button" className="pl-2.5 pr-1 py-0.5 hover:text-primary" title={r.content} onClick={() => setNewComment(r.content)}>{r.title}</button>
                    <button type="button" className="pr-2 py-0.5 text-slate-400 hover:text-red-500" aria-label={`Delete ${r.title}`} onClick={() => deleteCannedReply(r)}>&times;</button>
                  </span>
                ))}
                <button type="button" onClick={saveCannedReply} className="text-xs text-primary hover:underline">+ Save text as reply</button>
              </div>
            )}
            <form onSubmit={sendComment} className="p-4 border-t flex gap-3">
              <input
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 border border-slate-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button type="submit" disabled={commentSending || !newComment.trim()}
                className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 flex-shrink-0">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Tickets;
