import { store } from '../../store/auxStore';

export type IceServersSettings = Readonly<{
	/** Raw setting string before parsing (stable key for change detection). */
	iceServersSetting: string;
	iceGatheringTimeout: number;
}>;

export interface IceServersProvider {
	getSettings(): IceServersSettings;
	subscribe(listener: () => void): () => void;
}

export function createReduxIceServersProvider(): IceServersProvider {
	return {
		getSettings(): IceServersSettings {
			const { settings } = store.getState();
			const rawTimeout = Number(settings.VoIP_TeamCollab_Ice_Gathering_Timeout);
			const iceGatheringTimeout = Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : 5000;
			return {
				iceServersSetting: String(settings.VoIP_TeamCollab_Ice_Servers ?? ''),
				iceGatheringTimeout
			};
		},
		subscribe(listener: () => void) {
			return store.subscribe(listener);
		}
	};
}
