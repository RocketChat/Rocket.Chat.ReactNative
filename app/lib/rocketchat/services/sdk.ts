import Rocketchat from '@rocket.chat/sdk';

import reduxStore from '../../createStore';
import { useSsl } from '../../../utils/url';

class Sdk {
	private sdk: typeof Rocketchat;

	constructor() {
		const { server } = reduxStore.getState();
		this.sdk = new Rocketchat({ host: server, protocol: 'ddp', useSsl: useSsl(server) });
		return this.sdk;
	}

	public get(...args: any[]): Promise<unknown> {
		return this.sdk.get(...args);
	}

	public post(...args: any[]): Promise<unknown> {
		return this.sdk.post(...args);
	}

	public methodCallWrapper(...args: any[]): Promise<unknown> {
		return this.sdk.methodCall(...args);
	}
}

const sdk = new Sdk();

export default sdk;
