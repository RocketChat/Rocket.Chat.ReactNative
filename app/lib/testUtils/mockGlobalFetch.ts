import { settings as RocketChatSettings } from '@rocket.chat/sdk';

export interface ISentRequestOptions {
	headers: Record<string, string>;
	signal?: AbortSignal;
}

export function mockGlobalFetch(respond: (url: string, options: ISentRequestOptions) => Promise<Response>) {
	const sentToNetwork = jest.fn(respond);
	const originalGlobalFetch = global.fetch;
	const originalCustomHeaders = RocketChatSettings.customHeaders;

	beforeEach(() => {
		sentToNetwork.mockClear();
		global.fetch = sentToNetwork as unknown as typeof global.fetch;
	});

	afterEach(() => {
		global.fetch = originalGlobalFetch;
		RocketChatSettings.customHeaders = originalCustomHeaders;
	});

	return sentToNetwork;
}
