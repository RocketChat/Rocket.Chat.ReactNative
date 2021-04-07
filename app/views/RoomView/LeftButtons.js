import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet } from 'react-native';
import { HeaderBackButton } from '@react-navigation/stack';

import { themes } from '../../constants/colors';
import Avatar from '../../containers/Avatar';

const styles = StyleSheet.create({
	avatar: {
		borderRadius: 10,
		marginHorizontal: 16
	}
});

const LeftButtons = React.memo(({
	tmid, unreadsCount, navigation, baseUrl, userId, token, title, t, theme, goRoomActionsView, isMasterDetail
}) => {
	if (!isMasterDetail || tmid) {
		const onPress = useCallback(() => navigation.goBack());
		const label = unreadsCount > 99 ? '+99' : unreadsCount || ' ';
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
		return (
			<Avatar
				text={title}
				size={30}
				type={t}
				style={styles.avatar}
				onPress={onPress}
			/>
		);
	}
	return null;
});

LeftButtons.propTypes = {
	tmid: PropTypes.string,
	unreadsCount: PropTypes.number,
	navigation: PropTypes.object,
	baseUrl: PropTypes.string,
	userId: PropTypes.string,
	token: PropTypes.string,
	title: PropTypes.string,
	t: PropTypes.string,
	theme: PropTypes.string,
	goRoomActionsView: PropTypes.func,
	isMasterDetail: PropTypes.bool
};

export default LeftButtons;
