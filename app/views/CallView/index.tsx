import React from 'react';
import { useWindowDimensions, View } from 'react-native';

import { useCallStore } from '../../lib/services/voip/useCallStore';
import CallerInfo from './components/CallerInfo';
import { styles } from './styles';
import { useTheme } from '../../theme';
import { CallButtons } from './components/CallButtons';
import { MIN_WIDTH_MASTER_DETAIL_LAYOUT } from '../../lib/constants/tablet';

export type LayoutMode = 'narrow' | 'wide';

const CallView = (): React.ReactElement | null => {
	'use memo';

	const { colors } = useTheme();
	const call = useCallStore(state => state.call);
	const { width } = useWindowDimensions();
	const layoutMode: LayoutMode = width >= MIN_WIDTH_MASTER_DETAIL_LAYOUT ? 'wide' : 'narrow';

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
