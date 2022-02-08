import { Rocketchat } from '@rocket.chat/sdk';

// import store from '../../createStore';
import { useSsl } from '../../../utils/url';

class Sdk {
	private sdk: typeof Rocketchat;

	// TODO: We need to stop returning the SDK after all methods are dehydrated
	public initialize(server: string) {
		this.sdk = new Rocketchat({ host: server, protocol: 'ddp', useSsl: useSsl(server) });
		return this.sdk;
	}

	/**
	 * TODO: evaluate the need for assigning "null" to this.sdk
	 * I'm returning "null" because we need to remove both instances of this.sdk here and on rocketchat.js
	 */
	public disconnect() {
		if (this.sdk) {
			this.sdk.disconnect();
			this.sdk = null;
		}
		return null;
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
