import React from 'react';

import RoomTypeIcon from '../RoomTypeIcon';
import { ITypeIconProps } from './interfaces';

const TypeIcon = React.memo(({ type, prid, status, isGroupChat, teamMain, size, style }: ITypeIconProps) => (
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
