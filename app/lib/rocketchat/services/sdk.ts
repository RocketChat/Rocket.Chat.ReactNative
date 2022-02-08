import { Rocketchat } from '@rocket.chat/sdk';

import store from '../../createStore';
import { useSsl } from '../../../utils/url';

class Sdk {
	public get(...args: any[]): Promise<unknown> {
		const { server } = store.getState().server;
		const sdk = new Rocketchat({ host: server, protocol: 'ddp', useSsl: useSsl(server) });
		return sdk.get(...args);
	}

	public post(...args: any[]): Promise<unknown> {
		const { server } = store.getState().server;
		const sdk = new Rocketchat({ host: server, protocol: 'ddp', useSsl: useSsl(server) });
		return sdk.post(...args);
	}

	public methodCallWrapper(...args: any[]): Promise<unknown> {
		const { server } = store.getState().server;
		const sdk = new Rocketchat({ host: server, protocol: 'ddp', useSsl: useSsl(server) });
		return sdk.methodCall(...args);
	}
}

const sdk = new Sdk();

export default sdk;
