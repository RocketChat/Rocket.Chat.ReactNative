import React from 'react';

import RoomTypeIcon from '../../containers/RoomTypeIcon';

interface ITypeIcon {
	type: string;
	status: string;
	prid: string;
	isGroupChat: boolean;
	teamMain: boolean;
	theme?: string;
}

const TypeIcon = React.memo(({ type, prid, status, isGroupChat, teamMain }: ITypeIcon) => (
	<RoomTypeIcon type={prid ? 'discussion' : type} isGroupChat={isGroupChat} status={status} teamMain={teamMain} />
));

export default TypeIcon;
