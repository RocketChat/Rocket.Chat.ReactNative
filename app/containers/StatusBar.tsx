import React from 'react';
import { StatusBar as StatusBarRN } from 'expo-status-bar';
import { SystemBars } from "react-native-edge-to-edge";

import { useTheme } from '../theme';
import { Platform } from 'react-native';

interface IStatusBar {
	barStyle?: 'light' | 'dark';
	backgroundColor?: string;
}

const StatusBar = ({ barStyle, backgroundColor }: IStatusBar) => {
	const { theme, colors } = useTheme();
	if (!barStyle) {
		barStyle = 'light';
		if (theme === 'light') {
			barStyle = 'dark';
		}
	}
    
    if(Platform.OS === 'android' && Platform.Version >= 35){
        return <SystemBars style={barStyle} />
    }

	return <StatusBarRN backgroundColor={backgroundColor ?? colors.surfaceNeutral} animated style={barStyle} />
};

export default StatusBar;
