import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';

import Avatar from '../../containers/Avatar';
import TypeIcon from './TypeIcon';

import styles from './styles';

const IconOrAvatar = ({
	avatar,
	avatarSize,
	type,
	rid,
	showAvatar,
	prid,
	status,
	isGroupChat,
	teamMain,
	showLastMessage,
	theme,
	displayType
}) => {
	if (showAvatar) {
		return (
			<Avatar
				text={avatar}
				size={avatarSize}
				type={type}
				style={styles.avatar}
				rid={rid}
			/>
		);
	}

	if (displayType === 'expanded' && showLastMessage) {
		return (
			<View style={styles.typeIcon}>
				<TypeIcon
					type={type}
					prid={prid}
					status={status}
					isGroupChat={isGroupChat}
					theme={theme}
					teamMain={teamMain}
					size={18}
				/>
			</View>
		);
	}

	return null;
};

IconOrAvatar.propTypes = {
	avatar: PropTypes.string,
	avatarSize: PropTypes.number,
	type: PropTypes.string,
	theme: PropTypes.string,
	rid: PropTypes.string,
	showAvatar: PropTypes.bool,
	displayType: PropTypes.string,
	prid: PropTypes.string,
	status: PropTypes.string,
	isGroupChat: PropTypes.bool,
	teamMain: PropTypes.bool,
	showLastMessage: PropTypes.bool
};

export default IconOrAvatar;
