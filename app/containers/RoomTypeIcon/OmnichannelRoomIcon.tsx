import React from 'react';
import { ViewStyle } from 'react-native';
import { SvgUri } from 'react-native-svg';

import { IOmnichannelSource, OmnichannelSourceType } from '../../definitions';
import { STATUS_COLORS } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import { fetchteste } from '../../ee/omnichannel/hooks/useFetch';

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

export const OmnichannelRoomIcon = React.memo(({ size, style, sourceType, status }: IOmnichannelRoomIconProps) => {
	console.log('🚀 ~ file: OmnichannelRoomIcon.tsx ~ line 27 ~ OmnichannelRoomIcon ~ { size, style, sourceType, status }', {
		size,
		style,
		sourceType,
		status
	});
	if (sourceType?.type === OmnichannelSourceType.APP) {
		fetchteste({ icon: sourceType.sidebarIcon, appId: sourceType.id });
		return (
			<SvgUri
				height={size}
				width={size}
				color={STATUS_COLORS[status || 'offline']}
				uri='https://thenewcode.com/assets/images/thumbnails/homer-simpson.svg'
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
});
