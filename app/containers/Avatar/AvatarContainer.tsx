import React from 'react';
import { shallowEqual } from 'react-redux';

import { getUserSelector } from '../../selectors/login';
import Avatar from './Avatar';
import { type IAvatar } from './interfaces';
import { useAvatarETag } from './useAvatarETag';
import { useAppSelector } from '../../lib/hooks/useAppSelector';

const AvatarContainer = ({
	style,
	text = '',
	avatar,
	emoji,
	size,
	borderRadius,
	type,
	children,
	onPress,
	getCustomEmoji,
	isStatic,
	rid,
	accessibilityLabel,
	accessible
}: IAvatar): React.ReactElement => {
	const server = useAppSelector(state => state.server.server);
	const serverVersion = useAppSelector(state => state.server.version);
	const { id, token, username } = useAppSelector(
		state => ({
			id: getUserSelector(state).id,
			token: getUserSelector(state).token,
			username: getUserSelector(state).username
		}),
		shallowEqual
	);

	const cdnPrefix = useAppSelector(state => state.settings.CDN_PREFIX as string);
	const blockUnauthenticatedAccess = useAppSelector(
		state => state.settings.Accounts_AvatarBlockUnauthenticatedAccess ?? true
	) as boolean;

	const { avatarETag } = useAvatarETag({ username, text, type, rid, id });

	return (
		<Avatar
			server={server}
			style={style}
			text={text}
			avatar={avatar}
			emoji={emoji}
			size={size}
			borderRadius={borderRadius}
			type={type}
			userId={id}
			token={token}
			onPress={onPress}
			getCustomEmoji={getCustomEmoji}
			isStatic={isStatic}
			rid={rid}
			blockUnauthenticatedAccess={blockUnauthenticatedAccess}
			avatarETag={avatarETag}
			serverVersion={serverVersion}
			cdnPrefix={cdnPrefix}
			accessibilityLabel={accessibilityLabel}
			accessible={accessible}>
			{children}
		</Avatar>
	);
};

export default AvatarContainer;
