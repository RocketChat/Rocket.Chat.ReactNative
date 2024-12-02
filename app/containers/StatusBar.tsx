import React from 'react';
import { SystemBars } from "react-native-edge-to-edge";

import { useTheme } from '../theme';

const StatusBar = () => {
	const { theme } = useTheme();
	
	return <SystemBars style={theme === 'light' ? 'dark' : 'light'} />
};

export default StatusBar;
