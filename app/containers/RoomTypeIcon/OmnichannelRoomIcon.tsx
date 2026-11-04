import { useState } from 'react';
import { Image, type ImageStyle } from 'expo-image';

import { type IOmnichannelSource, type TUserStatus } from '~/definitions';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { CustomIcon } from '../CustomIcon';
import { getOmnichannelIconName, getOmnichannelSidebarIconUri } from './roomTypeIconName';
import { useUserStatusColor } from '~/lib/hooks/useUserStatusColor';

interface IOmnichannelRoomIconProps {
	size: number;
	type: string;
	style?: ImageStyle;
	status?: TUserStatus;
	sourceType?: IOmnichannelSource;
}

export const OmnichannelRoomIcon = ({ size, style, sourceType, status }: IOmnichannelRoomIconProps) => {
	const [loading, setLoading] = useState(true);
	const [svgError, setSvgError] = useState(false);
	const baseUrl = useAppSelector(state => state.server?.server);
	const connected = useAppSelector(state => state.meteor?.connected);
	const userStatusColor = useUserStatusColor(status || 'offline');

	const customIcon = <CustomIcon name={getOmnichannelIconName(sourceType)} size={size} style={style} color={userStatusColor} />;
	const sidebarIconUri = connected ? getOmnichannelSidebarIconUri(baseUrl, sourceType) : undefined;

	if (!svgError && sidebarIconUri) {
		return (
			<>
				<Image
					tintColor={userStatusColor}
					source={{ uri: sidebarIconUri }}
					style={[{ width: size, height: size }, style]}
					onError={() => setSvgError(true)}
					onLoad={() => setLoading(false)}
				/>
				{loading ? customIcon : null}
			</>
		);
	}

	return customIcon;
};
