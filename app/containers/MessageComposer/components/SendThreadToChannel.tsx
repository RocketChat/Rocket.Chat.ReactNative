import { StyleSheet, Text } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { type Subscription } from 'rxjs';
import { Q } from '@nozbe/watermelondb';

import TouchableOpacity from '../../../containers/TouchableOpacity';
import { useRoomContext } from '../../../views/RoomView/context';
import { useAlsoSendThreadToChannel, useMessageComposerApi } from '../context';
import { CustomIcon } from '../../CustomIcon';
import { useTheme } from '../../../theme';
import sharedStyles from '../../../views/Styles';
import I18n from '../../../i18n';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import database from '../../../lib/database';
import { compareServerVersion } from '../../../lib/methods/helpers';
import { useEmojiKeyboard } from '../hooks/useEmojiKeyboard';

export const SendThreadToChannel = (): React.ReactElement | null => {
	'use memo';

	const alsoSendThreadToChannel = useAlsoSendThreadToChannel();
	const { setAlsoSendThreadToChannel } = useMessageComposerApi();
	const { showEmojiSearchbar } = useEmojiKeyboard();
	const { tmid } = useRoomContext();
	const { colors } = useTheme();
	const subscription = useRef<Subscription | null>(null);
	const alsoSendThreadToChannelUserPref = useAppSelector(state => state.login.user.alsoSendThreadToChannel);
	const serverVersion = useAppSelector(state => state.server.version);

	useEffect(() => {
		if (!tmid) {
			return;
		}

		if (compareServerVersion(serverVersion, 'lowerThan', '5.0.0')) {
			setAlsoSendThreadToChannel(false);
			return;
		}

		if (alsoSendThreadToChannelUserPref === 'always') {
			setAlsoSendThreadToChannel(true);
			return;
		}
		if (alsoSendThreadToChannelUserPref === 'never') {
			setAlsoSendThreadToChannel(false);
			return;
		}

		/**
		 * "default" sends a to channel only in the first message of the thread.
		 * We check if the thread exists by observing/subscribing to the query with tmid.
		 * If it doesn't exist, it means that this is the first message of the thread. So it's true.
		 * Otherwise, it's false.
		 *  */
		if (alsoSendThreadToChannelUserPref === 'default') {
			const db = database.active;
			const observable = db.get('threads').query(Q.where('id', tmid)).observe();
			subscription.current = observable.subscribe(result => {
				setAlsoSendThreadToChannel(!result.length);
			});
		}

		return () => {
			subscription.current?.unsubscribe();
		};
	}, [tmid, alsoSendThreadToChannelUserPref, serverVersion, setAlsoSendThreadToChannel]);

	if (!tmid || showEmojiSearchbar) {
		return null;
	}

	return (
		<TouchableOpacity
			style={styles.container}
			onPress={() => setAlsoSendThreadToChannel(!alsoSendThreadToChannel)}
			testID='message-composer-send-to-channel'>
			<CustomIcon
				testID={alsoSendThreadToChannel ? 'send-to-channel-checked' : 'send-to-channel-unchecked'}
				name={alsoSendThreadToChannel ? 'checkbox-checked' : 'checkbox-unchecked'}
				size={24}
				color={alsoSendThreadToChannel ? colors.buttonBackgroundPrimaryDefault : colors.fontDefault}
			/>
			<Text style={[styles.text, { color: colors.fontDefault }]}>{I18n.t('Message_composer_Send_to_channel')}</Text>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12
	},
	text: {
		fontSize: 14,
		marginLeft: 8,
		...sharedStyles.textRegular
	}
});
