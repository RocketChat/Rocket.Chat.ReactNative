import React from 'react';
import { useWindowDimensions } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import Avatar from '../../containers/Avatar';
import { useAppNavigation } from '../../lib/hooks/navigation';
import { HeaderBackButton } from '../../containers/Header/components/HeaderBackButton';

const styles = StyleSheet.create({
	avatar: {
		borderRadius: 10
	}
});

interface ILeftButtonsProps {
	rid?: string;
	tmid?: string;
	unreadsCount: number | null;
	baseUrl: string;
	userId?: string;
	token?: string;
	title?: string;
	t: string;
	goRoomActionsView: Function;
	isMasterDetail: boolean;
}

const LeftButtons = ({
	rid,
	tmid,
	unreadsCount,
	baseUrl,
	userId,
	token,
	title,
	t,
	goRoomActionsView,
	isMasterDetail
}: ILeftButtonsProps): React.ReactElement | null => {
	const { goBack } = useAppNavigation();
	const onPress = () => goRoomActionsView();
	const { fontScale } = useWindowDimensions();

	if (!isMasterDetail || tmid) {
		let label = ' ';
		let labelLength = 1;
		let marginLeft = 0;
		let fontSize = 0;
		if (unreadsCount) {
			label = unreadsCount > 99 ? '+99' : unreadsCount.toString() || ' ';
			labelLength = label.length ? label.length : 1;
			marginLeft = -4 * labelLength;
			fontSize = labelLength > 1 ? 14 : 17;
		}
		return <HeaderBackButton label={label} onPress={goBack} labelStyle={{ fontSize: fontSize * fontScale, marginLeft }} />;
	}

	if (baseUrl && userId && token) {
		return <Avatar rid={rid} text={title} size={30} type={t} style={styles.avatar} onPress={onPress} />;
	}
	return null;
};

export default LeftButtons;
