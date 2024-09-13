import { useEffect, useState } from 'react';

import { IApplicationState, TServerModel } from '../../definitions';
import database from '../database';
import { useAppSelector } from '../hooks';

export default function useServer() {
	const [server, setServer] = useState<TServerModel | null>(null);
	const appServer = useAppSelector((state: IApplicationState) => state.server.server);

	useEffect(() => {
		async function init() {
			const serversDB = database.servers;
			const serversCollection = serversDB.get('servers');
			let serverInfo = null;
			try {
				serverInfo = await serversCollection.find(appServer);
				setServer(serverInfo);
			} catch {
				setServer(serverInfo);
			}
		}

		init();
	}, []);

	return [server];
}
