import { StatusBar as StatusBarRN } from 'expo-status-bar';

import { useTheme } from '../theme';

interface IStatusBar {
	barStyle?: 'light' | 'dark';
}

const StatusBar = ({ barStyle }: IStatusBar) => {
	const { theme } = useTheme();
	if (!barStyle) {
		barStyle = 'light';
		if (theme === 'light') {
			barStyle = 'dark';
		}
	}
	return <StatusBarRN animated style={barStyle} />;
};

export default StatusBar;
