import React from 'react';
import { ViewStyle } from 'react-native';
import { SvgUri } from 'react-native-svg';

import { OmnichannelSourceType } from '../../definitions';
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
	sourceType?: OmnichannelSourceType;
}

export const OmnichannelRoomIcon = React.memo(({ size, style, sourceType, status }: IOmnichannelRoomIconProps) => {
	if (sourceType === OmnichannelSourceType.APP) {
		// if (true) {
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
		<CustomIcon name={iconMap[sourceType || 'other']} size={size} style={style} color={STATUS_COLORS[status || 'offline']} />
	);
});
