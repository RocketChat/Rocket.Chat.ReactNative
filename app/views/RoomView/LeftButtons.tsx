import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { HeaderBackButton, StackNavigationProp } from '@react-navigation/stack';

import { themes } from '../../constants/colors';
import Avatar from '../../containers/Avatar';
import { ChatsStackParamList } from '../../stacks/types';

const styles = StyleSheet.create({
	avatar: {
		borderRadius: 10,
		marginHorizontal: 16
	}
});

interface ILeftButtonsProps {
	tmid: string;
	unreadsCount: number;
	navigation: StackNavigationProp<ChatsStackParamList, 'RoomView'>;
	baseUrl: string;
	userId: string;
	token: string;
	title: string;
	t: string;
	theme: string;
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
	if (!isMasterDetail || tmid) {
		const onPress = () => navigation.goBack();
		const label = unreadsCount > 99 ? '+99' : unreadsCount.toString() || ' ';
		const labelLength = label.length ? label.length : 1;
		const marginLeft = -2 * labelLength;
		const fontSize = labelLength > 1 ? 14 : 17;
		return (
			<HeaderBackButton
				label={label}
				onPress={onPress}
				tintColor={themes[theme].headerTintColor}
				labelStyle={{ fontSize, marginLeft }}
			/>
		);
	}
	const onPress = useCallback(() => goRoomActionsView(), []);

	if (baseUrl && userId && token) {
		return <Avatar text={title} size={30} type={t} style={styles.avatar} onPress={onPress} />;
	}
	return null;
};

export default LeftButtons;
