import { type ReactElement } from 'react';

import Avatar from '../Avatar';
import { type IIconOrAvatar } from './interfaces';

const IconOrAvatar = ({ avatar, type, rid, showAvatar }: IIconOrAvatar): ReactElement | null => {
	if (showAvatar) {
		return <Avatar text={avatar} size={36} type={type} rid={rid} />;
	}

	return null;
};

export default IconOrAvatar;
