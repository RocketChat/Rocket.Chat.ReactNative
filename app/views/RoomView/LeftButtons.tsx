import React, { useCallback } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HeaderBackButton } from '@react-navigation/elements';

import { themes } from '../../lib/constants';
import Avatar from '../../containers/Avatar';
import { ChatsStackParamList } from '../../stacks/types';
import { TSupportedThemes } from '../../theme';
import { isIOS } from '../../lib/methods/helpers';

const styles = StyleSheet.create({
	container: {
		...Platform.select({
			ios: {
				minWidth: 60
			}
		})
	},
	avatar: {
		borderRadius: 10,
		marginHorizontal: 15
	}
});

interface ILeftButtonsProps {
	rid?: string;
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
	rid,
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
				labelVisible={isIOS}
				onPress={onPress}
				tintColor={themes[theme].headerTintColor}
				labelStyle={{ fontSize, marginLeft }}
				style={styles.container}
				testID='header-back'
			/>
		);
	}

	if (baseUrl && userId && token) {
		return <Avatar rid={rid} text={title} size={30} type={t} style={styles.avatar} onPress={onPress} />;
	}
	return null;
};

export default LeftButtons;
