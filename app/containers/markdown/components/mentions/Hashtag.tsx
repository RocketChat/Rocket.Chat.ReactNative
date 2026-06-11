import { useContext, memo } from 'react';
import { Text } from 'react-native';

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
import { type IUserChannel } from '../../interfaces';
import styles from '../../styles';
import MarkdownContext from '../../contexts/MarkdownContext';

interface IHashtag {
	hashtag: string;
	navToRoomInfo?: Function;
	channels?: IUserChannel[];
}

const Hashtag = memo(({ hashtag, channels, navToRoomInfo }: IHashtag) => {
	const { theme } = useTheme();
	const { textStyle } = useContext(MarkdownContext);
	const [roomsWithHashTagSymbol] = useUserPreferences<boolean>(ROOM_MENTIONS_PREFERENCES_KEY, false);
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
					...(textStyle ? [textStyle] : []),
					{
						color: themes[theme].fontInfo
					}
				]}
				onPress={handlePress}>
				{`${preffix}${hashtag}`}
			</Text>
		);
	}
	return (
		<Text style={[styles.text, ...(textStyle ? [textStyle] : []), { color: themes[theme].fontDefault }]}>{`#${hashtag}`}</Text>
	);
});

export default Hashtag;
