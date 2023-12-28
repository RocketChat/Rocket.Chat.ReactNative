import React from 'react';
import { Switch as SwitchRN } from 'react-native';

import { useTheme } from '../theme';

export const SWITCH_TRACK_COLOR = {
    false: '#767577',
    true: '#81b0ff'
};
  

interface ISwitch {
  value: boolean;
  onValueChange: (value: boolean) => void;
  testID?: string;
  disabled?: boolean;
  style?: object;
  trackColor?: typeof SWITCH_TRACK_COLOR;
}

const Switch = ({ value, onValueChange, testID, disabled, style, trackColor }: ISwitch) => {
  const { colors } = useTheme();

  return (
    <SwitchRN
      value={value}
      style={style}
      onValueChange={onValueChange}
      thumbColor={value ? colors.actionTintColor : colors.auxiliaryText}
      trackColor={trackColor?? SWITCH_TRACK_COLOR}
      disabled={disabled}
      testID={testID}
    />
  );
};

export default Switch;
