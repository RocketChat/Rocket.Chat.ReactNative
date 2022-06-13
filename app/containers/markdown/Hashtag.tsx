import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useTheme } from '../../theme';
import { IUserChannel } from './interfaces';
import styles from './styles';
import { getSubscriptionByRoomId } from '../../lib/database/services/Subscription';
import { ChatsStackParamList } from '../../stacks/types';
import { useAppSelector } from '../../lib/hooks';
import { goRoom } from '../../lib/methods/helpers/goRoom';

interface IHashtag {
	hashtag: string;
	navToRoomInfo?: Function;
	style?: StyleProp<TextStyle>[];
	channels?: IUserChannel[];
	testID: string;
}

const Hashtag = React.memo(({ hashtag, channels, navToRoomInfo, testID, style = [] }: IHashtag) => {
	const { colors } = useTheme();
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);
	const navigation = useNavigation<StackNavigationProp<ChatsStackParamList, 'RoomView'>>();

	const handlePress = async () => {
		const index = channels?.findIndex(channel => channel.name === hashtag);
		if (typeof index !== 'undefined' && navToRoomInfo) {
			const navParam = {
				t: 'c',
				rid: channels?.[index]._id
			};
			const room = navParam.rid && (await getSubscriptionByRoomId(navParam.rid));
			if (room) {
				goRoom({ item: room, isMasterDetail, navigationMethod: isMasterDetail ? navigation.replace : navigation.push });
			} else {
				navToRoomInfo(navParam);
			}
		}
	};

	if (channels && channels.length && channels.findIndex(channel => channel.name === hashtag) !== -1) {
		return (
			<Text
				style={[
					styles.mention,
					{
						color: colors.mentionOtherColor
					},
					...style
				]}
				onPress={handlePress}
				testID={`${testID}-hashtag-channels`}>
				{`#${hashtag}`}
			</Text>
		);
	}
	return (
		<Text
			style={[styles.text, { color: colors.bodyText }, ...style]}
			testID={`${testID}-hashtag-without-channels`}>{`#${hashtag}`}</Text>
	);
});

export default Hashtag;
