/* eslint-disable react/prop-types */
import React from 'react';
import { View } from 'react-native';
import Avatar from '../../../containers/Avatar';
import Status from '../../../containers/Status';
import { withTheme } from '../../../theme';
import styles from './styles';
import sharedStyles from '../../Styles';
import { themes } from '../../../constants/colors';

const renderAvatar = ({
	room, roomUser, roomType, theme
}) => (
	<Avatar
		text={room.name || roomUser?.username}
		style={styles.avatar}
		type={roomType}
		size={100}
		rid={room?.rid}
	>
		{roomType === 'd' && roomUser?._id
			? (
				<View style={[sharedStyles.status, { backgroundColor: themes[theme].auxiliaryBackground }]}>
					<Status size={20} id={roomUser?._id} />
				</View>
			)
			: null}
	</Avatar>
);

export default withTheme(renderAvatar);
