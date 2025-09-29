import * as Location from 'expo-location';

export type Coords = { latitude: number; longitude: number; accuracy?: number; timestamp?: number };

const LOCATION_TIMEOUT_MS = 15_000;
const LAST_KNOWN_MAX_AGE_MS = 15_000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
	return new Promise((resolve, reject) => {
		const t = setTimeout(() => {
			reject(new Error('Location request timed out'));
		}, ms);

		p.then(v => {
			clearTimeout(t);
			resolve(v);
		}).catch(e => {
			clearTimeout(t);
			reject(e);
		});
	});
}

export async function getCurrentPositionOnce(): Promise<Coords> {
	try {
		// Try cached location first
		try {
			const last = await Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS });

			if (last?.coords) {
				const { latitude, longitude, accuracy } = last.coords;
				return {
					latitude,
					longitude,
					accuracy: accuracy ?? undefined,
					timestamp: last.timestamp
				};
			}
		} catch (e) {
			// Use fresh location if cached fails
		}

		// Get fresh position with balanced accuracy for battery optimization
		const loc = await withTimeout(
			Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.Balanced // Lower accuracy for better battery life
			}),
			LOCATION_TIMEOUT_MS
		);

		const { latitude, longitude, accuracy } = loc.coords;
		return {
			latitude,
			longitude,
			accuracy: accuracy ?? undefined,
			timestamp: loc.timestamp
		};
	} catch (error) {
		throw error;
	}
}
