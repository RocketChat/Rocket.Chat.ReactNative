import React from 'react';
import { shallowEqual, useSelector } from 'react-redux';

import { IApplicationState } from '../../definitions';
import { getUserSelector } from '../../selectors/login';
import Avatar from './Avatar';
import { IAvatar } from './interfaces';
import { useAvatarETag } from './useAvatarETag';

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
	rid
}: IAvatar): React.ReactElement => {
	const server = useSelector((state: IApplicationState) => state.share.server.server || state.server.server);
	const serverVersion = useSelector((state: IApplicationState) => state.share.server.version || state.server.version);
	const { id, token, username } = useSelector(
		(state: IApplicationState) => ({
			id: getUserSelector(state).id,
			token: getUserSelector(state).token,
			username: getUserSelector(state).username
		}),
		shallowEqual
	);

	const { avatarExternalProviderUrl, roomAvatarExternalProviderUrl } = useSelector((state: IApplicationState) => ({
		avatarExternalProviderUrl: state.settings.Accounts_AvatarExternalProviderUrl as string,
		roomAvatarExternalProviderUrl: state.settings.Accounts_RoomAvatarExternalProviderUrl as string
	}));
	const blockUnauthenticatedAccess = useSelector(
		(state: IApplicationState) =>
			(state.share.settings?.Accounts_AvatarBlockUnauthenticatedAccess as boolean) ??
			state.settings.Accounts_AvatarBlockUnauthenticatedAccess ??
			true
	);

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
			children={children}
			userId={id}
			token={token}
			onPress={onPress}
			getCustomEmoji={getCustomEmoji}
			isStatic={isStatic}
			rid={rid}
			blockUnauthenticatedAccess={blockUnauthenticatedAccess}
			avatarExternalProviderUrl={avatarExternalProviderUrl}
			roomAvatarExternalProviderUrl={roomAvatarExternalProviderUrl}
			avatarETag={avatarETag}
			serverVersion={serverVersion}
		/>
	);
};

export default AvatarContainer;
