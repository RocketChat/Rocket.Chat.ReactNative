import React from 'react';
import { View } from 'react-native';

import { useCallStore } from '../../lib/services/voip/useCallStore';
import CallerInfo from './components/CallerInfo';
import { styles } from './styles';
import { useTheme } from '../../theme';
import { CallButtons } from './components/CallButtons';
import { useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

const CallView = (): React.ReactElement | null => {
	'use memo';

	const { colors } = useTheme();
	const call = useCallStore(state => state.call);
	const { width, height } = useResponsiveLayout();
	const isLandscape = width > height;

	if (!call) {
		return null;
	}

	return (
		<View
			testID='call-view-container'
			style={[
				styles.contentContainer,
				isLandscape && styles.contentContainerLandscape,
				{ backgroundColor: colors.surfaceLight }
			]}>
			<CallerInfo />
			<CallButtons />
		</View>
	);
};

export default CallView;
