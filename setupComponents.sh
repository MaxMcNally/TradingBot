#!/bin/bash
set -e

COMPONENTS=("Dashboard" "Login" "Signup" "Settings" "Backtesting")
COMPONENT_DIR="client/src/components"

mkdir -p $COMPONENT_DIR

for comp in "${COMPONENTS[@]}"; do
  cat > "$COMPONENT_DIR/$comp.jsx" <<EOL
import React from 'react';
import { Box, Typography } from '@mui/material';

const $comp = () => {
  return (
    <Box>
      <Typography variant="h4">$comp Component</Typography>
    </Box>
  );
};

export default $comp;
EOL
done

echo "Components created: ${COMPONENTS[*]}"
