import React from 'react';

import { TUserStatus, IOmnichannelSource } from '../../definitions';
import RoomTypeIcon from '../../containers/RoomTypeIcon';

interface ITypeIcon {
	type: string;
	status: TUserStatus;
	prid: string;
	isGroupChat: boolean;
	teamMain: boolean;
	size?: number;
	style?: object;
	sourceType?: IOmnichannelSource;
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
