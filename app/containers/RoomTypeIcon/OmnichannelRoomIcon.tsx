import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { SvgUri } from 'react-native-svg';

import { OmnichannelSourceType, IOmnichannelSource } from '../../definitions';
import { STATUS_COLORS } from '../../lib/constants';
import { useAppSelector } from '../../lib/hooks';
import { CustomIcon, TIconsName } from '../CustomIcon';

interface IIconMap {
	[key: string]: TIconsName;
}

const iconMap: IIconMap = {
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
	const baseUrl = useAppSelector(state => state.server?.server);
	const connected = useAppSelector(state => state.meteor?.connected);

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
