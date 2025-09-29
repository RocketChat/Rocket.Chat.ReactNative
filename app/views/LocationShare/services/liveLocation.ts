import * as Location from 'expo-location';
import { MapProviderName } from './mapProviders';

export type LiveLocationState = {
	coords: {
		latitude: number;
		longitude: number;
		accuracy?: number;
	};
	timestamp: number;
	isActive: boolean;
};

export class LiveLocationTracker {
	private watchSub: Location.LocationSubscription | null = null;
	private tickInterval: NodeJS.Timeout | null = null;
	private onLocationUpdate: ((state: LiveLocationState) => void) | null = null;
	private currentState: LiveLocationState | null = null;

	constructor(onUpdate: (state: LiveLocationState) => void) {
		this.onLocationUpdate = onUpdate;
	}

	private emit(state: LiveLocationState) {
		this.currentState = state;
		this.onLocationUpdate?.(state);
	}

	async startTracking(): Promise<void> {
		// 1) Permissions
		let { status } = await Location.getForegroundPermissionsAsync();
		if (status !== 'granted') {
			const r = await Location.requestForegroundPermissionsAsync();
			status = r.status;
		}
		if (status !== 'granted') {
			throw new Error('Location permission not granted');
		}

		// 2) Services enabled (GPS)
		const servicesOn = await Location.hasServicesEnabledAsync();
		if (!servicesOn) {
			throw new Error('Location services are turned off');
		}

		// 3) Initial position (so UI renders immediately)
		const first = await Location.getCurrentPositionAsync({
			accuracy: Location.Accuracy.High,
			mayShowUserSettingsDialog: true
		});
		this.emit({
			coords: {
				latitude: first.coords.latitude,
				longitude: first.coords.longitude,
				accuracy: first.coords.accuracy ?? undefined
			},
			timestamp: Date.now(),
			isActive: true
		});

		// 4) Subscribe to updates (~every 10s or when moving)
		this.watchSub = await Location.watchPositionAsync(
			{
				accuracy: Location.Accuracy.High,
				timeInterval: 10_000, // ms
				distanceInterval: 0 // set to e.g. 5 to throttle by meters
			},
			pos => {
				// Update coordinates but don't emit - let setInterval control timing
				this.currentState = {
					coords: {
						latitude: pos.coords.latitude,
						longitude: pos.coords.longitude,
						accuracy: pos.coords.accuracy ?? undefined
					},
					timestamp: Date.now(),
					isActive: true
				};
			}
		);

		// 5) Keep timestamp fresh even if coords don’t change
		this.tickInterval = setInterval(() => {
			if (this.currentState) {
				this.emit({
					...this.currentState,
					timestamp: Date.now(),
					isActive: true
				});
			}
		}, 10_000);
	}

	stopTracking(): void {
		if (this.watchSub) {
			this.watchSub.remove();
			this.watchSub = null;
		}
		if (this.tickInterval) {
			clearInterval(this.tickInterval);
			this.tickInterval = null;
		}
		if (this.currentState) {
			this.emit({
				...this.currentState,
				isActive: false,
				timestamp: Date.now()
			});
		}
	}

	getCurrentState(): LiveLocationState | null {
		return this.currentState;
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

	return `📍 **Live Location Start**

[🔴 View Live Location](${appDeepLink})`;
}

export function createLiveLocationStopMessage(
	_liveLocationId: string,
	_provider: MapProviderName,
	_lastCoords: { latitude: number; longitude: number }
): string {
	return `📍 **Live Location Ended**`;
}
