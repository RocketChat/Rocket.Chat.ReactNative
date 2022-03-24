import React from 'react';

import { OmnichannelSourceType } from '../../definitions';
import RoomTypeIcon from '../../containers/RoomTypeIcon';

interface ITypeIcon {
	type: string;
	status: string;
	prid: string;
	isGroupChat: boolean;
	teamMain: boolean;
	theme?: string;
	size?: number;
	style?: object;
	sourceType?: OmnichannelSourceType;
}

const TypeIcon = React.memo(({ type, prid, status, isGroupChat, teamMain, size, style, sourceType }: ITypeIcon) => (
	<RoomTypeIcon
		type={prid ? 'discussion' : type}
		isGroupChat={isGroupChat}
		status={status}
		teamMain={teamMain}
		size={size}
		style={style}
		sourceType={sourceType}
	/>
));

export default TypeIcon;
