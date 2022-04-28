import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Q } from '@nozbe/watermelondb';
import { Observable, Subscription } from 'rxjs';

import database from '../../lib/database';
import { getUserSelector } from '../../selectors/login';
import { IApplicationState, TSubscriptionModel, TUserModel } from '../../definitions';
import Avatar from './Avatar';
import { IAvatar } from './interfaces';

const AvatarContainer = ({
	server,
	style,
	text = '',
	avatar,
	emoji,
	size,
	borderRadius,
	type,
	children,
	user,
	onPress,
	getCustomEmoji,
	isStatic,
	rid,
	blockUnauthenticatedAccess,
	serverVersion,
	externalProviderUrl
}: IAvatar): React.ReactElement => {
	const [avatarETag, setAvatarETag] = useState<string | undefined>('');
	let subscription: Subscription;

	const isDirect = () => type === 'd';

	const init = async () => {
		const db = database.active;
		const usersCollection = db.get('users');
		const subsCollection = db.get('subscriptions');

		let record;
		try {
			if (isDirect()) {
				const [user] = await usersCollection.query(Q.where('username', text)).fetch();
				record = user;
			} else if (rid) {
				record = await subsCollection.find(rid);
			}
		} catch {
			// Record not found
		}

		if (record) {
			const observable = record.observe() as Observable<TSubscriptionModel | TUserModel>;
			subscription = observable.subscribe(r => {
				setAvatarETag(r.avatarETag);
			});
		}
	};

	useEffect(() => {
		init();
		return () => {
			if (subscription?.unsubscribe) {
				subscription.unsubscribe();
			}
		};
	}, [text, type, size, avatarETag, externalProviderUrl]);

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
			user={user}
			onPress={onPress}
			getCustomEmoji={getCustomEmoji}
			isStatic={isStatic}
			rid={rid}
			blockUnauthenticatedAccess={blockUnauthenticatedAccess}
			externalProviderUrl={externalProviderUrl}
			avatarETag={avatarETag}
			serverVersion={serverVersion}
		/>
	);
};

const mapStateToProps = (state: IApplicationState) => ({
	user: getUserSelector(state),
	server: state.share.server.server || state.server.server,
	serverVersion: state.share.server.version || state.server.version,
	blockUnauthenticatedAccess:
		(state.share.settings?.Accounts_AvatarBlockUnauthenticatedAccess as boolean) ??
		state.settings.Accounts_AvatarBlockUnauthenticatedAccess ??
		true,
	externalProviderUrl: state.settings.Accounts_AvatarExternalProviderUrl as string
});
export default connect(mapStateToProps)(AvatarContainer);
