import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet } from 'react-native';
import { HeaderBackButton } from 'react-navigation-stack';

import { isIOS } from '../../../utils/deviceInfo';
import { themes } from '../../../constants/colors';
import Avatar from '../../../containers/Avatar';

const styles = StyleSheet.create({
	avatar: {
		borderRadius: 10,
		marginHorizontal: 16
	}
});

const RoomHeaderLeft = ({
	tmid, unreadsCount, navigation, baseUrl, userId, token, title, t, theme, goRoomActionsView, split
}) => {
	if (!split || tmid) {
		return (
			<HeaderBackButton
				title={unreadsCount > 999 ? '+999' : unreadsCount || ' '}
				backTitleVisible={isIOS}
				onPress={() => navigation.goBack()}
				tintColor={themes[theme].headerTintColor}
			/>
		);
	}
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
				theme={theme}
				onPress={goRoomActionsView}
			/>
		);
	}
	return null;
};

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
	split: PropTypes.bool
};

export default RoomHeaderLeft;
