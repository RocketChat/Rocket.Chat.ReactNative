import React from 'react';
import { Switch as NativeSwitch, Platform } from 'react-native';
import { appColors } from '../theme/colors';

export const Switch: React.FunctionComponent<any> = (props) => (<NativeSwitch
    trackColor={{ true: appColors.lightPrimary }}
    thumbColor={appColors.primary}  
    {...props}
/>)