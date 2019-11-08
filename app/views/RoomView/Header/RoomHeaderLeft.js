import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet } from 'react-native';
import { HeaderBackButton } from 'react-navigation-stack';

import { isIOS, isSplited } from '../../../utils/deviceInfo';
import { HEADER_BACK } from '../../../constants/colors';
import Avatar from '../../../containers/Avatar';

const styles = StyleSheet.create({
	avatar: {
		borderRadius: 10,
		marginLeft: 20
	}
});

const RoomHeaderLeft = ({
	tmid, unreadsCount, navigation, baseUrl, userId, token, title, t, goRoomActionsView
}) => {
	if (!isSplited() || tmid) {
		return (
			<HeaderBackButton
				title={unreadsCount > 999 ? '+999' : unreadsCount || ' '}
				backTitleVisible={isIOS}
				onPress={() => navigation.goBack()}
				tintColor={HEADER_BACK}
			/>
		);
	}
	return (
		<Avatar
			text={title}
			size={30}
			type={t}
			baseUrl={baseUrl}
			style={styles.avatar}
			userId={userId}
			token={token}
			onPress={goRoomActionsView}
		/>
	);
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
	goRoomActionsView: PropTypes.func
};

export default RoomHeaderLeft;
