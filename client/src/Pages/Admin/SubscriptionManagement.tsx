import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  SmartToy as BotIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import {
  getAdminSubscriptionTiers,
  getAdminSubscriptionStats,
  updateAdminSubscriptionTier,
  getAdminUsers,
  updateAdminUserSubscription,
  AdminSubscriptionTier,
  AdminUser,
  SubscriptionStats
} from '../../api';
import { PlanTier } from '../../types/user';

const formatLimit = (limit: number): string => {
  return limit === -1 ? 'Unlimited' : limit.toString();
};

const SubscriptionManagement: React.FC = () => {
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AdminSubscriptionTier>>({});
  const [saving, setSaving] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [newUserTier, setNewUserTier] = useState<PlanTier>('FREE');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsResponse, usersResponse] = await Promise.all([
        getAdminSubscriptionStats(),
        getAdminUsers()
      ]);

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      if (usersResponse.data.success) {
        setUsers(usersResponse.data.data.users);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTier = (tier: AdminSubscriptionTier) => {
    setEditingTier(tier.tier);
    setEditForm({
      name: tier.name,
      monthly_price: tier.monthly_price,
      max_bots: tier.max_bots,
      max_running_bots: tier.max_running_bots,
      headline: tier.headline,
      badge: tier.badge,
      is_active: tier.is_active
    });
  };

  const handleCancelEdit = () => {
    setEditingTier(null);
    setEditForm({});
  };

  const handleSaveTier = async () => {
    if (!editingTier) return;

    try {
      setSaving(true);
      await updateAdminSubscriptionTier(editingTier, editForm);
      await fetchData();
      setEditingTier(null);
      setEditForm({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tier');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenUserDialog = (user: AdminUser) => {
    setSelectedUser(user);
    setNewUserTier(user.plan_tier);
    setUserDialogOpen(true);
  };

  const handleUpdateUserTier = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      await updateAdminUserSubscription(selectedUser.id, { planTier: newUserTier });
      await fetchData();
      setUserDialogOpen(false);
      setSelectedUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Subscription Management
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={fetchData}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <PeopleIcon color="primary" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
                <Typography variant="h4">
                  {stats.summary.totalUsers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stats.summary.paidUsers} paid, {stats.summary.freeUsers} free
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <MoneyIcon color="success" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Monthly Revenue
                  </Typography>
                </Box>
                <Typography variant="h4" color="success.main">
                  ${stats.summary.monthlyRevenue.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  From {stats.summary.paidUsers} subscribers
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <BotIcon color="info" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Bots
                  </Typography>
                </Box>
                <Typography variant="h4">
                  {stats.summary.totalBots}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Across all users
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <SpeedIcon color="warning" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Active Sessions
                  </Typography>
                </Box>
                <Typography variant="h4">
                  {stats.summary.activeSessions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Currently running
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tier Configuration */}
      <Card sx={{ mb: 4 }}>
        <CardHeader 
          title="Subscription Tiers" 
          subheader="Configure pricing, limits, and features for each tier"
        />
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tier</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Price/mo</TableCell>
                  <TableCell align="center">Max Bots</TableCell>
                  <TableCell align="center">Max Running</TableCell>
                  <TableCell align="center">Users</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats?.tiers.map((tier) => (
                  <TableRow key={tier.tier}>
                    <TableCell>
                      <Chip 
                        label={tier.tier} 
                        color={
                          tier.tier === 'FREE' ? 'default' :
                          tier.tier === 'BASIC' ? 'primary' :
                          tier.tier === 'PREMIUM' ? 'secondary' : 'success'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {editingTier === tier.tier ? (
                        <TextField
                          size="small"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      ) : (
                        <Box>
                          <Typography variant="body1">{tier.name}</Typography>
                          {tier.badge && (
                            <Chip label={tier.badge} size="small" color="warning" sx={{ ml: 1 }} />
                          )}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {editingTier === tier.tier ? (
                        <TextField
                          size="small"
                          type="number"
                          value={editForm.monthly_price || 0}
                          onChange={(e) => setEditForm({ ...editForm, monthly_price: parseFloat(e.target.value) })}
                          InputProps={{ startAdornment: '$' }}
                          sx={{ width: 100 }}
                        />
                      ) : (
                        <Typography variant="body1" fontWeight="bold">
                          ${tier.monthly_price.toFixed(2)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {editingTier === tier.tier ? (
                        <TextField
                          size="small"
                          type="number"
                          value={editForm.max_bots}
                          onChange={(e) => setEditForm({ ...editForm, max_bots: parseInt(e.target.value) })}
                          sx={{ width: 80 }}
                          helperText="-1 = unlimited"
                        />
                      ) : (
                        <Typography variant="body1">
                          {formatLimit(tier.max_bots)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {editingTier === tier.tier ? (
                        <TextField
                          size="small"
                          type="number"
                          value={editForm.max_running_bots}
                          onChange={(e) => setEditForm({ ...editForm, max_running_bots: parseInt(e.target.value) })}
                          sx={{ width: 80 }}
                          helperText="-1 = unlimited"
                        />
                      ) : (
                        <Typography variant="body1">
                          {formatLimit(tier.max_running_bots)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body1" fontWeight="bold">
                        {tier.userCount}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {editingTier === tier.tier ? (
                        <FormControlLabel
                          control={
                            <Switch
                              checked={editForm.is_active}
                              onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                            />
                          }
                          label=""
                        />
                      ) : (
                        <Chip
                          label={tier.is_active ? 'Active' : 'Inactive'}
                          color={tier.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {editingTier === tier.tier ? (
                        <Box display="flex" gap={1} justifyContent="center">
                          <Tooltip title="Save">
                            <IconButton
                              color="primary"
                              onClick={handleSaveTier}
                              disabled={saving}
                            >
                              <SaveIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel">
                            <IconButton onClick={handleCancelEdit}>
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ) : (
                        <Tooltip title="Edit Tier">
                          <IconButton onClick={() => handleEditTier(tier)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* User List */}
      <Card>
        <CardHeader 
          title="Users" 
          subheader="Manage user subscriptions"
        />
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Username</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell align="center">Bots</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.slice(0, 20).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email || '—'}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        color={user.role === 'ADMIN' ? 'error' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.plan_tier}
                        color={
                          user.plan_tier === 'FREE' ? 'default' :
                          user.plan_tier === 'BASIC' ? 'primary' :
                          user.plan_tier === 'PREMIUM' ? 'secondary' : 'success'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">{user.bot_count}</TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Change Plan">
                        <IconButton onClick={() => handleOpenUserDialog(user)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)}>
        <DialogTitle>Change User Subscription</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>User:</strong> {selectedUser.username}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current plan: {selectedUser.plan_tier}
              </Typography>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>New Plan</InputLabel>
                <Select
                  value={newUserTier}
                  label="New Plan"
                  onChange={(e) => setNewUserTier(e.target.value as PlanTier)}
                >
                  <MenuItem value="FREE">Free</MenuItem>
                  <MenuItem value="BASIC">Basic</MenuItem>
                  <MenuItem value="PREMIUM">Premium</MenuItem>
                  <MenuItem value="ENTERPRISE">Enterprise</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateUserTier}
            variant="contained"
            disabled={saving || newUserTier === selectedUser?.plan_tier}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionManagement;
