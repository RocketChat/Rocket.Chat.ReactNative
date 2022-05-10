import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { IApplicationState, TServerModel } from '../../definitions';
import database from '../database';

export default function useServer() {
	const [server, setServer] = useState<TServerModel | null>(null);
	const shareServer = useSelector((state: IApplicationState) => state.share.server.server);
	const appServer = useSelector((state: IApplicationState) => state.server.server);

	useEffect(() => {
		async function init() {
			const serversDB = database.servers;
			const serversCollection = serversDB.get('servers');
			let serverInfo = null;
			try {
				serverInfo = await serversCollection.find(shareServer || appServer);
				setServer(serverInfo);
			} catch {
				setServer(serverInfo);
			}
		}

		init();
	}, []);

	return [server];
}
