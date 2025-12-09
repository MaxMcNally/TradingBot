# Backtest Enhancement Roadmap

## Overview

This document outlines a comprehensive roadmap to enhance the backtesting system to:
1. **Support custom strategies** in backtesting ✅ **COMPLETED**
2. **Align backtest sessions with live trading sessions** for accurate performance prediction ⚠️ **IN PROGRESS**
3. **Integrate trading session settings** into backtests for realistic simulation ⚠️ **INFRASTRUCTURE COMPLETE**

## 🎯 Current Status Summary

### ✅ Completed (Phase 1)
- **Custom Strategy Support**: Fully implemented and tested
  - Backend API accepts and validates custom strategies
  - Backtest script executes custom strategies using `CustomStrategyExecutor`
  - Frontend allows backtesting of custom strategies
  - Comprehensive test coverage (backend, frontend, and execution logic)

### ⚠️ Infrastructure Complete (Phase 2)
- **BacktestPortfolio Class**: Created with all position sizing and risk management features
  - Position sizing: Fixed, Percentage, Kelly, Equal Weight
  - Risk management: Stop loss, take profit, position limits, daily loss limits
  - Trading windows: Hours and days restrictions
  - Trailing stops support
  
- **OrderExecutionSimulator Class**: Created with all order execution features
  - Slippage models: None, Fixed, Proportional
  - Commission calculation
  - Order types: Market, Limit, Stop, Stop Limit, Trailing Stop
  - Time in force: Day, GTC, IOC, FOK, OPG, CLS
  - Partial fills support

- **API & Script Support**: Backend accepts session settings, script accepts settings flag

### ✅ Integration Complete
- ✅ Custom strategy execution function refactored to use new infrastructure
- ✅ All strategy execution functions refactored (meanReversion, movingAverageCrossover, momentum, bollingerBands, breakout)
- ✅ Frontend UI for configuring session settings in backtests
- ✅ Session settings passed to all strategy functions in backtest script
- ✅ Integration testing (comprehensive test suite created)

### ❌ Not Started
- Phase 2.5: Session Settings Templates
- Phase 3: Enhanced Portfolio Simulation (rebalancing, bracket orders, OCO)
- Phase 4: Results Comparison & Validation
- Phase 5: Performance Optimization

### 📚 User Education & Legal
- ✅ Order execution explanation component created
- ✅ Reusable modal for order execution information
- ✅ Disclaimers page with comprehensive legal coverage
- ✅ Integration into session controls (trading and backtesting contexts)

## Current State Analysis

### What Works
- ✅ Predefined strategies (meanReversion, movingAverageCrossover, momentum, bollingerBands, breakout, sentimentAnalysis)
- ✅ **Custom strategies** - Full support for backtesting custom strategies with buy/sell conditions
- ✅ Basic backtest execution with historical data
- ✅ Performance metrics calculation
- ✅ Multi-symbol backtesting
- ✅ Strategy-specific parameter configuration
- ✅ **Order execution education** - Components explaining order execution differences between backtesting and live trading
- ✅ **Legal disclaimers** - Comprehensive disclaimers page with order execution warnings

### What's Missing
- ✅ Custom strategy support in backtesting (COMPLETED)
- ⚠️ Trading session settings integration (INFRASTRUCTURE COMPLETE - Integration pending)
- ⚠️ Realistic order execution simulation (CLASSES CREATED - Integration pending)
- ⚠️ Risk management enforcement (CLASSES CREATED - Integration pending)
- ⚠️ Trading window restrictions (CLASSES CREATED - Integration pending)
- ⚠️ Position sizing methods (CLASSES CREATED - Integration pending)
- ⚠️ Portfolio-level constraints (CLASSES CREATED - Integration pending)
- ⚠️ Order execution constraints (CLASSES CREATED - Integration pending)
- ❌ Session settings templates (Not started)

## Roadmap Phases

### Phase 1: Custom Strategy Support in Backtesting
**Priority: High | Estimated Effort: 2-3 days | Status: ✅ COMPLETED**

#### Goals
- Enable backtesting of custom strategies with buy/sell conditions
- Integrate `CustomStrategyExecutor` into backtest pipeline
- Support custom strategy parameters in backtest API

#### Tasks

##### 1.1 Backend API Updates
**File: `api/controllers/backtestController.ts`**

- [x] Add `customStrategy` field to `BacktestRequest` interface
  ```typescript
  export interface BacktestRequest {
    // ... existing fields
    customStrategy?: {
      id: number;
      buy_conditions: ConditionNode | ConditionNode[];
      sell_conditions: ConditionNode | ConditionNode[];
    };
  }
  ```

- [x] Update strategy validation to accept `'custom'` as valid strategy type
- [x] Add logic to fetch custom strategy from database when `strategy === 'custom'`
- [x] Pass custom strategy config to backtest script

##### 1.2 Backtest Script Updates
**File: `src/backtest.ts`**

- [x] Add `--custom-strategy` flag to accept JSON-encoded custom strategy config
- [x] Import `CustomStrategyExecutor` and related utilities
- [x] Add custom strategy execution function `runCustomStrategyStrategy`
- [x] Integrate custom strategy into backtest script switch statement
- [x] Test custom strategy execution in backtest context

##### 1.3 Frontend Updates
**File: `client/src/Pages/Backtesting/BacktestSessionControls.tsx`**

- [x] Remove warning message for custom strategies
- [x] Update `handleRunBacktest` to include custom strategy data:
  ```typescript
  if (selectedBot.type === 'custom') {
    backtestRequest.strategy = 'custom';
    backtestRequest.customStrategy = {
      id: selectedBot.id,
      buy_conditions: selectedBot.buy_conditions,
      sell_conditions: selectedBot.sell_conditions
    };
  }
  ```

- [x] Enable "Run Backtest" button for custom strategies
- [x] Update validation to allow custom strategies
- [x] Update `BacktestRequest` interface in frontend API types

##### 1.4 Testing
- [x] Test backtesting with simple custom strategy (single indicator)
- [x] Test backtesting with complex custom strategy (multiple indicators, logical operators)
- [x] Create test file `api/__tests__/backtestController.test.ts` with custom strategy tests
- [x] Create test file `src/__tests__/backtest.customStrategy.test.ts` for execution logic
- [x] Create test file `client/src/Pages/Backtesting/BacktestSessionControls.test.tsx` for frontend
- [x] Test error handling for invalid custom strategies
- [ ] Verify custom strategy results match live trading behavior (requires live trading comparison)

---

### Phase 2: Trading Session Settings Integration
**Priority: High | Estimated Effort: 3-4 days | Status: ⚠️ INFRASTRUCTURE COMPLETE (Integration Pending - ~1-2 days remaining)**

#### Goals
- Apply trading session settings to backtest execution
- Simulate realistic order execution constraints
- Enforce risk management rules during backtesting

#### Tasks

##### 2.1 Backend API Updates
**File: `api/controllers/backtestController.ts`**

- [x] Add `sessionSettings` field to `BacktestRequest`:
  ```typescript
  export interface BacktestRequest {
    // ... existing fields
    sessionSettings?: TradingSessionSettings;
  }
  ```

- [x] Update `runSingleBacktest` to accept and pass session settings
- [x] Settings validation handled by `TradingSessionSettingsService`

##### 2.2 Backtest Script Updates
**File: `src/backtest.ts`**

- [x] Add `--session-settings` flag to accept JSON-encoded settings
- [x] Parse session settings from command line arguments
- [x] Integrate settings into custom strategy execution function
- [x] Integrate settings into other strategy execution functions (meanReversion, movingAverageCrossover, momentum, bollingerBands, breakout)

##### 2.3 Portfolio Manager Updates
**File: `src/backtest/BacktestPortfolio.ts` (CREATED)**

- [x] Create `BacktestPortfolio` class that extends existing portfolio
- [x] Implement position sizing methods:
  - [x] Fixed: Use `position_size_value` directly
  - [x] Percentage: Calculate shares based on `max_position_size_percentage`
  - [x] Kelly: Implement simplified Kelly Criterion calculation
  - [x] Equal Weight: Distribute capital equally across positions

- [x] Implement risk management:
  - [x] Stop loss enforcement (check on each price update)
  - [x] Take profit enforcement
  - [x] Max position size limits
  - [x] Max open positions limit
  - [x] Daily loss limits (track daily P&L, stop trading if exceeded)
  - [x] Trailing stop support

- [x] Implement trading window restrictions:
  - [x] Filter trades by `trading_hours_start` and `trading_hours_end`
  - [x] Filter trades by `trading_days` (MON, TUE, etc.)
  - [x] Skip bars outside trading window

**Status**: Class created and ready for integration. Needs to be integrated into strategy execution functions.

##### 2.4 Order Execution Simulation
**File: `src/backtest/OrderExecutionSimulator.ts` (CREATED)**

- [x] Create order execution simulator class
- [x] Implement slippage models:
  - [x] None: Execute at exact price
  - [x] Fixed: Apply fixed slippage percentage
  - [x] Proportional: Apply slippage based on trade size/volume

- [x] Implement commission calculation:
  - [x] Apply `commission_rate` to each trade
  - [x] Support per-share commission model

- [x] Implement order types:
  - [x] Market: Execute immediately at current price (with slippage)
  - [x] Limit: Execute only if price reaches limit (with offset from `limit_price_offset_percentage`)
  - [x] Stop: Execute when price crosses stop level
  - [x] Stop Limit: Combination of stop and limit
  - [x] Trailing Stop: Handled at portfolio level

- [x] Implement time in force:
  - [x] Day: Valid for trading day
  - [x] GTC: Good until canceled
  - [x] IOC: Immediate or cancel
  - [x] FOK: Fill or kill
  - [x] OPG/CLS: Opening/closing auctions

- [x] Implement partial fills:
  - [x] If `allow_partial_fills = false`, only execute full orders
  - [x] If `allow_partial_fills = true`, execute partial orders based on available volume

**Status**: Class created and ready for integration. Needs to be integrated into strategy execution functions.

##### 2.5 Frontend Updates
**File: `client/src/Pages/Backtesting/BacktestSessionControls.tsx`**

- [x] Add `sessionSettings` field to `BacktestRequest` interface
- [x] Add "Read More About Order Execution" button with modal
- [x] Create `OrderExecutionExplanation` component with warnings
- [x] Create reusable `OrderExecutionModal` component
- [x] Import `TradingSessionSettingsForm` component
- [x] Add state for session settings
- [x] Add "Configure Settings" accordion section
- [x] Include settings in backtest request
- [x] Display settings summary before running backtest
- [x] Add option to use default settings or skip settings configuration (optional accordion)

**Status**: Frontend UI integration complete. Users can now configure session settings in backtests.

##### 2.6 Testing
- [x] Test backtest with stop loss/take profit settings
- [x] Test position sizing methods (fixed, percentage, equal weight)
- [x] Test trading window restrictions
- [x] Test order execution with slippage and commissions
- [x] Test daily loss limits (percentage and absolute)
- [x] Test custom strategy with session settings
- [x] Test multiple settings combinations
- [x] Test default settings behavior
- [x] Test edge cases (empty data, insufficient data)

**Status**: Comprehensive integration tests created in `src/__tests__/backtest.sessionSettings.integration.test.ts`. Tests cover all major features and edge cases.

---

### Phase 2.5: Session Settings Templates (Reusable Configurations)
**Priority: High | Estimated Effort: 2-3 days | Status: ❌ NOT STARTED**

#### Goals
- Enable users to save and reuse trading/testing session settings as templates
- Create a template management system for both trading and backtesting sessions
- Allow quick application of proven settings configurations

#### Use Cases
1. User creates settings for a trading session, tests it, and saves it as "Conservative Risk Profile"
2. User applies the same template to a backtest to validate performance
3. User creates multiple templates for different trading styles (day trading, swing trading, etc.)
4. User shares templates with team members (future enhancement)

#### Tasks

##### 2.5.1 Database Schema
**File: `scripts/migrations/004-add-session-settings-templates.ts` (new)**

- [ ] Create `session_settings_templates` table:
  ```sql
  CREATE TABLE IF NOT EXISTS session_settings_templates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    
    -- Risk Management
    stop_loss_percentage DOUBLE PRECISION,
    take_profit_percentage DOUBLE PRECISION,
    max_position_size_percentage DOUBLE PRECISION DEFAULT 25.0,
    max_daily_loss_percentage DOUBLE PRECISION,
    max_daily_loss_absolute DOUBLE PRECISION,
    
    -- Order Execution
    time_in_force TEXT NOT NULL DEFAULT 'day',
    allow_partial_fills BOOLEAN DEFAULT TRUE,
    extended_hours BOOLEAN DEFAULT FALSE,
    order_type_default TEXT DEFAULT 'market',
    limit_price_offset_percentage DOUBLE PRECISION,
    
    -- Position Management
    max_open_positions INTEGER DEFAULT 10,
    position_sizing_method TEXT DEFAULT 'percentage',
    position_size_value DOUBLE PRECISION DEFAULT 10.0,
    rebalance_frequency TEXT DEFAULT 'never',
    
    -- Trading Window
    trading_hours_start TEXT DEFAULT '09:30',
    trading_hours_end TEXT DEFAULT '16:00',
    trading_days TEXT[] DEFAULT ARRAY['MON', 'TUE', 'WED', 'THU', 'FRI'],
    
    -- Advanced
    enable_trailing_stop BOOLEAN DEFAULT FALSE,
    trailing_stop_percentage DOUBLE PRECISION,
    enable_bracket_orders BOOLEAN DEFAULT FALSE,
    enable_oco_orders BOOLEAN DEFAULT FALSE,
    commission_rate DOUBLE PRECISION DEFAULT 0.0,
    slippage_model TEXT DEFAULT 'none',
    slippage_value DOUBLE PRECISION DEFAULT 0.0,
    
    is_public BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, name)
  );
  
  CREATE INDEX IF NOT EXISTS idx_session_settings_templates_user_id 
  ON session_settings_templates(user_id);
  
  CREATE INDEX IF NOT EXISTS idx_session_settings_templates_public 
  ON session_settings_templates(is_public) WHERE is_public = TRUE;
  ```

- [ ] Create migration file with up/down methods
- [ ] Test migration on both PostgreSQL and SQLite

##### 2.5.2 Backend API - Database Layer
**File: `api/database/sessionSettingsTemplatesDatabase.ts` (new)**

- [ ] Create `SessionSettingsTemplatesDatabase` class with methods:
  - [ ] `createTemplate(userId, templateData)` - Create new template
  - [ ] `getTemplateById(templateId, userId)` - Get template by ID (with ownership check)
  - [ ] `getTemplatesByUserId(userId)` - Get all user's templates
  - [ ] `getPublicTemplates()` - Get all public templates (for future sharing)
  - [ ] `updateTemplate(templateId, userId, updates)` - Update template
  - [ ] `deleteTemplate(templateId, userId)` - Delete template
  - [ ] `incrementUsageCount(templateId)` - Increment usage counter
  - [ ] `createTemplateFromSettings(userId, settings, name, description)` - Create template from existing settings

##### 2.5.3 Backend API - Controller
**File: `api/controllers/sessionSettingsTemplatesController.ts` (new)**

- [ ] Create controller with endpoints:
  ```typescript
  // GET /api/session-settings-templates
  // Get all templates for authenticated user
  export const getTemplates = async (req: Request, res: Response)
  
  // GET /api/session-settings-templates/:templateId
  // Get specific template
  export const getTemplate = async (req: Request, res: Response)
  
  // POST /api/session-settings-templates
  // Create new template
  export const createTemplate = async (req: Request, res: Response)
  
  // PUT /api/session-settings-templates/:templateId
  // Update template
  export const updateTemplate = async (req: Request, res: Response)
  
  // DELETE /api/session-settings-templates/:templateId
  // Delete template
  export const deleteTemplate = async (req: Request, res: Response)
  
  // POST /api/session-settings-templates/:templateId/apply
  // Apply template to a session (trading or backtest)
  export const applyTemplate = async (req: Request, res: Response)
  
  // POST /api/session-settings-templates/from-session/:sessionId
  // Create template from existing session settings
  export const createTemplateFromSession = async (req: Request, res: Response)
  ```

- [ ] Add authentication middleware
- [ ] Add ownership validation
- [ ] Add input validation
- [ ] Add error handling

##### 2.5.4 Backend API - Routes
**File: `api/routes/sessionSettingsTemplates.ts` (new)**

- [ ] Create router with all template endpoints
- [ ] Add authentication middleware
- [ ] Register routes in main app

##### 2.5.5 Frontend API Client
**File: `client/src/api/tradingApi.ts`**

- [ ] Add `SessionSettingsTemplate` interface:
  ```typescript
  export interface SessionSettingsTemplate {
    id: number;
    user_id: number;
    name: string;
    description?: string;
    // ... all TradingSessionSettings fields (without session_id)
    is_public: boolean;
    usage_count: number;
    created_at: string;
    updated_at: string;
  }
  ```

- [ ] Add API functions:
  ```typescript
  export const getSessionSettingsTemplates = (): Promise<AxiosResponse<ApiResponse<SessionSettingsTemplate[]>>>
  export const getSessionSettingsTemplate = (templateId: number): Promise<AxiosResponse<ApiResponse<SessionSettingsTemplate>>>
  export const createSessionSettingsTemplate = (template: Omit<SessionSettingsTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'usage_count'>): Promise<AxiosResponse<ApiResponse<SessionSettingsTemplate>>>
  export const updateSessionSettingsTemplate = (templateId: number, updates: Partial<SessionSettingsTemplate>): Promise<AxiosResponse<ApiResponse<SessionSettingsTemplate>>>
  export const deleteSessionSettingsTemplate = (templateId: number): Promise<AxiosResponse<ApiResponse<void>>>
  export const createTemplateFromSession = (sessionId: number, name: string, description?: string): Promise<AxiosResponse<ApiResponse<SessionSettingsTemplate>>>
  ```

##### 2.5.6 Frontend Hook
**File: `client/src/hooks/useSessionSettingsTemplates/useSessionSettingsTemplates.ts` (new)**

- [ ] Create React Query hook:
  ```typescript
  export const useSessionSettingsTemplates = () => {
    // Query: Get all templates
    // Mutations: Create, Update, Delete
    // Helper: Apply template to session
  }
  ```

- [ ] Implement caching and invalidation
- [ ] Add optimistic updates

##### 2.5.7 Frontend Component - Template Selector
**File: `client/src/components/shared/SessionSettingsTemplateSelector/SessionSettingsTemplateSelector.tsx` (new)**

- [ ] Create component for selecting/creating templates:
  - [ ] Dropdown/Select for choosing existing template
  - [ ] "Save as Template" button when configuring settings
  - [ ] "Create from Session" button in session details
  - [ ] Template preview/card view
  - [ ] Template management (edit, delete, duplicate)

##### 2.5.8 Frontend Integration - Trading Session Controls
**File: `client/src/Pages/Dashboard/TradingSessionControls.tsx`**

- [ ] Add template selector to settings step
- [ ] Allow loading template into form
- [ ] Add "Save as Template" button after configuring settings
- [ ] Show template name when template is applied
- [ ] Allow switching between template and manual configuration

##### 2.5.9 Frontend Integration - Backtest Session Controls
**File: `client/src/Pages/Backtesting/BacktestSessionControls.tsx`**

- [ ] Add template selector to settings configuration
- [ ] Allow loading template into form
- [ ] Add "Save as Template" button
- [ ] Show template name when template is applied
- [ ] Ensure templates work for both trading and backtesting

##### 2.5.10 Frontend Component - Template Management
**File: `client/src/Pages/Settings/SessionSettingsTemplatesPage.tsx` (new)**

- [ ] Create dedicated page for managing templates:
  - [ ] List all user templates
  - [ ] Create new template
  - [ ] Edit existing template
  - [ ] Delete template
  - [ ] View template details
  - [ ] See usage statistics
  - [ ] Duplicate template

##### 2.5.11 Backend Integration - Apply Template to Session
**File: `api/controllers/tradingController.ts` and `api/controllers/backtestController.ts`**

- [ ] Update `startTradingSession` to accept `templateId`:
  ```typescript
  export interface StartTradingSessionRequest {
    // ... existing fields
    settingsTemplateId?: number; // Apply template instead of inline settings
  }
  ```

- [ ] Update `runBacktest` to accept `templateId`:
  ```typescript
  export interface BacktestRequest {
    // ... existing fields
    settingsTemplateId?: number; // Apply template instead of inline settings
  }
  ```

- [ ] Add logic to fetch template and apply to session
- [ ] Increment template usage count when applied

##### 2.5.12 Testing
- [ ] Test creating template from session settings
- [ ] Test applying template to new trading session
- [ ] Test applying template to backtest
- [ ] Test template CRUD operations
- [ ] Test template validation
- [ ] Test ownership checks (users can only access their templates)
- [ ] Test usage count incrementing
- [ ] Test template deletion (ensure it doesn't affect existing sessions)

---

### Phase 3: Enhanced Portfolio Simulation
**Priority: Medium | Estimated Effort: 2-3 days | Status: ⚠️ PARTIAL (Core features in BacktestPortfolio, integration pending)**

#### Goals
- Improve portfolio management during backtests
- Add advanced position management features
- Support rebalancing strategies

#### Tasks

##### 3.1 Rebalancing Implementation
**File: `src/backtest/BacktestPortfolio.ts`**

- [ ] Implement rebalancing logic:
  - [ ] Never: No rebalancing (current behavior)
  - [ ] Daily: Rebalance at start of each trading day
  - [ ] Weekly: Rebalance at start of each week
  - [ ] On Signal: Rebalance when strategy generates signal

- [ ] Calculate target positions based on sizing method
- [ ] Execute rebalancing trades

##### 3.2 Advanced Position Management
- [x] Implement trailing stops (in BacktestPortfolio):
  - [x] Track highest price since entry
  - [x] Update stop loss based on `trailing_stop_percentage`
  - [x] Execute stop when price drops below trailing stop

- [ ] Implement bracket orders:
  - [ ] Place stop loss and take profit orders simultaneously
  - [ ] Manage bracket order lifecycle

- [ ] Implement OCO (One-Cancels-Other) orders:
  - [ ] Place two orders, cancel one when other executes

**Note**: Trailing stops are implemented in `BacktestPortfolio`. Bracket and OCO orders pending.

##### 3.3 Portfolio Constraints
- [x] Enforce `max_open_positions` limit (in BacktestPortfolio):
  - [x] Skip new buy signals when at limit
  - [ ] Prioritize existing positions or new signals based on strategy (PENDING)

- [x] Track and enforce `max_daily_loss_percentage` and `max_daily_loss_absolute` (in BacktestPortfolio):
  - [x] Calculate daily P&L
  - [x] Stop trading for the day if limit exceeded
  - [x] Resume next trading day

**Note**: Core portfolio constraints implemented in `BacktestPortfolio`. Integration pending.

---

### Phase 4: Results Comparison & Validation
**Priority: Medium | Estimated Effort: 2 days | Status: ❌ NOT STARTED**

#### Goals
- Compare backtest results with live trading results
- Validate that backtest accurately predicts live performance
- Identify and fix discrepancies

#### Tasks

##### 4.1 Results Comparison Tool
**File: `api/controllers/backtestController.ts` or new `api/services/backtestComparisonService.ts`**

- [ ] Create function to compare backtest results with live trading session results
- [ ] Calculate metrics:
  - [ ] Return difference
  - [ ] Trade count difference
  - [ ] Win rate difference
  - [ ] Drawdown difference

##### 4.2 Validation Framework
- [ ] Create test cases comparing backtest vs live for same strategy/settings
- [ ] Document expected vs actual differences
- [ ] Identify sources of discrepancy:
  - [ ] Market conditions (backtest uses historical, live uses real-time)
  - [ ] Execution differences (slippage, commissions)
  - [ ] Data quality differences
  - [ ] Timing differences

##### 4.3 Reporting
- [ ] Add comparison view in frontend
- [ ] Show side-by-side metrics
- [ ] Highlight significant discrepancies
- [ ] Provide explanations for differences

---

### Phase 5: Performance Optimization
**Priority: Low | Estimated Effort: 1-2 days | Status: ❌ NOT STARTED**

#### Goals
- Optimize backtest execution speed
- Support parallel backtesting for multiple symbols
- Improve memory usage for large backtests

#### Tasks

##### 5.1 Parallel Execution
- [ ] Implement parallel backtest execution for multiple symbols
- [ ] Use worker threads or child processes
- [ ] Aggregate results from parallel executions

##### 5.2 Caching Improvements
- [ ] Optimize data caching for backtests
- [ ] Pre-populate cache for common date ranges
- [ ] Implement cache warming strategies

##### 5.3 Memory Optimization
- [ ] Stream data instead of loading all at once
- [ ] Implement pagination for large backtests
- [ ] Clean up unused data structures

---

## Implementation Priority

### Must Have (MVP)
1. **Phase 1: Custom Strategy Support** - Critical for user experience
2. **Phase 2: Trading Session Settings Integration** - Core requirement for accurate backtesting
3. **Phase 2.5: Session Settings Templates** - Essential for usability and workflow efficiency

### Should Have
4. **Phase 3: Enhanced Portfolio Simulation** - Improves accuracy
5. **Phase 4: Results Comparison & Validation** - Ensures quality

### Nice to Have
6. **Phase 5: Performance Optimization** - Improves user experience for large backtests

## Technical Considerations

### Architecture Decisions

1. **Custom Strategy Execution**
   - Use existing `CustomStrategyExecutor` for consistency
   - Ensure backtest uses same execution logic as live trading
   - Validate custom strategies before backtesting

2. **Settings Application**
   - Apply settings at portfolio level, not strategy level
   - Settings should override default backtest behavior
   - Maintain backward compatibility (backtests without settings should still work)
   - Templates provide reusable settings configurations that can be applied to any session

3. **Template System Design**
   - Templates are user-scoped (each user has their own templates)
   - Templates can be created from:
     - Manual configuration in settings form
     - Existing session settings (trading or backtest)
     - Duplication of another template
   - Templates are independent of sessions (deleting a template doesn't affect existing sessions)
   - Templates can be applied to both trading and backtesting sessions
   - Usage tracking helps users identify most-used templates

4. **Order Execution Simulation**
   - Simulate realistic market conditions
   - Use historical volume data for partial fills
   - Apply slippage based on trade size and volatility

5. **Data Requirements**
   - Ensure historical data includes volume for order execution simulation
   - May need to enhance data providers to include additional fields
   - Consider data quality impact on backtest accuracy

### Testing Strategy

1. **Unit Tests**
   - Test each portfolio management feature independently
   - Test order execution simulator with various scenarios
   - Test settings validation and application

2. **Integration Tests**
   - Test full backtest flow with custom strategies
   - Test backtest with various settings combinations
   - Compare results with known-good backtests

3. **Validation Tests**
   - Run backtest and live trading for same strategy/settings
   - Compare results and identify discrepancies
   - Document expected differences

## Success Metrics

### Phase 1 Success Criteria
- ✅ Custom strategies can be backtested through UI
- ✅ Backtest results are generated for custom strategies
- ✅ No errors when backtesting custom strategies
- ✅ Comprehensive test coverage for custom strategy backtesting

### Phase 2 Success Criteria
- ✅ Session settings infrastructure created (BacktestPortfolio, OrderExecutionSimulator)
- ✅ Session settings are applied during backtesting (All strategies integrated)
- ✅ Risk management rules are enforced (All strategies complete)
- ✅ Order execution constraints are simulated (All strategies complete)
- ✅ Backtest results reflect settings impact (All strategies complete)

### Phase 2.5 Success Criteria
- ✅ Users can create templates from session settings
- ✅ Templates can be applied to both trading and backtesting sessions
- ✅ Template management UI is intuitive and accessible
- ✅ Templates persist correctly and can be reused
- ✅ Usage statistics are tracked

### Overall Success Criteria
- ⚠️ Backtest results are within 10-15% of live trading results (PENDING - validation testing)
- ⚠️ Users can confidently use backtest results to predict live performance (PENDING - validation)
- ⚠️ All trading session settings are supported in backtesting (Infrastructure ready, integration pending)
- ✅ Custom strategies work seamlessly in both backtesting and live trading
- ✅ User education components created (order execution explanation, disclaimers)

## Future Enhancements

### Advanced Features (Post-MVP)
1. **Monte Carlo Simulation**: Run multiple backtests with randomized parameters
2. **Walk-Forward Analysis**: Test strategy robustness across different time periods
3. **Optimization**: Automatically find optimal parameter values
4. **Multi-Strategy Backtesting**: Test portfolio of strategies simultaneously
5. **Real-Time Backtesting**: Backtest on streaming data for paper trading validation

### Integration Opportunities
1. **Strategy Marketplace**: Allow users to backtest strategies from marketplace
2. **Performance Attribution**: Analyze which settings/parameters drive performance
3. **Risk Analytics**: Advanced risk metrics (VaR, CVaR, Sharpe ratio, etc.)
4. **Visualization**: Enhanced charts and graphs for backtest results
5. **Template Sharing**: Allow users to share templates with team members or make them public
6. **Template Marketplace**: Community-driven template library with ratings and reviews
7. **Template Analytics**: Track which templates perform best across different strategies
8. **Template Versioning**: Track changes to templates over time

## Documentation Requirements

### Code Documentation
- [x] Document all new classes and functions (BacktestPortfolio, OrderExecutionSimulator)
- [x] Add JSDoc comments for public APIs
- [ ] Update README files for new modules

### User Documentation
- [x] Create order execution explanation component
- [x] Create disclaimers page with comprehensive legal coverage
- [x] Add user education about backtesting vs live trading differences
- [ ] Update user guide with custom strategy backtesting
- [ ] Document session settings impact on backtests
- [ ] Create tutorial for accurate backtesting
- [ ] Add FAQ section for common backtest questions
- [ ] Document template creation and management workflow
- [ ] Create template best practices guide
- [ ] Add examples of common template configurations

### API Documentation
- [ ] Update API docs with new request/response formats
- [ ] Document settings structure and validation rules
- [ ] Provide examples for custom strategy backtesting

## Risk Mitigation

### Technical Risks
1. **Performance Degradation**: Backtests may run slower with additional features
   - *Mitigation*: Optimize critical paths, use parallel execution, implement caching

2. **Data Quality Issues**: Historical data may not match live data quality
   - *Mitigation*: Validate data quality, document known issues, provide data source options

3. **Settings Complexity**: Too many settings may confuse users
   - *Mitigation*: Provide sensible defaults, create presets, add tooltips and help text, enable templates for quick setup

4. **Template Management Overhead**: Users may create too many templates or forget which to use
   - *Mitigation*: Add template organization (folders, tags), usage statistics, search/filter capabilities, template recommendations

### User Experience Risks
1. **Overconfidence in Backtests**: Users may over-rely on backtest results
   - *Mitigation*: Add disclaimers, show confidence intervals, highlight limitations

2. **Settings Misconfiguration**: Users may configure settings incorrectly
   - *Mitigation*: Add validation, provide examples, show warnings for risky configurations, use templates to ensure correct configurations

3. **Template Confusion**: Users may not understand when to use templates vs manual configuration
   - *Mitigation*: Clear UI guidance, tooltips explaining templates, default to template selection, show template preview before applying

## Timeline Estimate

- **Phase 1**: 2-3 days ✅ **COMPLETED**
- **Phase 2**: 3-4 days ⚠️ **INFRASTRUCTURE COMPLETE** (Integration: 1-2 days remaining)
- **Phase 2.5**: 2-3 days ❌ **NOT STARTED**
- **Phase 3**: 2-3 days ❌ **NOT STARTED**
- **Phase 4**: 2 days ❌ **NOT STARTED**
- **Phase 5**: 1-2 days ❌ **NOT STARTED**

**Total Estimated Time**: 13-17 days for full implementation
**Time Spent**: ~3-4 days (Phase 1 + Phase 2 infrastructure)
**Remaining**: ~10-13 days for full implementation

**MVP Timeline** (Phases 1, 2, 2.5): 7-10 days
**MVP Progress**: ~40% complete (Phase 1 done, Phase 2 infrastructure done, integration pending)

## Getting Started

### Prerequisites
- Understanding of current backtest implementation
- Familiarity with custom strategy execution
- Knowledge of trading session settings structure

### Template Workflow Examples

#### Example 1: Creating and Using a Template
1. User starts a trading session and configures settings (stop loss: 5%, take profit: 10%, etc.)
2. User clicks "Save as Template" and names it "Conservative Day Trading"
3. User runs backtest and selects "Conservative Day Trading" template from dropdown
4. Settings are automatically applied to backtest
5. User can reuse this template for future sessions

#### Example 2: Creating Template from Session
1. User has a successful trading session with specific settings
2. User navigates to session details page
3. User clicks "Create Template from Session"
4. User names template "Proven Settings - Q1 2024"
5. Template is saved and can be applied to new sessions

#### Example 3: Template Management
1. User navigates to Settings > Session Templates
2. User sees list of all their templates with usage counts
3. User can edit, delete, or duplicate templates
4. User can see which templates are used most frequently
5. User organizes templates by trading style (day trading, swing trading, etc.)

### First Steps (Completed)
1. ✅ Review current backtest controller and script
2. ✅ Study `CustomStrategyExecutor` implementation
3. ✅ Review trading session settings structure
4. ✅ Review existing `TradingSessionSettingsDatabase` for reference
5. ✅ Set up test environment with sample custom strategies
6. ✅ Complete Phase 1 implementation

### Next Steps
1. Refactor strategy execution functions to use `BacktestPortfolio` and `OrderExecutionSimulator`
2. Integrate session settings into backtest execution flow
3. Add frontend UI for configuring session settings in backtests
4. Complete integration testing
5. Begin Phase 2.5 (Session Settings Templates)

---

**Last Updated**: December 2024
**Status**: Phase 1 Complete, Phase 2 Integration Complete
**Next Steps**: Integration testing and validation, Phase 2.5 (Session Settings Templates)

