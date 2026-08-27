import type sdk from '../services/sdk';
import type { ISocketDriver } from '../services/sdk';
import type { RealSdkClient } from './sdkTransport';

export interface ISdkClientStub {
	host?: string;
	driver?: ISocketDriver;
}

export type SdkClientLike = ISdkClientStub | RealSdkClient;

export type ISdkModuleFake = Pick<typeof sdk, 'host' | 'driver' | 'isInitialized'> & {
	setClient(client: SdkClientLike | null): void;
};

function hostOf(client: SdkClientLike): string | null {
	if ('client' in client) return client.client.host ?? null;
	return client.host ?? null;
}

export function createSdkModuleFake<TMembers extends Partial<typeof sdk> = Record<string, never>>(
	members?: TMembers
): ISdkModuleFake & TMembers {
	let current: SdkClientLike | null = null;
	const fake: ISdkModuleFake = {
		setClient(client: SdkClientLike | null) {
			current = client;
		},
		get host() {
			return current ? hostOf(current) : null;
		},
		get driver() {
			return (current?.driver as unknown as ISocketDriver) ?? null;
		},
		get isInitialized() {
			return current !== null;
		}
	};
	return Object.assign(fake, members ?? ({} as TMembers));
}
