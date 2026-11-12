import { memo } from 'react';

import RoomTypeIcon from '../RoomTypeIcon';
import { type ITypeIconProps } from './interfaces';
import { useTheme } from '~/theme';

const TypeIcon = memo(
	({ userId, type, prid, status, isGroupChat, teamMain, size, style, sourceType, abacAttributes, isUnread }: ITypeIconProps) => {
		const { colors } = useTheme();
		return (
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
				color={isUnread ? colors.fontTitlesLabels : colors.fontDefault}
			/>
		);
	}
);

export default TypeIcon;
