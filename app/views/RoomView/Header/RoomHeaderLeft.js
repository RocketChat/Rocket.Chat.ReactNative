import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet } from 'react-native';
import { HeaderBackButton } from '@react-navigation/stack';

import { themes } from '../../../constants/colors';
import Avatar from '../../../containers/Avatar';

const styles = StyleSheet.create({
	avatar: {
		borderRadius: 10,
		marginHorizontal: 16
	}
});

const RoomHeaderLeft = React.memo(({
	tmid, unreadsCount, navigation, baseUrl, userId, token, title, t, theme, goRoomActionsView, isMasterDetail
}) => {
	if (!isMasterDetail || tmid) {
		const onPress = useCallback(() => navigation.goBack());
		return (
			<HeaderBackButton
				label={unreadsCount > 999 ? '+999' : unreadsCount || ' '}
				onPress={onPress}
				tintColor={themes[theme].headerTintColor}
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
				baseUrl={baseUrl}
				style={styles.avatar}
				userId={userId}
				token={token}
				onPress={onPress}
			/>
		);
	}
	return null;
});

RoomHeaderLeft.propTypes = {
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

export default RoomHeaderLeft;
