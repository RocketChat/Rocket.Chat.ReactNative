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
	rid,
	accessibilityLabel
}: IAvatar): React.ReactElement => {
	const server = useSelector((state: IApplicationState) => state.server.server);
	const serverVersion = useSelector((state: IApplicationState) => state.server.version);
	const { id, token, username } = useSelector(
		(state: IApplicationState) => ({
			id: getUserSelector(state).id,
			token: getUserSelector(state).token,
			username: getUserSelector(state).username
		}),
		shallowEqual
	);

	const { avatarExternalProviderUrl, roomAvatarExternalProviderUrl, cdnPrefix } = useSelector((state: IApplicationState) => ({
		avatarExternalProviderUrl: state.settings.Accounts_AvatarExternalProviderUrl as string,
		roomAvatarExternalProviderUrl: state.settings.Accounts_RoomAvatarExternalProviderUrl as string,
		cdnPrefix: state.settings.CDN_PREFIX as string
	}));
	const blockUnauthenticatedAccess = useSelector(
		(state: IApplicationState) => state.settings.Accounts_AvatarBlockUnauthenticatedAccess ?? true
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
			cdnPrefix={cdnPrefix}
			accessibilityLabel={accessibilityLabel}
		/>
	);
};

export default AvatarContainer;
