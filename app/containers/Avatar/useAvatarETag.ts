import { Q } from '@nozbe/watermelondb';
import { useEffect, useState } from 'react';
import { Observable, Subscription } from 'rxjs';

import { TSubscriptionModel, TUserModel } from '../../definitions';
import database from '../../lib/database';

export const useAvatarETag = ({
	username,
	text,
	type = '',
	rid
}: {
	type?: string;
	username: string;
	text: string;
	rid?: string;
}) => {
	const [avatarETag, setAvatarETag] = useState<string | undefined>('');

	const isDirect = () => type === 'd';

	useEffect(() => {
		let subscription: Subscription;
		if (!avatarETag) {
			const observeAvatarETag = async () => {
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
					subscription = observable.subscribe(r => {
						setAvatarETag(r.avatarETag);
					});
				}
			};
			observeAvatarETag();
			return () => {
				if (subscription?.unsubscribe) {
					subscription.unsubscribe();
				}
			};
		}
	}, [text]);

	return { avatarETag };
};
