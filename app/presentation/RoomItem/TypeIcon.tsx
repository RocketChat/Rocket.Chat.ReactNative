import React from 'react';

import { TUserStatus } from '../../definitions';
import RoomTypeIcon from '../../containers/RoomTypeIcon';
import { TSupportedThemes } from '../../theme';

interface ITypeIcon {
	type: string;
	status: TUserStatus;
	prid: string;
	isGroupChat: boolean;
	teamMain: boolean;
	theme: TSupportedThemes;
	size?: number;
	style?: object;
}

const TypeIcon = React.memo(({ type, prid, status, isGroupChat, teamMain, size, style, theme }: ITypeIcon) => (
	<RoomTypeIcon
		type={prid ? 'discussion' : type}
		isGroupChat={isGroupChat}
		status={status}
		teamMain={teamMain}
		size={size}
		style={style}
		theme={theme}
	/>
));

export default TypeIcon;
