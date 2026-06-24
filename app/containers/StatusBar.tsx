import { Platform } from 'react-native';
import { StatusBar as StatusBarRN } from 'expo-status-bar';
import { NavigationBar } from '@zoontek/react-native-navigation-bar';

import { useTheme } from '../theme';

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
	return (
		<>
			<StatusBarRN backgroundColor={backgroundColor ?? colors.surfaceNeutral} animated style={barStyle} />
			{Platform.OS === 'android' ? <NavigationBar barStyle={barStyle === 'dark' ? 'dark-content' : 'light-content'} /> : null}
		</>
	);
};

export default StatusBar;
