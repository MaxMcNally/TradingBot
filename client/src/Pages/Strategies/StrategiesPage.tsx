import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as ActivateIcon,
  Pause as DeactivateIcon,
  Psychology as StrategyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  Public as PublicIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { useUserStrategies, usePublicStrategies, useUser, useCustomStrategies } from '../../hooks';
import { UserStrategy } from '../../api';
import { CustomStrategy } from '../../api/customStrategiesApi';
import StrategyDialog from './StrategyDialog';
import CustomStrategyBuilder from '../../components/CustomStrategyBuilder';
import PremiumUpsellDialog from './PremiumUpsellDialog';
import { StrategyFormData } from './Strategies.types';
import { RobotAvatarDisplay } from '../../components/shared/RobotAvatars';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`strategy-tabpanel-${index}`}
      aria-labelledby={`strategy-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Strategies: React.FC = () => {
  const { user } = useUser();
  const isPremium = user?.plan_tier === 'PREMIUM' || user?.plan_tier === 'ENTERPRISE';
  
  const [activeTab, setActiveTab] = useState(0);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<UserStrategy | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<UserStrategy | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [strategyToDelete, setStrategyToDelete] = useState<UserStrategy | null>(null);
  const [customStrategyBuilderOpen, setCustomStrategyBuilderOpen] = useState(false);
  const [editingCustomStrategy, setEditingCustomStrategy] = useState<CustomStrategy | null>(null);
  const [upsellDialogOpen, setUpsellDialogOpen] = useState(false);

  const {
    strategies: userStrategies,
    isLoading: userStrategiesLoading,
    isError: userStrategiesError,
    error: userStrategiesErrorMsg,
    refetch: refetchUserStrategies,
    createStrategy,
    updateStrategy,
    deleteStrategy,
    deactivateStrategy,
    activateStrategy,
    isCreating,
    isUpdating,
    isDeleting
  } = useUserStrategies(includeInactive);

  const {
    strategies: publicStrategies,
    isLoading: publicStrategiesLoading,
    isError: publicStrategiesError,
    error: publicStrategiesErrorMsg,
    refetch: refetchPublicStrategies
  } = usePublicStrategies();

  const {
    strategies: customStrategies,
    createStrategy: createCustomStrategy,
    updateStrategy: updateCustomStrategy,
    deleteStrategy: deleteCustomStrategy,
    isCreating: isCreatingCustom,
    isUpdating: isUpdatingCustom,
    refetch: refetchCustomStrategies
  } = useCustomStrategies(includeInactive);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCreateStrategy = () => {
    setEditingStrategy(null);
    setDialogOpen(true);
  };

  const handleCreateCustomStrategy = () => {
    if (!isPremium) {
      setUpsellDialogOpen(true);
      return;
    }
    setEditingCustomStrategy(null);
    setCustomStrategyBuilderOpen(true);
  };

  const handleEditCustomStrategy = (strategy: CustomStrategy) => {
    setEditingCustomStrategy(strategy);
    setCustomStrategyBuilderOpen(true);
    setAnchorEl(null);
  };

  const handleSaveCustomStrategy = async (data: {
    name: string;
    description?: string;
    buy_conditions: any;
    sell_conditions: any;
    is_public?: boolean;
    avatar?: number | null;
  }) => {
    try {
      if (editingCustomStrategy) {
        await updateCustomStrategy(editingCustomStrategy.id, data);
      } else {
        await createCustomStrategy(data);
      }
      setCustomStrategyBuilderOpen(false);
      setEditingCustomStrategy(null);
      await refetchCustomStrategies();
    } catch (error: any) {
      console.error('Error saving custom strategy:', error);
      alert(error?.response?.data?.error || 'Failed to save custom strategy');
      throw error;
    }
  };

  const handleEditStrategy = (strategy: UserStrategy) => {
    // Check if it's a custom strategy
    if (strategy.strategy_type === 'custom') {
      const customStrategy = customStrategies.find(s => s.id === strategy.id);
      if (customStrategy) {
        handleEditCustomStrategy(customStrategy);
        return;
      }
    }
    setEditingStrategy(strategy);
    setDialogOpen(true);
    setAnchorEl(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, strategy: UserStrategy) => {
    setAnchorEl(event.currentTarget);
    setSelectedStrategy(strategy);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedStrategy(null);
  };

  const handleDeleteClick = (strategy: UserStrategy) => {
    setStrategyToDelete(strategy);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleConfirmDelete = async () => {
    if (strategyToDelete) {
      try {
        // Check if it's a custom strategy
        if (strategyToDelete.strategy_type === 'custom') {
          const customStrategy = customStrategies.find(s => s.id === strategyToDelete.id);
          if (customStrategy) {
            await deleteCustomStrategy(customStrategy.id);
            await refetchCustomStrategies();
          }
        } else {
          await deleteStrategy(strategyToDelete.id);
        }
        setDeleteDialogOpen(false);
        setStrategyToDelete(null);
      } catch (error) {
        console.error('Error deleting strategy:', error);
      }
    }
  };

  const handleToggleActive = async (strategy: UserStrategy) => {
    try {
      // Check if it's a custom strategy
      if (strategy.strategy_type === 'custom') {
        const customStrategy = customStrategies.find(s => s.id === strategy.id);
        if (customStrategy) {
          await updateCustomStrategy(customStrategy.id, { is_active: !customStrategy.is_active });
          await refetchCustomStrategies();
        }
      } else {
        if (strategy.is_active) {
          await deactivateStrategy(strategy.id);
        } else {
          await activateStrategy(strategy.id);
        }
      }
      handleMenuClose();
    } catch (error) {
      console.error('Error toggling strategy status:', error);
    }
  };

  const handleSaveStrategy = async (data: StrategyFormData) => {
    try {
      if (editingStrategy) {
        await updateStrategy(editingStrategy.id, data);
      } else {
        await createStrategy(data);
      }
      setDialogOpen(false);
      setEditingStrategy(null);
    } catch (error) {
      console.error('Error saving strategy:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStrategyTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'movingAverageCrossover': 'Moving Average Crossover',
      'bollingerBands': 'Bollinger Bands',
      'meanReversion': 'Mean Reversion',
      'momentum': 'Momentum',
      'breakout': 'Breakout',
      'custom': 'Custom Strategy'
    };
    return typeMap[type] || type;
  };

  const getBacktestResults = (strategy: UserStrategy) => {
    if (!strategy.backtest_results) return null;
    
    try {
      const results = typeof strategy.backtest_results === 'string' 
        ? JSON.parse(strategy.backtest_results) 
        : strategy.backtest_results;
      
      return {
        totalReturn: results.totalReturn || 0,
        winRate: results.winRate || 0,
        maxDrawdown: results.maxDrawdown || 0,
        finalPortfolioValue: results.finalPortfolioValue || 0
      };
    } catch {
      return null;
    }
  };

  const renderStrategyCard = (strategy: UserStrategy, showActions: boolean = true) => {
    const backtestResults = getBacktestResults(strategy);
    
    return (
      <Grid item xs={12} md={6} lg={4} key={strategy.id}>
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Top Row - Chips on left, Edit on right */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {strategy.is_public && (
                  <Tooltip title="Public Strategy">
                    <PublicIcon color="primary" fontSize="small" />
                  </Tooltip>
                )}
                <Chip
                  label={strategy.is_active ? 'Active' : 'Inactive'}
                  color={strategy.is_active ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              {showActions && (
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuOpen(e, strategy)}
                >
                  <MoreVertIcon />
                </IconButton>
              )}
            </Box>

            {/* Avatar - Centered */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
              <RobotAvatarDisplay 
                avatar={strategy.avatar}
                size={80}
              />
            </Box>

            {/* Bot Name */}
            <Typography variant="h6" component="h2" textAlign="center" mb={2} width="100%">
              {strategy.name}
            </Typography>

            {/* Description */}
            <Typography variant="body2" color="text.secondary" mb={2} textAlign="center" width="100%">
              {strategy.description || 'No description provided'}
            </Typography>

            {/* Strategy Type */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', width: '100%' }}>
              <Chip
                label={getStrategyTypeLabel(strategy.strategy_type)}
                variant="outlined"
                size="small"
              />
            </Box>

            {/* Backtest Results */}
            {backtestResults && (
              <Box sx={{ width: '100%', mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom textAlign="center">
                  Backtest Results
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1} mb={1} justifyContent="center">
                  <Chip
                    icon={<TrendingUpIcon />}
                    label={`${(backtestResults.totalReturn * 100).toFixed(1)}% Return`}
                    color={backtestResults.totalReturn > 0 ? 'success' : 'error'}
                    size="small"
                  />
                  <Chip
                    icon={<AssessmentIcon />}
                    label={`${(backtestResults.winRate * 100).toFixed(1)}% Win Rate`}
                    variant="outlined"
                    size="small"
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                  Max Drawdown: {(backtestResults.maxDrawdown * 100).toFixed(1)}%
                </Typography>
              </Box>
            )}

            {/* Created Date */}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto', display: 'block', textAlign: 'center' }}>
              Created: {formatDate(strategy.created_at)}
            </Typography>
          </CardContent>

          {showActions && (
            <CardActions sx={{ justifyContent: 'center' }}>
              <Button
                size="small"
                startIcon={<EditIcon />}
                onClick={() => handleEditStrategy(strategy)}
              >
                Edit
              </Button>
              <Button
                size="small"
                startIcon={strategy.is_active ? <DeactivateIcon /> : <ActivateIcon />}
                onClick={() => handleToggleActive(strategy)}
                color={strategy.is_active ? 'warning' : 'success'}
              >
                {strategy.is_active ? 'Deactivate' : 'Activate'}
              </Button>
            </CardActions>
          )}
        </Card>
      </Grid>
    );
  };

  const renderBasicStrategies = () => {
    const basicStrategies = [
      {
        id: 'basic-moving-average',
        name: 'Moving Average Crossover',
        description: 'A simple strategy that buys when short-term moving average crosses above long-term moving average.',
        strategy_type: 'movingAverageCrossover',
        is_active: true,
        is_public: false,
        created_at: new Date().toISOString(),
        config: { fastWindow: 10, slowWindow: 30 }
      },
      {
        id: 'basic-bollinger',
        name: 'Bollinger Bands',
        description: 'Buy when price touches lower band, sell when it touches upper band.',
        strategy_type: 'bollingerBands',
        is_active: true,
        is_public: false,
        created_at: new Date().toISOString(),
        config: { window: 20, multiplier: 2 }
      },
      {
        id: 'basic-mean-reversion',
        name: 'Mean Reversion',
        description: 'Identifies when prices deviate from their mean and expects them to revert.',
        strategy_type: 'meanReversion',
        is_active: true,
        is_public: false,
        created_at: new Date().toISOString(),
        config: { window: 20, threshold: 2 }
      }
    ];

    return (
      <Grid container spacing={3}>
        {basicStrategies.map((strategy) => (
          <Grid item xs={12} md={6} lg={4} key={strategy.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6" component="h2" noWrap>
                    {strategy.name}
                  </Typography>
                  <Chip
                    label="Basic"
                    color="info"
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" mb={2}>
                  {strategy.description}
                </Typography>

                <Chip
                  label={getStrategyTypeLabel(strategy.strategy_type)}
                  variant="outlined"
                  size="small"
                  sx={{ mb: 2 }}
                />

                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    This is a basic strategy template. You can customize its parameters or create your own version.
                  </Typography>
                </Alert>
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleCreateStrategy}
                >
                  Create Custom Version
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderEmptyState = (type: string, icon: React.ReactNode) => (
    <Card>
      <CardContent sx={{ textAlign: 'center', py: 6 }}>
        {icon}
        <Typography variant="h6" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
          No {type.toLowerCase()} strategies found
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          {type === 'Public' 
            ? 'No public strategies are available at the moment. Check back later or create your own public strategy.'
            : type === 'My'
            ? 'Create your first strategy to get started with automated trading.'
            : 'Basic strategies are always available as templates.'
          }
        </Typography>
        {type === 'My' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateStrategy}
          >
            Create Your First Strategy
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Program Bot
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Create and manage your trading bots. Build custom algorithms or use pre-built strategies.
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <FormControlLabel
            control={
              <Switch
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
              />
            }
            label="Show Inactive"
          />
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleCreateStrategy}
            disabled={isCreating}
          >
            Create Bot
          </Button>
          {isPremium && (
            <Button
              variant="contained"
              startIcon={<AutoAwesomeIcon />}
              onClick={handleCreateCustomStrategy}
              disabled={isCreatingCustom}
              color="primary"
            >
              Create Custom Strategy
            </Button>
          )}
          {!isPremium && (
            <Button
              variant="contained"
              startIcon={<AutoAwesomeIcon />}
              onClick={() => setUpsellDialogOpen(true)}
              color="primary"
            >
              Create Custom Strategy
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="strategy tabs">
          <Tab 
            icon={<PersonIcon />} 
            label="My Bots" 
            iconPosition="start"
            id="strategy-tab-0"
            aria-controls="strategy-tabpanel-0"
          />
          <Tab 
            icon={<PublicIcon />} 
            label="Public Bots" 
            iconPosition="start"
            id="strategy-tab-1"
            aria-controls="strategy-tabpanel-1"
          />
          <Tab 
            icon={<SettingsIcon />} 
            label="Basic Bots" 
            iconPosition="start"
            id="strategy-tab-2"
            aria-controls="strategy-tabpanel-2"
          />
        </Tabs>
      </Box>

      {/* My Bots Tab */}
      <TabPanel value={activeTab} index={0}>
        {userStrategiesLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        ) : userStrategiesError ? (
          <Box p={3}>
            <Alert severity="error">
              Error loading strategies: {userStrategiesErrorMsg?.message || 'Unknown error'}
            </Alert>
            <Button onClick={() => refetchUserStrategies()} sx={{ mt: 2 }}>
              Retry
            </Button>
          </Box>
        ) : userStrategies.length === 0 && (!isPremium || customStrategies.length === 0) ? (
          <Box>
            {renderEmptyState('My', <StrategyIcon sx={{ fontSize: 64, color: 'grey.400' }} />)}
            {isPremium && (
              <Card sx={{ mt: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <AutoAwesomeIcon sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h6">Build Custom Trading Algorithms</Typography>
                      <Typography variant="body2">
                        Create advanced strategies by chaining technical indicators
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    color="inherit"
                    startIcon={<AutoAwesomeIcon />}
                    onClick={handleCreateCustomStrategy}
                    sx={{ mt: 1 }}
                  >
                    Create Custom Strategy
                  </Button>
                </CardContent>
              </Card>
            )}
          </Box>
        ) : (
          <Grid container spacing={3}>
            {userStrategies.map((strategy) => renderStrategyCard(strategy, true))}
            {isPremium && customStrategies.map((strategy) => (
              <Grid item xs={12} md={6} lg={4} key={`custom-${strategy.id}`}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: '2px solid', borderColor: 'primary.main' }}>
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* Top Row - Chips on left, Edit on right */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label="Custom" color="primary" size="small" />
                        <Chip
                          label={strategy.is_active ? 'Active' : 'Inactive'}
                          color={strategy.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setAnchorEl(e.currentTarget);
                          setSelectedStrategy({
                            id: strategy.id,
                            user_id: strategy.user_id,
                            name: strategy.name,
                            description: strategy.description,
                            strategy_type: 'custom',
                            config: {},
                            is_active: strategy.is_active,
                            is_public: false,
                            avatar: strategy.avatar,
                            created_at: strategy.created_at,
                            updated_at: strategy.updated_at
                          } as UserStrategy);
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>

                    {/* Avatar - Centered */}
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                      <RobotAvatarDisplay 
                        avatar={strategy.avatar}
                        size={80}
                      />
                    </Box>

                    {/* Bot Name */}
                    <Typography variant="h6" component="h2" textAlign="center" mb={2} width="100%">
                      {strategy.name}
                    </Typography>

                    {/* Description */}
                    <Typography variant="body2" color="text.secondary" mb={2} textAlign="center" width="100%">
                      {strategy.description || 'Custom trading algorithm'}
                    </Typography>

                    {/* Strategy Type */}
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', width: '100%' }}>
                      <Chip
                        label="Custom Strategy"
                        variant="outlined"
                        size="small"
                      />
                    </Box>

                    {/* Created Date */}
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto', display: 'block', textAlign: 'center' }}>
                      Created: {formatDate(strategy.created_at)}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'center' }}>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleEditCustomStrategy(strategy)}
                    >
                      Edit
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Public Bots Tab */}
      <TabPanel value={activeTab} index={1}>
        {publicStrategiesLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        ) : publicStrategiesError ? (
          <Box p={3}>
            <Alert severity="error">
              Error loading public strategies: {publicStrategiesErrorMsg?.message || 'Unknown error'}
            </Alert>
            <Button onClick={() => refetchPublicStrategies()} sx={{ mt: 2 }}>
              Retry
            </Button>
          </Box>
        ) : publicStrategies.length === 0 ? (
          renderEmptyState('Public', <PublicIcon sx={{ fontSize: 64, color: 'grey.400' }} />)
        ) : (
          <Grid container spacing={3}>
            {publicStrategies.map((strategy) => renderStrategyCard(strategy, false))}
          </Grid>
        )}
      </TabPanel>

      {/* Basic Bots Tab */}
      <TabPanel value={activeTab} index={2}>
        {renderBasicStrategies()}
      </TabPanel>

      {/* Strategy Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => selectedStrategy && handleEditStrategy(selectedStrategy)}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => selectedStrategy && handleToggleActive(selectedStrategy)}>
          {selectedStrategy?.is_active ? (
            <>
              <DeactivateIcon sx={{ mr: 1 }} />
              Deactivate
            </>
          ) : (
            <>
              <ActivateIcon sx={{ mr: 1 }} />
              Activate
            </>
          )}
        </MenuItem>
        <MenuItem 
          onClick={() => selectedStrategy && handleDeleteClick(selectedStrategy)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Strategy Dialog */}
      <StrategyDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingStrategy(null);
        }}
        strategy={editingStrategy}
        onSave={handleSaveStrategy}
        isLoading={isCreating || isUpdating}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Strategy</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{strategyToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={20} /> : null}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Custom Strategy Builder */}
      {isPremium && (
        <CustomStrategyBuilder
          open={customStrategyBuilderOpen}
          onClose={() => {
            setCustomStrategyBuilderOpen(false);
            setEditingCustomStrategy(null);
          }}
          onSave={handleSaveCustomStrategy}
          editingStrategy={editingCustomStrategy ? {
            id: editingCustomStrategy.id,
            name: editingCustomStrategy.name,
            description: editingCustomStrategy.description,
            buy_conditions: editingCustomStrategy.buy_conditions,
            sell_conditions: editingCustomStrategy.sell_conditions,
            is_public: editingCustomStrategy.is_public,
            avatar: editingCustomStrategy.avatar
          } : undefined}
          isLoading={isCreatingCustom || isUpdatingCustom}
        />
      )}

      {/* Premium Upsell Dialog */}
      <PremiumUpsellDialog
        open={upsellDialogOpen}
        onClose={() => setUpsellDialogOpen(false)}
        previewMode={true}
      />
    </Box>
  );
};

export default Strategies;
