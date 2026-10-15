import { Q } from '@nozbe/watermelondb';
import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { type Observable } from 'rxjs';

import { type TLoggedUserModel, type TSubscriptionModel, type TUserModel } from '~/definitions';
import database from '~/lib/database';
import { fetchQuerySync, findRecordSync } from '~/lib/database/readSync';

type TAvatarRecord = TSubscriptionModel | TUserModel | TLoggedUserModel;

interface IAvatarSource {
	type?: string;
	username?: string;
	text: string;
	rid?: string;
	id: string;
}

const findAvatarRecord = ({ username, text, type, rid, id }: IAvatarSource): TAvatarRecord | undefined => {
	if (username === text) {
		return findRecordSync(database.servers.get('users'), id);
	}
	if (type === 'd') {
		const [user] = fetchQuerySync(database.active.get('users').query(Q.where('username', text)));
		return user;
	}
	if (rid) {
		return findRecordSync(database.active.get('subscriptions'), rid);
	}
};

export const useAvatarETag = ({ username, text, type = '', rid, id }: IAvatarSource) => {
	const record = useMemo(() => findAvatarRecord({ username, text, type, rid, id }), [username, text, type, rid, id]);

	const subscribe = useCallback(
		(onChange: () => void) => {
			const subscription = (record?.observe() as Observable<TAvatarRecord> | undefined)?.subscribe(onChange);
			return () => subscription?.unsubscribe();
		},
		[record]
	);
	const avatarETag = useSyncExternalStore(subscribe, () => record?.avatarETag);

	return { avatarETag };
};
