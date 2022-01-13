import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';

import Avatar from '../../containers/Avatar';
import { DisplayMode } from '../../constants/constantDisplayMode';
import TypeIcon from './TypeIcon';
import styles from './styles';

const IconOrAvatar = ({
	avatar,
	type,
	rid,
	showAvatar,
	prid,
	status,
	isGroupChat,
	teamMain,
	showLastMessage,
	theme,
	displayMode
}) => {
	if (showAvatar) {
		return (
			<Avatar text={avatar} size={displayMode === DisplayMode.Condensed ? 36 : 48} type={type} style={styles.avatar} rid={rid} />
		);
	}

	if (displayMode === DisplayMode.Expanded && showLastMessage) {
		return (
			<View style={styles.typeIcon}>
				<TypeIcon
					type={type}
					prid={prid}
					status={status}
					isGroupChat={isGroupChat}
					theme={theme}
					teamMain={teamMain}
					size={24}
					style={{ marginRight: 12 }}
				/>
			</View>
		);
	}

	return null;
};

IconOrAvatar.propTypes = {
	avatar: PropTypes.string,
	type: PropTypes.string,
	theme: PropTypes.string,
	rid: PropTypes.string,
	showAvatar: PropTypes.bool,
	displayMode: PropTypes.string,
	prid: PropTypes.string,
	status: PropTypes.string,
	isGroupChat: PropTypes.bool,
	teamMain: PropTypes.bool,
	showLastMessage: PropTypes.bool
};

export default IconOrAvatar;
