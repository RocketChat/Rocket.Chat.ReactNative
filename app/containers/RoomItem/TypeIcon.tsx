import { memo } from 'react';

import RoomTypeIcon from '../RoomTypeIcon';
import { type ITypeIconProps } from './interfaces';

const TypeIcon = memo(
	({ userId, type, prid, status, isGroupChat, teamMain, size, style, sourceType, abacAttributes }: ITypeIconProps) => (
		<RoomTypeIcon
			userId={userId}
			type={prid ? 'discussion' : type}
			isGroupChat={isGroupChat}
			status={status}
			teamMain={teamMain}
			size={size}
			style={style}
			sourceType={sourceType}
			abacAttributes={abacAttributes}
		/>
	)
);

export default TypeIcon;
