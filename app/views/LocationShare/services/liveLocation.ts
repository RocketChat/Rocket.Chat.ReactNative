import { Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { MapProviderName, staticMapUrl } from './mapProviders';

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
	private watchId: number | null = null;
	private updateInterval: NodeJS.Timeout | null = null;
	private onLocationUpdate: ((state: LiveLocationState) => void) | null = null;
	private currentState: LiveLocationState | null = null;
	// TEST LOCATION VARIABLES - REMOVE AFTER TESTING
	private testLocationIndex: number = 0;

	constructor(onUpdate: (state: LiveLocationState) => void) {
		this.onLocationUpdate = onUpdate;
	}

	// TEST LOCATIONS - REMOVE THIS FUNCTION AFTER TESTING
	private getTestLocations() {
		return [
			{ latitude: 37.78583, longitude: -122.40642, accuracy: 5 }, // Starting point (near Union Square, SF)
			{ latitude: 37.78703, longitude: -122.40542, accuracy: 8 }, // Moving north-east
			{ latitude: 37.78823, longitude: -122.40442, accuracy: 12 }, // Continue north-east (near Chinatown)
			{ latitude: 37.78943, longitude: -122.40342, accuracy: 6 }, // Continue north-east
			{ latitude: 37.79063, longitude: -122.40242, accuracy: 15 }, // Moving towards North Beach
			{ latitude: 37.79183, longitude: -122.40142, accuracy: 4 }, // Continue north-east
			{ latitude: 37.79303, longitude: -122.40042, accuracy: 18 }, // Near Russian Hill
			{ latitude: 37.79423, longitude: -122.39942, accuracy: 7 }, // Moving up the hill
			{ latitude: 37.79543, longitude: -122.39842, accuracy: 22 }, // Near Lombard Street
			{ latitude: 37.79663, longitude: -122.39742, accuracy: 9 } // Near top of Russian Hill
		];
	}

	// TEST FUNCTION - REMOVE AFTER TESTING
	private simulateLocationUpdate() {
		const testLocations = this.getTestLocations();
		const currentLocation = testLocations[this.testLocationIndex % testLocations.length];

		console.log(`[TEST] Simulating location ${this.testLocationIndex + 1}:`, currentLocation);

		this.currentState = {
			coords: currentLocation,
			timestamp: Date.now(),
			isActive: true
		};

		if (this.onLocationUpdate) {
			this.onLocationUpdate(this.currentState);
		}

		this.testLocationIndex++;
	}

	async startTracking(): Promise<void> {
		// TEMPORARY TEST CODE - REPLACE WITH REAL GPS AFTER TESTING
		console.log('[TEST] Starting location tracking with simulated data');

		// Immediately provide first location
		this.simulateLocationUpdate();

		// Set up interval to update location every 10 seconds
		this.updateInterval = setInterval(() => {
			this.simulateLocationUpdate();
		}, 10000);

		return Promise.resolve();

		/* REAL GPS CODE - UNCOMMENT AFTER TESTING AND REMOVE TEST CODE ABOVE
    if (Platform.OS === 'ios') {
      const status = await Geolocation.requestAuthorization('whenInUse');
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }
    }

    return new Promise((resolve, reject) => {
      this.watchId = Geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          this.currentState = {
            coords: { latitude, longitude, accuracy },
            timestamp: Date.now(),
            isActive: true
          };
          
          if (this.onLocationUpdate) {
            this.onLocationUpdate(this.currentState);
          }
          resolve();
        },
        (error) => {
          console.error('Live location error:', error);
          reject(new Error(error.message || 'Failed to start live location'));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
          interval: 10000,
          fastestInterval: 5000,
          forceRequestLocation: true,
          showLocationDialog: true
        }
      );

      // Timer to ensure UI updates every 10 seconds
      this.updateInterval = setInterval(() => {
        if (this.currentState && this.onLocationUpdate) {
          this.currentState = {
            ...this.currentState,
            timestamp: Date.now()
          };
          this.onLocationUpdate(this.currentState);
        }
      }, 10000);
    });
    */
	}

	stopTracking(): void {
		if (this.watchId !== null) {
			Geolocation.clearWatch(this.watchId);
			this.watchId = null;
		}

		if (this.updateInterval) {
			clearInterval(this.updateInterval);
			this.updateInterval = null;
		}

		if (this.currentState) {
			this.currentState.isActive = false;
			if (this.onLocationUpdate) {
				this.onLocationUpdate(this.currentState);
			}
		}

		console.log('[LiveLocationTracker] Tracking stopped');
	}

	getCurrentState(): LiveLocationState | null {
		return this.currentState;
	}
}

export function generateLiveLocationId(): string {
	return `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createLiveLocationMessage(
	liveLocationId: string,
	provider: MapProviderName,
	coords: { latitude: number; longitude: number },
	serverUrl: string,
	rid?: string,
	tmid?: string
): string {
	const { latitude, longitude } = coords;

	// Nice, human-readable coordinate text for the message body
	const locationText = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

	// Build deeplink params so the app can identify/restore the exact session
	const params = new URLSearchParams({
		liveLocationId,
		rid: rid || '',
		tmid: tmid || '',
		provider,
		action: 'reopen'
	});
	// 🚀 App deeplink that targets this specific live session
	const appDeepLink = `rocketchat://live-location?${params.toString()}`;

	// Keep the message simple Markdown so your existing sendMessage(rid, msg, ...) works
	return `📍 **Live Location**

[🔴 View Live Location](${appDeepLink})`;
}

export function createLiveLocationStopMessage(
	liveLocationId: string,
	provider: MapProviderName,
	lastCoords: { latitude: number; longitude: number }
): string {
	const { latitude, longitude } = lastCoords;
	const locationText = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

	return `📍 **Live Location Ended**

Final location: ${locationText}
*This live location session has ended*`;
}
