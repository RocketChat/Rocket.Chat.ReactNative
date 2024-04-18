import React, { useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { SvgUri } from 'react-native-svg';

import { OmnichannelSourceType, IOmnichannelSource, TUserStatus } from '../../definitions';
import { useAppSelector } from '../../lib/hooks';
import { CustomIcon, TIconsName } from '../CustomIcon';
import { useUserStatusColor } from '../../lib/hooks/useUserStatusColor';

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
	status?: TUserStatus;
	sourceType?: IOmnichannelSource;
}

export const OmnichannelRoomIcon = ({ size, style, sourceType, status }: IOmnichannelRoomIconProps) => {
	const [loading, setLoading] = useState(true);
	const [svgError, setSvgError] = useState(false);
	const baseUrl = useAppSelector(state => state.server?.server);
	const connected = useAppSelector(state => state.meteor?.connected);
	const userStatusColor = useUserStatusColor(status || 'offline');

	const customIcon = <CustomIcon name={iconMap[sourceType?.type || 'other']} size={size} style={style} color={userStatusColor} />;

	if (!svgError && sourceType?.type === OmnichannelSourceType.APP && sourceType.id && sourceType.sidebarIcon && connected) {
		return (
			<>
				<SvgUri
					height={size}
					width={size}
					color={userStatusColor}
					uri={`${baseUrl}/api/apps/public/${sourceType.id}/get-sidebar-icon?icon=${sourceType.sidebarIcon}`}
					style={style}
					onError={() => setSvgError(true)}
					onLoad={() => setLoading(false)}
				/>
				{loading ? customIcon : null}
			</>
		);
	}

	return customIcon;
};
