import React from 'react';
import { View } from 'react-native';

import { useCallStore } from '../../lib/services/voip/useCallStore';
import CallerInfo from './components/CallerInfo';
import { styles } from './styles';
import { useTheme } from '../../theme';
import { CallButtons } from './components/CallButtons';
import { useCallLayoutMode } from './useCallLayoutMode';

const CallView = (): React.ReactElement | null => {
	'use memo';

	const { colors } = useTheme();
	const call = useCallStore(state => state.call);
	const { layoutMode } = useCallLayoutMode();

	if (!call) {
		return null;
	}

	return (
		<View style={[styles.contentContainer, { backgroundColor: colors.surfaceLight }]}>
			<CallerInfo />
			<CallButtons layoutMode={layoutMode} />
		</View>
	);
};

export default CallView;
