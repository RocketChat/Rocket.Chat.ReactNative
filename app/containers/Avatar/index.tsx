import { Q } from '@nozbe/watermelondb';
import React, { useEffect, useRef, useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { Observable, Subscription } from 'rxjs';

import Button from '../Button';
import { IApplicationState, TSubscriptionModel, TUserModel } from '../../definitions';
import database from '../../lib/database';
import { getUserSelector } from '../../selectors/login';
import Avatar from './Avatar';
import { IAvatar } from './interfaces';
import I18n from '../../i18n';
import { useTheme } from '../../theme';
import styles from './styles';

interface IAvatarContainer extends IAvatar {
	handleEdit?: () => void;
}

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
	handleEdit
}: IAvatarContainer): React.ReactElement => {
	const subscription = useRef<Subscription>();
	const [avatarETag, setAvatarETag] = useState<string | undefined>('');
	const { colors } = useTheme();

	const isDirect = () => type === 'd';

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

	const externalProviderUrl = useSelector(
		(state: IApplicationState) => state.settings.Accounts_AvatarExternalProviderUrl as string
	);
	const blockUnauthenticatedAccess = useSelector(
		(state: IApplicationState) =>
			(state.share.settings?.Accounts_AvatarBlockUnauthenticatedAccess as boolean) ??
			state.settings.Accounts_AvatarBlockUnauthenticatedAccess ??
			true
	);

	const unsubscribeQuery = () => {
		if (subscription?.current?.unsubscribe) {
			subscription.current.unsubscribe();
		}
	};

	const init = async () => {
		unsubscribeQuery();
		const db = database.active;
		const usersCollection = db.get('users');
		const subsCollection = db.get('subscriptions');

		let record;
		try {
			if (isDirect() || username === text) {
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
			subscription.current = observable.subscribe(r => {
				setAvatarETag(r.avatarETag);
			});
		}
	};

	useEffect(() => {
		if (!avatarETag) {
			init();
		}
	}, [text]); // testar se precisa do avatarETag

	useEffect(() => () => unsubscribeQuery(), []);

	return (
		<>
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
				externalProviderUrl={externalProviderUrl}
				avatarETag={avatarETag}
				serverVersion={serverVersion}
			/>
			{handleEdit ? (
				<Button
					title={I18n.t('Edit')}
					type='secondary'
					backgroundColor={colors.editAndUploadButtonAvatar}
					onPress={handleEdit}
					testID='avatar-edit-button'
					style={styles.editAvatarButton}
					color={colors.titleText}
				/>
			) : null}
		</>
	);
};

export default AvatarContainer;
