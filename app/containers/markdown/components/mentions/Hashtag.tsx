import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';

import i18n from '../../../../i18n';
import { themes } from '../../../../lib/constants/colors';
import { ROOM_MENTIONS_PREFERENCES_KEY } from '../../../../lib/constants/keys';
import { getSubscriptionByRoomId } from '../../../../lib/database/services/Subscription';
import { useAppSelector } from '../../../../lib/hooks/useAppSelector';
import { useUserPreferences } from '../../../../lib/methods/userPreferences';
import { showErrorAlert } from '../../../../lib/methods/helpers/info';
import { goRoom } from '../../../../lib/methods/helpers/goRoom';
import { getRoomInfo } from '../../../../lib/services/restApi';
import { useTheme } from '../../../../theme';
import { sendLoadingEvent } from '../../../Loading';
import { IUserChannel } from '../../interfaces';
import styles from '../../styles';

interface IHashtag {
	hashtag: string;
	navToRoomInfo?: Function;
	style?: StyleProp<TextStyle>[];
	channels?: IUserChannel[];
}

const Hashtag = React.memo(({ hashtag, channels, navToRoomInfo, style = [] }: IHashtag) => {
	const { theme } = useTheme();
	const [roomsWithHashTagSymbol] = useUserPreferences<boolean>(ROOM_MENTIONS_PREFERENCES_KEY);
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);
	const preffix = roomsWithHashTagSymbol ? '#' : '';
	const handlePress = async () => {
		const index = channels?.findIndex(channel => channel.name === hashtag);
		if (typeof index !== 'undefined' && navToRoomInfo) {
			const navParam = {
				t: 'c',
				rid: channels?.[index]._id
			};
			const room = navParam.rid && (await getSubscriptionByRoomId(navParam.rid));
			if (room) {
				goRoom({ item: room, isMasterDetail });
			} else if (navParam.rid) {
				sendLoadingEvent({ visible: true });
				try {
					await getRoomInfo(navParam.rid);
					sendLoadingEvent({ visible: false });
					navToRoomInfo(navParam);
				} catch (error) {
					sendLoadingEvent({ visible: false });
					showErrorAlert(i18n.t('The_room_does_not_exist'), i18n.t('Room_not_found'));
				}
			}
		}
	};

	if (channels && channels.length && channels.findIndex(channel => channel.name === hashtag) !== -1) {
		return (
			<Text
				style={[
					styles.mention,
					{
						color: themes[theme].fontInfo
					},
					...style
				]}
				onPress={handlePress}>
				{`${preffix}${hashtag}`}
			</Text>
		);
	}
	return <Text style={[styles.text, { color: themes[theme].fontDefault }, ...style]}>{`#${hashtag}`}</Text>;
});

export default Hashtag;
