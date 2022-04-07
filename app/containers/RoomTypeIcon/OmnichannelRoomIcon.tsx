import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { useSelector } from 'react-redux';

import { OmnichannelSourceType, IApplicationState, IOmnichannelSource } from '../../definitions';
import { STATUS_COLORS } from '../../lib/constants';
import { CustomIcon } from '../../lib/Icons';

const iconMap = {
	widget: 'livechat-monochromatic',
	email: 'mail',
	sms: 'sms',
	app: 'omnichannel',
	api: 'omnichannel',
	other: 'omnichannel'
};

interface IOmnichannelRoomIconProps {
	size: number;
	type: string;
	style?: StyleProp<ViewStyle>;
	status?: string;
	sourceType?: IOmnichannelSource;
}

export const OmnichannelRoomIcon = ({ size, style, sourceType, status }: IOmnichannelRoomIconProps) => {
	const baseUrl = useSelector((state: IApplicationState) => state.server?.server);
	const connected = useSelector((state: IApplicationState) => state.meteor?.connected);

	if (sourceType?.type === OmnichannelSourceType.APP && sourceType.id && sourceType.sidebarIcon && connected) {
		return (
			<SvgUri
				height={size}
				width={size}
				color={STATUS_COLORS[status || 'offline']}
				uri={`${baseUrl}/api/apps/public/${sourceType.id}/get-sidebar-icon?icon=${sourceType.sidebarIcon}`}
				style={style}
			/>
		);
	}

	return (
		<CustomIcon
			name={iconMap[sourceType?.type || 'other']}
			size={size}
			style={style}
			color={STATUS_COLORS[status || 'offline']}
		/>
	);
};
