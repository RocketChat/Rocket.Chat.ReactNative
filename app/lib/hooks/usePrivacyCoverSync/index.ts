import { useEffect, useMemo } from 'react';
import { Q } from '@nozbe/watermelondb';

import database from '~/lib/database';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useObservable } from '~/lib/hooks/useObservable';
import { setPrivacyCoverEnabled } from '~/lib/methods/helpers/privacyCover';
import { RootEnum } from '~/definitions/redux/TRootEnum';

const observeServerRecords = (server: string) =>
	database.servers.get('servers').query(Q.where('id', server)).observeWithColumns(['auto_lock']);

export const usePrivacyCoverSync = (): void => {
	const server = useAppSelector(state => state.server.server);
	const isInsideApp = useAppSelector(state => state.app.root === RootEnum.ROOT_INSIDE);

	const serverRecords$ = useMemo(() => (server ? observeServerRecords(server) : undefined), [server]);
	const serverRecords = useObservable(serverRecords$);
	const isScreenLockOn = !!serverRecords?.[0]?.autoLock;

	const enabled = isInsideApp && isScreenLockOn;

	useEffect(() => {
		setPrivacyCoverEnabled(enabled);
	}, [enabled]);
};
