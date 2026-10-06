import { StatusBar as StatusBarRN } from 'react-native';

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
	return <StatusBarRN animated translucent backgroundColor='transparent' barStyle={`${barStyle}-content`} />;
};

export default StatusBar;
