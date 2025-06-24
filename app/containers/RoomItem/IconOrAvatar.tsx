import React from 'react';
import { View } from 'react-native';

import Avatar from '../Avatar';
import { DisplayMode } from '../../lib/constants';
import TypeIcon from './TypeIcon';
import styles from './styles';
import { IIconOrAvatar } from './interfaces';
import { useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout';

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
	sourceType
}: IIconOrAvatar): React.ReactElement | null => {
	const { rowHeight } = useResponsiveLayout();

	if (showAvatar) {
		return (
			<Avatar text={avatar} size={displayMode === DisplayMode.Condensed ? 36 : 48} type={type} style={styles.avatar} rid={rid} />
		);
	}

	if (displayMode === DisplayMode.Expanded && showLastMessage) {
		return (
			<View style={[styles.typeIcon, { height: rowHeight }]}>
				<TypeIcon
					userId={userId}
					type={type}
					prid={prid}
					status={status}
					isGroupChat={isGroupChat}
					teamMain={teamMain}
					size={24}
					style={{ marginRight: 12 }}
					sourceType={sourceType}
				/>
			</View>
		);
	}

	return null;
};

export default IconOrAvatar;
