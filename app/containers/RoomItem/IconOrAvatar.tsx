import { type ReactElement } from 'react';

import Avatar from '../Avatar';
import { DisplayMode } from '~/lib/constants/constantDisplayMode';
import TypeIcon from './TypeIcon';
import { type IIconOrAvatar } from './interfaces';

const IconOrAvatar = ({
	avatar,
	type,
	rid,
	showAvatar,
	userId,
	prid,
	status,
	isGroupChat,
	teamMain,
	showLastMessage,
	displayMode,
	sourceType,
	abacAttributes
}: IIconOrAvatar): ReactElement | null => {
	if (showAvatar) {
		return <Avatar text={avatar} size={36} type={type} rid={rid} />;
	}

	if (displayMode === DisplayMode.Expanded && showLastMessage) {
		return (
			<TypeIcon
				userId={userId}
				type={type}
				prid={prid}
				status={status}
				isGroupChat={isGroupChat}
				teamMain={teamMain}
				size={24}
				sourceType={sourceType}
				abacAttributes={abacAttributes}
			/>
		);
	}

	return null;
};

export default IconOrAvatar;
