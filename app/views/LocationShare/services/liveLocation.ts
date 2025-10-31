import * as Location from 'expo-location';

import { sendMessage } from '../../../lib/methods/sendMessage';
import { LiveLocationApi } from './liveLocationApi';
import type { MapProviderName } from './mapProviders';
import I18n from '../../../i18n';

export type LiveLocationState = {
	coords: {
		latitude: number;
		longitude: number;
		accuracy?: number;
	};
	timestamp: number;
	isActive: boolean;
	msgId?: string;
};

export class LiveLocationTracker {
	private watchSub: Location.LocationSubscription | null = null;
	private tickInterval: ReturnType<typeof setInterval> | null = null;
	private onLocationUpdate: ((state: LiveLocationState) => void) | null = null;
	private currentState: LiveLocationState | null = null;
	private rid: string;
	private tmid?: string;
	private user: { id: string; username: string };
	private msgId: string | null = null;
	private durationSec?: number;
	private useServerApi = false;
	private liveLocationId: string;
	private provider: MapProviderName;

	constructor(
		rid: string,
		tmid: string | undefined,
		user: { id: string; username: string },
		onUpdate: (state: LiveLocationState) => void,
		durationSec?: number,
		provider: MapProviderName = 'google'
	) {
		this.rid = rid;
		this.tmid = tmid;
		this.user = user;
		this.onLocationUpdate = onUpdate;
		this.durationSec = durationSec;
		this.provider = provider;
		this.liveLocationId = `live_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
	}

	private emit(state: LiveLocationState) {
		this.currentState = state;
		this.onLocationUpdate?.(state);
	}

	async startTracking(): Promise<void> {
		// Permissions
		let { status } = await Location.getForegroundPermissionsAsync();
		if (status !== 'granted') {
			const r = await Location.requestForegroundPermissionsAsync();
			status = r.status;
		}
		if (status !== 'granted') {
			throw new Error('Location permission not granted');
		}

		// Ensure services are on
		const servicesOn = await Location.hasServicesEnabledAsync();
		if (!servicesOn) {
			throw new Error('Location services are turned off');
		}

		// Initial position
		const first = await Location.getCurrentPositionAsync({
			accuracy: Location.Accuracy.High,
			mayShowUserSettingsDialog: true
		});

		const initialCoords = {
			latitude: first.coords.latitude,
			longitude: first.coords.longitude,
			accuracy: first.coords.accuracy ?? undefined
		};

		// Start on server
		try {
			const response = await LiveLocationApi.start(this.rid, {
				durationSec: this.durationSec,
				initial: {
					lat: initialCoords.latitude,
					lng: initialCoords.longitude,
					acc: initialCoords.accuracy
				}
			});
			this.msgId = response.msgId;
			this.useServerApi = true;
		} catch (error) {
			this.useServerApi = false;
			this.msgId = null;

			this.emit?.({
				coords: initialCoords,
				timestamp: Date.now(),
				isActive: false,
				msgId: undefined
			});
			return;
		}

		this.emit({
			coords: initialCoords,
			timestamp: Date.now(),
			isActive: true,
			msgId: this.msgId ?? undefined
		});

		// Watch position
		try {
			this.watchSub = await Location.watchPositionAsync(
				{
					accuracy: Location.Accuracy.High,
					timeInterval: 10_000,
					distanceInterval: 5
				},
				pos => {
					this.currentState = {
						coords: {
							latitude: pos.coords.latitude,
							longitude: pos.coords.longitude,
							accuracy: pos.coords.accuracy ?? undefined
						},
						timestamp: Date.now(),
						isActive: true,
						msgId: this.msgId ?? undefined
					};
				}
			);
		} catch (error) {
			if (this.msgId && this.useServerApi) {
				try {
					await LiveLocationApi.stop(this.rid, this.msgId);
				} catch {
					// best-effort cleanup
				}
			}
			this.useServerApi = false;
			this.msgId = null;
			this.emit({
				coords: initialCoords,
				timestamp: Date.now(),
				isActive: false,
				msgId: undefined
			});
			throw error;
		}

		// Sync every 10s
		this.tickInterval = setInterval(async () => {
			if (!this.tickInterval || !this.currentState || !this.msgId) {
				if (this.tickInterval) {
					clearInterval(this.tickInterval);
					this.tickInterval = null;
				}
				return;
			}

			if (this.currentState && this.msgId) {
				const now = Date.now();

				if (this.useServerApi) {
					try {
						await LiveLocationApi.update(this.rid, this.msgId, {
							lat: this.currentState.coords.latitude,
							lng: this.currentState.coords.longitude,
							acc: this.currentState.coords.accuracy
						});
					} catch (error) {
						if (
							error instanceof Error &&
							(error.message === 'error-live-location-not-found' || error.message.includes('live-location-not-found'))
						) {
							this.useServerApi = false;
							this.stopTracking().catch(_e => {});
							return;
						}
					}
				}

				const emittedState = {
					...this.currentState,
					timestamp: now,
					isActive: true,
					msgId: this.msgId ?? undefined
				};
				this.emit(emittedState);
			}
		}, 10_000);
	}

	async stopTracking(): Promise<void> {
		// Stop watch
		if (this.watchSub) {
			this.watchSub.remove();
			this.watchSub = null;
		}

		if (this.tickInterval) {
			clearInterval(this.tickInterval);
			this.tickInterval = null;
		}

		// Stop on server
		if (this.msgId && this.currentState) {
			if (this.useServerApi) {
				try {
					await LiveLocationApi.stop(this.rid, this.msgId, {
						lat: this.currentState.coords.latitude,
						lng: this.currentState.coords.longitude,
						acc: this.currentState.coords.accuracy
					});
				} catch (error) {
					// ignore
				}
			} else {
				// Fallback: send stop message
				const stopMessage = this.createLiveLocationMessage(this.currentState.coords, 'stop');
				try {
					await sendMessage(this.rid, stopMessage, this.tmid, this.user, false);
				} catch (error) {
					// ignore
				}
			}
		}

		// Reset
		this.useServerApi = false;
		this.msgId = null;

		if (this.currentState) {
			this.emit({
				...this.currentState,
				isActive: false,
				msgId: undefined
			});
		}
	}

	getCurrentState(): LiveLocationState | null {
		return this.currentState;
	}

	getMsgId(): string | null {
		return this.msgId;
	}

	private createLiveLocationMessage(
		coords: { latitude: number; longitude: number; accuracy?: number },
		type: 'start' | 'stop'
	): string {
		const params = new URLSearchParams({
			liveLocationId: this.liveLocationId,
			rid: this.rid,
			tmid: this.tmid || '',
			provider: this.provider,
			action: 'reopen'
		});
		const appDeepLink = `rocketchat://live-location?${params.toString()}`;

		if (type === 'start') {
			return `📍 **${I18n.t('Live_Location_Start_Title')}**

[🔴 ${I18n.t('View_Live_Location')}](${appDeepLink})

${I18n.t('Coordinates', { lat: coords.latitude.toFixed(6), lon: coords.longitude.toFixed(6) })}`;
		}
		return `📍 **${I18n.t('Live_Location_Ended_Title')}** (ID: ${this.liveLocationId})`;
	}
}

export function generateLiveLocationId(): string {
	return `live_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function createLiveLocationMessage(
	liveLocationId: string,
	provider: MapProviderName,
	coords: { latitude: number; longitude: number },
	_serverUrl: string,
	rid?: string,
	tmid?: string
): string {
	const params = new URLSearchParams({
		liveLocationId,
		rid: rid || '',
		tmid: tmid || '',
		provider,
		action: 'reopen'
	});
	const appDeepLink = `rocketchat://live-location?${params.toString()}`;

	return `📍 **${I18n.t('Live_Location_Start_Title')}**

[🔴 ${I18n.t('View_Live_Location')}](${appDeepLink})`;
}

export function createLiveLocationStopMessage(
	liveLocationId: string,
	_provider: MapProviderName,
	_lastCoords: { latitude: number; longitude: number }
): string {
	return `📍 **${I18n.t('Live_Location_Ended_Title')}** (ID: ${liveLocationId})`;
}
