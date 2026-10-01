import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { Delete, Edit, Add } from '@mui/icons-material';
import { toast } from 'sonner';

export default function AdminUsersTab({ token }: { token: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5001"}/api/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (e) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    const url = isCreating ? `${import.meta.env.VITE_API_URL || "http://localhost:5001"}/api/admin/users` : `${import.meta.env.VITE_API_URL || "http://localhost:5001"}/api/admin/users/${editingUser._id}`;
    const method = isCreating ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success(isCreating ? 'User created' : 'User updated');
        setEditingUser(null);
        setIsCreating(false);
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save user');
      }
    } catch (e) {
      toast.error('Network error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5001"}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('User deleted');
        fetchUsers();
      } else {
        toast.error('Failed to delete user');
      }
    } catch (e) {
      toast.error('Network error');
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="primary.main">
          User Management
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setIsCreating(true)}>
          Create Sub-Account
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8f9fa' }}>
            <TableRow>
              <TableCell><b>Username</b></TableCell>
              <TableCell><b>Role</b></TableCell>
              <TableCell><b>Created</b></TableCell>
              <TableCell align="center"><b>Actions</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}>Loading...</TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}>No users found.</TableCell></TableRow>
            ) : (
              users.map(u => (
                <TableRow key={u._id}>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="center">
                    <IconButton color="info" onClick={() => { setEditingUser(u); setIsCreating(false); }}><Edit /></IconButton>
                    <IconButton color="error" onClick={() => handleDelete(u._id)} disabled={u.role === 'SUPERADMIN'}><Delete /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={isCreating || Boolean(editingUser)} onClose={() => { setIsCreating(false); setEditingUser(null); }} maxWidth="sm" fullWidth>
        <form onSubmit={handleSave}>
          <DialogTitle sx={{ bgcolor: '#f8f9fa', fontWeight: 'bold' }}>
            {isCreating ? 'Create User' : 'Edit User'}
          </DialogTitle>
          <DialogContent dividers>
            <TextField fullWidth margin="normal" label="Username" name="username" required defaultValue={editingUser?.username || ''} />
            <TextField fullWidth margin="normal" label="Password" name="password" type="password" required={isCreating} helperText={!isCreating && 'Leave blank to keep current password'} />
            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select name="role" defaultValue={editingUser?.role || 'VIEWER'} label="Role">
                <MenuItem value="VIEWER">VIEWER (Read Only)</MenuItem>
                <MenuItem value="SUPERADMIN">SUPERADMIN (Full Access)</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa' }}>
            <Button onClick={() => { setIsCreating(false); setEditingUser(null); }}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
