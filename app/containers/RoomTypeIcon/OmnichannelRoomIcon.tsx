import React from 'react';
import { ViewStyle } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { useSelector } from 'react-redux';

import { IOmnichannelSource, OmnichannelSourceType, IApplicationState } from '../../definitions';
import { STATUS_COLORS } from '../../constants/colors';
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
	style?: ViewStyle;
	status?: string;
	sourceType?: IOmnichannelSource;
}

export const OmnichannelRoomIcon = ({ size, style, sourceType, status }: IOmnichannelRoomIconProps) => {
	if (sourceType?.type === OmnichannelSourceType.APP && sourceType.id && sourceType.sidebarIcon) {
		const baseUrl = useSelector((state: IApplicationState) => state.server?.server);

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
