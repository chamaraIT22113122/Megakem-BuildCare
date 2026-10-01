import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, AppBar, Toolbar, Grid,
  Tabs, Tab, TextField, MenuItem, Select, FormControl, InputLabel, Switch, FormControlLabel,
  Card, CardContent, Divider
} from '@mui/material';
import { 
  Refresh, CheckCircle, Cancel, Visibility, ArrowBack, Add, Edit, Delete, 
  TrendingUp, ShoppingCart, Assignment, Inventory
} from '@mui/icons-material';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import Login from './Login';
import AdminUsersTab from './AdminUsersTab';
import AdminMailTab from './AdminMailTab';

interface OrderItem {
  _id: string;
  productId: string;
  name: string;
  quantity: number;
  packSize: string;
  color: string;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  _id: string;
  employeeName: string;
  employeeId: string;
  company: string;
  department: string;
  managerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface Product {
  _id?: string;
  name: string;
  productNo: string;
  description: string;
  category: string;
  price: number;
  isActive: boolean;
  showInCatalog: boolean;
}

export default function AdminDashboard() {
  const [tab, setTab] = useState(0);
  
  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [role, setRole] = useState(localStorage.getItem('role') || '');

  const handleLogin = (newToken: string, newRole: string) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', newRole);
    setToken(newToken);
    setRole(newRole);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken('');
    setRole('');
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      toast.error('Failed to fetch orders');
    }
  };

  const loadData = async () => {
    setLoading(true);
    await fetchOrders();
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Orders Logic ---

  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this order entirely?')) return;
    try {
      const res = await fetch(`http://localhost:5001/api/orders/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Order deleted');
        fetchOrders();
      } else {
        toast.error('Failed to delete order');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const handleSaveOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingOrder) return;
    const formData = new FormData(e.currentTarget);
    const orderData = {
      employeeName: formData.get('employeeName'),
      employeeId: formData.get('employeeId'),
      company: formData.get('company'),
      department: formData.get('department'),
      managerName: formData.get('managerName')
    };

    try {
      const res = await fetch(`http://localhost:5001/api/orders/${editingOrder._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(orderData)
      });
      if (res.ok) {
        toast.success('Order updated successfully');
        setEditingOrder(null);
        fetchOrders();
      } else {
        toast.error('Failed to update order');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  // --- Advanced KPI Calcs ---
  const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const todaysOrdersCount = orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).length;
  const avgOrderValue = orders.length > 0 ? totalSales / orders.length : 0;

  // Group by Company
  const companyStats = orders.reduce((acc, order) => {
    if (!acc[order.company]) acc[order.company] = { orders: 0, spend: 0 };
    acc[order.company].orders += 1;
    acc[order.company].spend += order.totalAmount;
    return acc;
  }, {} as Record<string, { orders: number, spend: number }>);
  
  const topCompanies = Object.entries(companyStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5);

  // Group by Employee
  const employeeStats = orders.reduce((acc, order) => {
    const key = `${order.employeeName} (${order.company})`;
    if (!acc[key]) acc[key] = { spend: 0, orders: 0 };
    acc[key].spend += order.totalAmount;
    acc[key].orders += 1;
    return acc;
  }, {} as Record<string, { spend: number, orders: number }>);

  const topEmployees = Object.entries(employeeStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5);

  // Prepare data for Sales Chart
  const salesByDateObj = orders.reduce((acc, o) => {
    const dateStr = new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    acc[dateStr] = (acc[dateStr] || 0) + o.totalAmount;
    return acc;
  }, {} as Record<string, number>);

  const salesChartData = Object.entries(salesByDateObj)
    .map(([date, amount]) => ({ date, amount }));

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Box sx={{ bgcolor: '#f1f5f9', minHeight: '100vh', pb: 8, width: '100%', display: 'block' }}>
      <AppBar position="static" sx={{ bgcolor: 'primary.dark' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold', textTransform: 'uppercase', color: 'white' }}>
            Megakem BuildCare - Admin Portal
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
          <Button color="inherit" startIcon={<Refresh />} onClick={loadData}>
            Sync Data
          </Button>
        </Toolbar>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} textColor="inherit" indicatorColor="secondary" variant="fullWidth" variant="scrollable" scrollButtons="auto">
          <Tab icon={<TrendingUp />} iconPosition="start" label="Dashboard" />
          <Tab icon={<Assignment />} iconPosition="start" label="Manage Orders" />
          {role === 'SUPERADMIN' && <Tab icon={<Visibility />} iconPosition="start" label="Users" />}
          {role === 'SUPERADMIN' && <Tab icon={<Edit />} iconPosition="start" label="Mail Settings" />}
        </Tabs>
      </AppBar>

      <Box sx={{ width: '100%', mt: 4, px: { xs: 2, md: 4, lg: 6 } }}>
        
        {/* --- TAB 0: DASHBOARD --- */}
        {tab === 0 && (
          <Box sx={{ width: '100%' }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom color="primary.main">
              Platform Analytics
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4, width: '100%' }}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(164,210,51,0.1)', color: 'secondary.main', mr: 2 }}>
                    <TrendingUp fontSize="large" />
                  </Box>
                  <Box>
                    <Typography color="text.secondary" variant="body2" fontWeight="bold">TOTAL SALES VOLUME</Typography>
                    <Typography variant="h5" fontWeight="bold">Rs. {totalSales.toLocaleString()}</Typography>
                  </Box>
                </CardContent>
              </Card>
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,152,0,0.1)', color: 'warning.main', mr: 2 }}>
                    <ShoppingCart fontSize="large" />
                  </Box>
                  <Box>
                    <Typography color="text.secondary" variant="body2" fontWeight="bold">TODAY'S ORDERS</Typography>
                    <Typography variant="h5" fontWeight="bold">{todaysOrdersCount}</Typography>
                  </Box>
                </CardContent>
              </Card>
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(33,150,243,0.1)', color: 'info.main', mr: 2 }}>
                    <Assignment fontSize="large" />
                  </Box>
                  <Box>
                    <Typography color="text.secondary" variant="body2" fontWeight="bold">TOTAL ORDERS</Typography>
                    <Typography variant="h5" fontWeight="bold">{orders.length}</Typography>
                  </Box>
                </CardContent>
              </Card>
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(156,39,176,0.1)', color: 'secondary.main', mr: 2 }}>
                    <Inventory fontSize="large" />
                  </Box>
                  <Box>
                    <Typography color="text.secondary" variant="body2" fontWeight="bold">AVG ORDER VALUE</Typography>
                    <Typography variant="h5" fontWeight="bold">Rs. {avgOrderValue.toFixed(2)}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Sales Chart */}
            <Box sx={{ width: '100%', mb: 4 }}>
              <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid rgba(0,0,0,0.1)', width: '100%' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom color="primary.main">Sales Trend (Lifetime)</Typography>
                <Box sx={{ width: '100%', height: 320, mt: 3 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesChartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(val) => `Rs.${val > 1000 ? (val/1000).toFixed(1)+'k' : val}`} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <RechartsTooltip formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, 'Sales']} cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Line type="monotone" dataKey="amount" stroke="#a4d233" strokeWidth={4} dot={{ r: 4, fill: '#a4d233', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Box>

            {/* Advanced Analytics Grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4, width: '100%' }}>
              <Box>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.1)', height: '100%' }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom color="primary.main">Top Buying Companies</Typography>
                  <Divider sx={{ mb: 2 }} />
                  {topCompanies.length === 0 ? <Typography variant="body2" color="text.secondary">No data available.</Typography> : topCompanies.map((c, i) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                      <Box sx={{ flex: 1, minWidth: 0, mr: 2 }}>
                        <Typography fontWeight="bold" variant="body2" noWrap>{c.name}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap display="block">{c.orders} orders</Typography>
                      </Box>
                      <Typography fontWeight="bold" color="secondary.main" sx={{ whiteSpace: 'nowrap' }}>Rs. {c.spend.toLocaleString()}</Typography>
                    </Box>
                  ))}
                </Paper>
              </Box>
              
              <Box>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.1)', height: '100%' }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom color="primary.main">Top Employees</Typography>
                  <Divider sx={{ mb: 2 }} />
                  {topEmployees.length === 0 ? <Typography variant="body2" color="text.secondary">No data available.</Typography> : topEmployees.map((e, i) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                      <Box sx={{ flex: 1, minWidth: 0, mr: 2 }}>
                        <Typography fontWeight="bold" variant="body2" noWrap>{e.name.split(' (')[0]}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap display="block">{e.name.split('(')[1]?.replace(')', '') || 'Unknown'} • {e.orders} orders</Typography>
                      </Box>
                      <Typography fontWeight="bold" color="secondary.main" sx={{ whiteSpace: 'nowrap' }}>Rs. {e.spend.toLocaleString()}</Typography>
                    </Box>
                  ))}
                </Paper>
              </Box>

              <Box>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.1)', height: '100%' }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom color="primary.main">Recent Orders</Typography>
                  <Divider sx={{ mb: 2 }} />
                  {orders.length === 0 ? <Typography variant="body2" color="text.secondary">No orders yet.</Typography> : orders.slice(0, 5).map((o, i) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                      <Box sx={{ flex: 1, minWidth: 0, mr: 2 }}>
                        <Typography fontWeight="bold" variant="body2" noWrap>{o.employeeName}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap display="block">{new Date(o.createdAt).toLocaleDateString()}</Typography>
                      </Box>
                      <Typography fontWeight="bold" color="secondary.main" sx={{ whiteSpace: 'nowrap' }}>Rs. {o.totalAmount.toLocaleString()}</Typography>
                    </Box>
                  ))}
                </Paper>
              </Box>
            </Box>
          </Box>
        )}

        {/* --- TAB 1: ORDERS --- */}
        {tab === 1 && (
          <Box sx={{ width: '100%' }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom color="primary.main">
              Order Management
            </Typography>
            <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 3, overflow: 'hidden', mt: 3 }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                  <TableRow>
                    <TableCell><b>Date</b></TableCell>
                    <TableCell><b>Employee Name</b></TableCell>
                    <TableCell><b>Company/Dept</b></TableCell>
                    <TableCell><b>Manager</b></TableCell>
                    <TableCell><b>Total Amount</b></TableCell>
                    <TableCell align="center"><b>Actions</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>Loading...</TableCell></TableRow>
                  ) : orders.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>No orders found.</TableCell></TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow key={order._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Typography fontWeight="bold">{order.employeeName}</Typography>
                          <Typography variant="caption" color="text.secondary">ID: {order.employeeId}</Typography>
                        </TableCell>
                        <TableCell>{order.company}<br/><Typography variant="caption">{order.department}</Typography></TableCell>
                        <TableCell>{order.managerName}</TableCell>
                        <TableCell>Rs. {order.totalAmount.toFixed(2)}</TableCell>
                        <TableCell align="center">
                          <IconButton color="primary" onClick={() => setSelectedOrder(order)} title="View Details">
                            <Visibility />
                          </IconButton>
                          {role === 'SUPERADMIN' && (
                            <>
                              <IconButton color="info" onClick={() => setEditingOrder(order)} title="Edit Order">
                                <Edit />
                              </IconButton>
                              <IconButton color="error" onClick={() => handleDeleteOrder(order._id)} title="Delete Order">
                                <Delete />
                              </IconButton>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {role === 'SUPERADMIN' && tab === 2 && (
          <Box sx={{ width: '100%' }}>
            <AdminUsersTab token={token} />
          </Box>
        )}

        {role === 'SUPERADMIN' && tab === 3 && (
          <Box sx={{ width: '100%' }}>
            <AdminMailTab token={token} />
          </Box>
        )}

      </Box>

      {/* --- DIALOGS --- */}
      
      {/* Order Details Dialog */}
      <Dialog open={Boolean(selectedOrder)} onClose={() => setSelectedOrder(null)} maxWidth="md" fullWidth>
        {selectedOrder && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8f9fa' }}>
              <Typography variant="h6" fontWeight="bold">Order Details</Typography>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary.main" gutterBottom>EMPLOYEE INFO</Typography>
                  <Typography><b>Name:</b> {selectedOrder.employeeName}</Typography>
                  <Typography><b>ID:</b> {selectedOrder.employeeId || 'N/A'}</Typography>
                  <Typography><b>Company:</b> {selectedOrder.company}</Typography>
                  <Typography><b>Department:</b> {selectedOrder.department}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary.main" gutterBottom>APPROVAL ROUTING</Typography>
                  <Typography><b>Manager:</b> {selectedOrder.managerName}</Typography>
                  <Typography><b>Date Submitted:</b> {new Date(selectedOrder.createdAt).toLocaleString()}</Typography>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" color="primary.main" sx={{ mt: 4, mb: 2 }}>ORDER ITEMS</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.items.map((item: any) => (
                      <TableRow key={item._id}>
                        <TableCell>
                          <b>{item.name}</b>
                          <Typography variant="caption" display="block" color="text.secondary">
                            {item.packSize} {item.color && item.color !== 'Default' ? ` | ${item.color}` : ''}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">Rs. {item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">Rs. {item.totalPrice.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} align="right"><b>Final Order Total</b></TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold" color="primary.main">
                          Rs. {selectedOrder.totalAmount.toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </DialogContent>
            <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa' }}>
              <Button onClick={() => setSelectedOrder(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>


      {/* Edit Order Dialog */}
      <Dialog open={Boolean(editingOrder)} onClose={() => setEditingOrder(null)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSaveOrder}>
          <DialogTitle sx={{ bgcolor: '#f8f9fa', fontWeight: 'bold' }}>
            Edit Order Details
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField required name="employeeName" label="Employee Name" fullWidth defaultValue={editingOrder?.employeeName || ''} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField name="employeeId" label="Employee ID" fullWidth defaultValue={editingOrder?.employeeId || ''} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField required name="company" label="Company" fullWidth defaultValue={editingOrder?.company || ''} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField required name="department" label="Department" fullWidth defaultValue={editingOrder?.department || ''} />
              </Grid>
              <Grid item xs={12}>
                <TextField required name="managerName" label="Manager Name" fullWidth defaultValue={editingOrder?.managerName || ''} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa' }}>
            <Button onClick={() => setEditingOrder(null)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">Save Changes</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
