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
	private tickInterval: ReturnType<typeof setInterval> | null = null;
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

		// 3) Initial position with balanced accuracy for battery optimization
		const first = await Location.getCurrentPositionAsync({
			accuracy: Location.Accuracy.Balanced, // Better battery life
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

		// 4) Subscribe to updates with battery-optimized settings
		this.watchSub = await Location.watchPositionAsync(
			{
				accuracy: Location.Accuracy.Balanced, // Better battery life than High
				timeInterval: 10_000, // ms - minimum time between updates
				distanceInterval: 5 // Only update if moved at least 5 meters
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
				isActive: false
				// Keep the original timestamp from when location was last received
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
	liveLocationId: string,
	_provider: MapProviderName,
	_lastCoords: { latitude: number; longitude: number }
): string {
	return `📍 **Live Location Ended** (ID: ${liveLocationId})`;
}
