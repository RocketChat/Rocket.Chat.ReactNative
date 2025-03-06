import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';

import i18n from '../../../../i18n';
import { themes } from '../../../../lib/constants';
import { getSubscriptionByRoomId } from '../../../../lib/database/services/Subscription';
import { useAppSelector } from '../../../../lib/hooks';
import { showErrorAlert } from '../../../../lib/methods/helpers';
import { goRoom } from '../../../../lib/methods/helpers/goRoom';
import { Services } from '../../../../lib/services';
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
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);

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
					await Services.getRoomInfo(navParam.rid);
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
				{`#${hashtag}`}
			</Text>
		);
	}
	return <Text style={[styles.text, { color: themes[theme].fontInfo }, ...style]}>{`#${hashtag}`}</Text>;
});

export default Hashtag;
