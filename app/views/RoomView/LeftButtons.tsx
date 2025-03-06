import { HeaderBackButton } from '@react-navigation/elements';
import React, { useCallback } from 'react';
import { Platform, StyleSheet } from 'react-native';

import Avatar from '../../containers/Avatar';
import { themes } from '../../lib/constants';
import { useAppNavigation } from '../../lib/hooks/navigation';
import { isIOS } from '../../lib/methods/helpers';
import { TSupportedThemes } from '../../theme';

const styles = StyleSheet.create({
	container: {
		marginLeft: -15,
		...Platform.select({
			ios: {
				minWidth: 34
			}
		})
	},
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
	theme: TSupportedThemes;
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
	theme,
	goRoomActionsView,
	isMasterDetail
}: ILeftButtonsProps): React.ReactElement | null => {
	const { goBack } = useAppNavigation();
	const onPress = useCallback(() => goRoomActionsView(), []);

	if (!isMasterDetail || tmid) {
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
				onPress={goBack}
				tintColor={themes[theme].fontDefault}
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
