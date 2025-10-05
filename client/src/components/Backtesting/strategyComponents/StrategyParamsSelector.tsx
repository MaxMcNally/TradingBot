import React from 'react';
import { Box, Divider } from '@mui/material';
import { BacktestFormData } from '../Backtesting.types';
import {
  MeanReversionParams,
  MovingAverageCrossoverParams,
  MomentumParams,
  BollingerBandsParams,
  BreakoutParams
} from './index';

interface StrategyParamsSelectorProps {
  strategy: string;
  formData: BacktestFormData;
  onInputChange: (field: keyof BacktestFormData, value: string | number) => void;
}

const StrategyParamsSelector: React.FC<StrategyParamsSelectorProps> = ({ 
  strategy, 
  formData, 
  onInputChange 
}) => {
  const renderStrategyParams = () => {
    console.log("Rendering Strategy Params"); 
    console.log(strategy);
    
    switch (strategy) {
      case 'meanReversion':
        return <MeanReversionParams formData={formData} onInputChange={onInputChange} />;
      
      case 'movingAverageCrossover':
        return <MovingAverageCrossoverParams formData={formData} onInputChange={onInputChange} />;
      
      case 'momentum':
        return <MomentumParams formData={formData} onInputChange={onInputChange} />;
      
      case 'bollingerBands':
        return <BollingerBandsParams formData={formData} onInputChange={onInputChange} />;
      
      case 'breakout':
        return <BreakoutParams formData={formData} onInputChange={onInputChange} />;
      
      default:
        return <MeanReversionParams formData={formData} onInputChange={onInputChange} />;
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
