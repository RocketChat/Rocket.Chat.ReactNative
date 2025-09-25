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
		// Skip Expo permission request since it's handled manually in ActionsButton.tsx

		// 1) Fast path: last known (if fresh enough)
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
			// ignore and fall through to fresh fetch
		}

		// 2) Fresh position, with our own timeout wrapper
		const loc = await withTimeout(
			Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.High
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
