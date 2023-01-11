import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useDispatch } from 'react-redux';

import { MessageTypeLoad, themes } from '../../../lib/constants';
import { MessageType, SubscriptionType } from '../../../definitions';
import { useTheme } from '../../../theme';
import Touch from '../../../containers/Touch';
import sharedStyles from '../../Styles';
import I18n from '../../../i18n';
import { roomHistoryRequest } from '../../../actions/room';
import { useAppSelector } from '../../../lib/hooks';

const styles = StyleSheet.create({
	button: {
		paddingVertical: 16,
		alignItems: 'center',
		justifyContent: 'center'
	},
	text: {
		fontSize: 16,
		...sharedStyles.textMedium
	}
});

const LoadMore = React.memo(
	({
		rid,
		t,
		tmid,
		loaderId,
		type,
		runOnRender
	}: {
		rid: string;
		t: SubscriptionType;
		tmid?: string;
		loaderId: string;
		type: MessageType;
		runOnRender: boolean;
	}): React.ReactElement => {
		const { theme } = useTheme();
		const dispatch = useDispatch();
		const loading = useAppSelector(state => state.room.historyLoaders.find(historyLoader => historyLoader === loaderId));

		const handleLoad = () => dispatch(roomHistoryRequest({ rid, t, tmid, loaderId }));

		useEffect(() => {
			if (runOnRender) {
				handleLoad();
			}
		}, []);

		let text = 'Load_More';
		if (type === MessageTypeLoad.NEXT_CHUNK) {
			text = 'Load_Newer';
		}
		if (type === MessageTypeLoad.PREVIOUS_CHUNK) {
			text = 'Load_Older';
		}

		return (
			<Touch onPress={handleLoad} style={styles.button} enabled={!loading}>
				{loading ? (
					<ActivityIndicator color={themes[theme].auxiliaryText} />
				) : (
					<Text style={[styles.text, { color: themes[theme].titleText }]}>{I18n.t(text)}</Text>
				)}
			</Touch>
		);
	}
);

export default LoadMore;
