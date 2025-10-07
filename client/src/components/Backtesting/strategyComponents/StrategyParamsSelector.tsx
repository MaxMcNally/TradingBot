import React from 'react';
import { Box, Divider } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { BacktestFormData } from '../Backtesting.types';
import {
  MeanReversionParams,
  MovingAverageCrossoverParams,
  MomentumParams,
  BollingerBandsParams,
  BreakoutParams
} from './index';

const StrategyParamsSelector: React.FC = () => {
  const { watch } = useFormContext<BacktestFormData>();
  const strategy = watch('strategy');

  const renderStrategyParams = () => {
    switch (strategy) {
      case 'meanReversion':
        return <MeanReversionParams />;
      case 'movingAverageCrossover':
        return <MovingAverageCrossoverParams />;
      case 'momentum':
        return <MomentumParams />;
      case 'bollingerBands':
        return <BollingerBandsParams />;
      case 'breakout':
        return <BreakoutParams />;
      default:
        return <MeanReversionParams />;
    }
  };

  return (
    <Box>
      <Divider sx={{ mb: 2 }} />
      {renderStrategyParams()}
    </Box>
  );
};

export default StrategyParamsSelector;
