import { type ReactElement } from 'react';
import { createStructuredSelector } from 'reselect';

import { type IApplicationState, type IUser } from '~/definitions';
import { getUserSelector } from '~/selectors/login';
import Avatar from './Avatar';
import { type IAvatar } from './interfaces';
import { useAvatarETag } from './useAvatarETag';
import { useAppSelector } from '~/lib/hooks/useAppSelector';

interface IAvatarConfig {
	server: string;
	serverVersion: string;
	id: IUser['id'];
	token: IUser['token'];
	username: IUser['username'];
	avatarExternalProviderUrl: string;
	roomAvatarExternalProviderUrl: string;
	cdnPrefix: string;
	blockUnauthenticatedAccess: boolean;
}

const selectAvatarConfig = createStructuredSelector<IApplicationState, IAvatarConfig>({
	server: state => state.server.server,
	serverVersion: state => state.server.version,
	id: state => getUserSelector(state).id,
	token: state => getUserSelector(state).token,
	username: state => getUserSelector(state).username,
	avatarExternalProviderUrl: state => state.settings.Accounts_AvatarExternalProviderUrl as string,
	roomAvatarExternalProviderUrl: state => state.settings.Accounts_RoomAvatarExternalProviderUrl as string,
	cdnPrefix: state => state.settings.CDN_PREFIX as string,
	blockUnauthenticatedAccess: state => (state.settings.Accounts_AvatarBlockUnauthenticatedAccess ?? true) as boolean
});

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
	isStatic,
	rid,
	accessibilityLabel,
	accessible
}: IAvatar): ReactElement => {
	const {
		server,
		serverVersion,
		id,
		token,
		username,
		avatarExternalProviderUrl,
		roomAvatarExternalProviderUrl,
		cdnPrefix,
		blockUnauthenticatedAccess
	} = useAppSelector(selectAvatarConfig);

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
			isStatic={isStatic}
			rid={rid}
			blockUnauthenticatedAccess={blockUnauthenticatedAccess}
			avatarExternalProviderUrl={avatarExternalProviderUrl}
			roomAvatarExternalProviderUrl={roomAvatarExternalProviderUrl}
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
