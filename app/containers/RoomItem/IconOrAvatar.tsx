import React from 'react';
import { View } from 'react-native';

import Avatar from '../Avatar';
import { DisplayMode } from '../../lib/constants';
import TypeIcon from './TypeIcon';
import styles from './styles';
import { IIconOrAvatar } from './interfaces';

const IconOrAvatar = ({
	avatar,
	type,
	rid,
	showAvatar,
	userId,
	prid,
	status,
	isGroupChat,
	teamMain,
	showLastMessage,
	displayMode,
	sourceType,
	containerStyles,
	iconSize,
	borderRadius
}: IIconOrAvatar): React.ReactElement | null => {
	if (showAvatar) {
		return (
			<Avatar
				text={avatar}
				size={iconSize ? iconSize : displayMode === DisplayMode.Condensed ? 36 : 48}
				type={type}
				style={containerStyles ? containerStyles : styles.avatar}
				rid={rid}
				borderRadius={borderRadius}
			/>
		);
	}

	if (displayMode === DisplayMode.Expanded && showLastMessage) {
		return (
			<View style={styles.typeIcon}>
				<TypeIcon
					userId={userId}
					type={type}
					prid={prid}
					status={status}
					isGroupChat={isGroupChat}
					teamMain={teamMain}
					size={iconSize || 24}
					style={containerStyles || { marginRight: 12 }}
					sourceType={sourceType}
				/>
			</View>
		);
	}

	return null;
};

export default IconOrAvatar;
