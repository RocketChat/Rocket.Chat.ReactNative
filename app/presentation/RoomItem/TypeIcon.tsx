import React from 'react';

import { TUserStatus } from '../../definitions/TUserStatus';
import RoomTypeIcon from '../../containers/RoomTypeIcon';

interface ITypeIcon {
	type: string;
	status: TUserStatus;
	prid: string;
	isGroupChat: boolean;
	teamMain: boolean;
	theme?: string;
	size?: number;
	style?: object;
}

const TypeIcon = React.memo(({ type, prid, status, isGroupChat, teamMain, size, style }: ITypeIcon) => (
	<RoomTypeIcon
		type={prid ? 'discussion' : type}
		isGroupChat={isGroupChat}
		status={status}
		teamMain={teamMain}
		size={size}
		style={style}
	/>
));

export default TypeIcon;
