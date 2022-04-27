import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { HeaderBackButton, StackNavigationProp } from '@react-navigation/stack';

import { themes } from '../../lib/constants';
import Avatar from '../../containers/Avatar';
import { ChatsStackParamList } from '../../stacks/types';
import { TSupportedThemes } from '../../theme';

const styles = StyleSheet.create({
	avatar: {
		borderRadius: 10,
		marginHorizontal: 16
	}
});

interface ILeftButtonsProps {
	tmid?: string;
	unreadsCount: number | null;
	navigation: StackNavigationProp<ChatsStackParamList, 'RoomView'>;
	baseUrl: string;
	userId?: string;
	token?: string;
	title?: string;
	t: string;
	theme: TSupportedThemes;
	goRoomActionsView: Function;
	isMasterDetail: boolean;
}

const LeftButtons = ({
	tmid,
	unreadsCount,
	navigation,
	baseUrl,
	userId,
	token,
	title,
	t,
	theme,
	goRoomActionsView,
	isMasterDetail
}: ILeftButtonsProps): React.ReactElement | null => {
	const onPress = useCallback(() => goRoomActionsView(), []);

	if (!isMasterDetail || tmid) {
		const onPress = () => navigation.goBack();
		let label = ' ';
		let labelLength = 1;
		let marginLeft = 0;
		let fontSize = 0;
		if (unreadsCount) {
			label = unreadsCount > 99 ? '+99' : unreadsCount.toString() || ' ';
			labelLength = label.length ? label.length : 1;
			marginLeft = -2 * labelLength;
			fontSize = labelLength > 1 ? 14 : 17;
		}
		return (
			<HeaderBackButton
				label={label}
				onPress={onPress}
				tintColor={themes[theme].headerTintColor}
				labelStyle={{ fontSize, marginLeft }}
			/>
		);
	}

	if (baseUrl && userId && token) {
		return <Avatar text={title} size={30} type={t} style={styles.avatar} onPress={onPress} />;
	}
	return null;
};

export default LeftButtons;
