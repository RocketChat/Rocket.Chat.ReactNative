import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useDispatch } from 'react-redux';

import { MessageTypeLoad } from '../../../lib/constants';
import { MessageType, RoomType } from '../../../definitions';
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
		loaderId,
		type,
		runOnRender
	}: {
		rid: string;
		t: RoomType;
		loaderId: string;
		type: MessageType;
		runOnRender: boolean;
	}): React.ReactElement => {
		const { colors } = useTheme();
		const dispatch = useDispatch();
		const loading = useAppSelector(state => state.room.historyLoaders.some(historyLoader => historyLoader === loaderId));

		const handleLoad = () => dispatch(roomHistoryRequest({ rid, t, loaderId }));

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
					<ActivityIndicator color={colors.auxiliaryText} />
				) : (
					<Text style={[styles.text, { color: colors.titleText }]}>{I18n.t(text)}</Text>
				)}
			</Touch>
		);
	}
);

export default LoadMore;
