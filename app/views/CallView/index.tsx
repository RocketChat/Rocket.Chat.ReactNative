import React from 'react';

import { useCallStore } from '../../lib/services/voip/useCallStore';
import CallerInfo from './components/CallerInfo';
import { styles } from './styles';
import { useTheme } from '../../theme';
import { CallButtons } from './components/CallButtons';
import SafeAreaView from '../../containers/SafeAreaView';

const CallView = (): React.ReactElement | null => {
	'use memo';

	const { colors } = useTheme();
	const call = useCallStore(state => state.call);
	const nativeAcceptedCallId = useCallStore(state => state.nativeAcceptedCallId);
	const isConnecting = !call && !!nativeAcceptedCallId;

	if (!call && !isConnecting) {
		return null;
	}

	return (
		<SafeAreaView testID='call-view-container' style={[styles.contentContainer, { backgroundColor: colors.surfaceLight }]}>
			<CallerInfo isConnecting={isConnecting} />
			{isConnecting ? null : <CallButtons />}
		</SafeAreaView>
	);
};

export default CallView;
