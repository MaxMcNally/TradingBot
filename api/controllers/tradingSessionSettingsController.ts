/**
 * Trading Session Settings Controller
 * 
 * Handles HTTP requests for trading session settings
 * Includes proper authorization and validation
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { TradingSessionSettingsDatabase } from '../database/tradingSessionSettingsDatabase';
import { TradingSessionSettingsService } from '../services/tradingSessionSettingsService';
import { TradingDatabase } from '../../src/database/tradingSchema';

/**
 * Get settings for a trading session
 * 
 * GET /api/trading/sessions/:sessionId/settings
 */
export const getSessionSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    const userId = req.user?.id;

    if (isNaN(sessionId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid session ID' 
      });
    }

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    // Verify session belongs to user
    const session = await TradingDatabase.getTradingSessionById(sessionId);
    if (!session) {
      return res.status(404).json({ 
        success: false,
        message: 'Trading session not found' 
      });
    }

    if (session.user_id !== userId) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied to this trading session' 
      });
    }

    // Get settings
    const settings = await TradingSessionSettingsDatabase.getSettingsBySessionId(sessionId);

    if (!settings) {
      return res.status(404).json({ 
        success: false,
        message: 'Settings not found for this session' 
      });
    }

    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Error getting session settings:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
};

/**
 * Update settings for a trading session
 * 
 * PATCH /api/trading/sessions/:sessionId/settings
 */
export const updateSessionSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    const userId = req.user?.id;
    const updates = req.body;

    if (isNaN(sessionId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid session ID' 
      });
    }

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    // Verify session belongs to user
    const session = await TradingDatabase.getTradingSessionById(sessionId);
    if (!session) {
      return res.status(404).json({ 
        success: false,
        message: 'Trading session not found' 
      });
    }

    if (session.user_id !== userId) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied to this trading session' 
      });
    }

    // Only allow updates to active sessions
    if (session.status !== 'ACTIVE') {
      return res.status(400).json({ 
        success: false,
        message: 'Can only update settings for active sessions' 
      });
    }

    // Validate updates
    const validation = TradingSessionSettingsService.validateSettings(updates);
    if (!validation.valid) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    // Update settings
    const updatedSettings = await TradingSessionSettingsDatabase.updateSettings(sessionId, updates);

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: updatedSettings,
    });
  } catch (error) {
    console.error('Error updating session settings:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
};

/**
 * Create default settings for a trading session
 * 
 * POST /api/trading/sessions/:sessionId/settings
 */
export const createSessionSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    const userId = req.user?.id;
    const partialSettings = req.body.settings || {};

    if (isNaN(sessionId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid session ID' 
      });
    }

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    // Verify session belongs to user
    const session = await TradingDatabase.getTradingSessionById(sessionId);
    if (!session) {
      return res.status(404).json({ 
        success: false,
        message: 'Trading session not found' 
      });
    }

    if (session.user_id !== userId) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied to this trading session' 
      });
    }

    // Check if settings already exist
    const existingSettings = await TradingSessionSettingsDatabase.getSettingsBySessionId(sessionId);
    if (existingSettings) {
      return res.status(400).json({ 
        success: false,
        message: 'Settings already exist for this session. Use PATCH to update.' 
      });
    }

    // Validate partial settings
    if (Object.keys(partialSettings).length > 0) {
      const validation = TradingSessionSettingsService.validateSettings(partialSettings);
      if (!validation.valid) {
        return res.status(400).json({ 
          success: false,
          message: 'Validation failed',
          errors: validation.errors,
        });
      }
    }

    // Merge with defaults
    const settings = TradingSessionSettingsService.mergeWithDefaults(sessionId, partialSettings);

    // Create settings
    const createdSettings = await TradingSessionSettingsDatabase.createSettings(settings);

    res.status(201).json({
      success: true,
      message: 'Settings created successfully',
      settings: createdSettings,
    });
  } catch (error) {
    console.error('Error creating session settings:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
};

