import RocketChat from './rocketchat';

export class SDK {
	private static instance: SDK = new SDK();

	constructor() {
		SDK.instance = this;
	}

	public static getInstance(): SDK {
		return SDK.instance;
	}

	public get(...args: any[]): Promise<unknown> {
		return RocketChat.get(...args);
	}

	public post(...args: any[]): Promise<unknown> {
		return RocketChat.post(...args);
	}

	public methodCallWrapper(...args: any[]): Promise<unknown> {
		return RocketChat.methodCall(...args);
	}
}
