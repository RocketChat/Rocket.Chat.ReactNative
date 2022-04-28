import { RectReturn } from '@wdio/protocols/build/types';

/**
 * To make a Gesture methods more robust for multiple devices and also
 * multiple screen sizes the advice is to work with percentages instead of
 * actual coordinates. The percentages will calculate the position on the
 * screen based on the SCREEN_SIZE which will be determined once if needed
 * multiple times.
 */

let SCREEN_SIZE: RectReturn;
interface XY {
	x: number;
	y: number;
}

/**
 * The values in the below object are percentages of the screen
 */
const SWIPE_DIRECTION = {
	down: {
		start: { x: 50, y: 15 },
		end: { x: 50, y: 85 }
	},
	left: {
		start: { x: 95, y: 50 },
		end: { x: 5, y: 50 }
	},
	right: {
		start: { x: 5, y: 50 },
		end: { x: 95, y: 50 }
	},
	up: {
		start: { x: 50, y: 85 },
		end: { x: 50, y: 15 }
	}
};

async function swipe(from: XY, to: XY) {
	await driver.performActions([
		{
			// a. Create the event
			type: 'pointer',
			id: 'finger1',
			parameters: { pointerType: 'touch' },
			actions: [
				// b. Move finger into start position
				{ type: 'pointerMove', duration: 0, x: from.x, y: from.y },
				// c. Finger comes down into contact with screen
				{ type: 'pointerDown', button: 0 },
				// d. Pause for a little bit
				{ type: 'pause', duration: 100 },
				// e. Finger moves to end position
				//    We move our finger from the center of the element to the
				//    starting position of the element.
				//    Play with the duration to make the swipe go slower / faster
				{ type: 'pointerMove', duration: 1000, x: to.x, y: to.y },
				// f. Finger gets up, off the screen
				{ type: 'pointerUp', button: 0 }
			]
		}
	]);
	// Add a pause, just to make sure the swipe is done
	await driver.pause(1000);
}

function calculateXY({ x, y }: XY, percentage: number): XY {
	return {
		x: x * percentage,
		y: y * percentage
	};
}

function getDeviceScreenCoordinates(screenSize: RectReturn, coordinates: XY): XY {
	return {
		x: Math.round(screenSize.width * (coordinates.x / 100)),
		y: Math.round(screenSize.height * (coordinates.y / 100))
	};
}

async function swipeOnPercentage(from: XY, to: XY) {
	// Get the screen size and store it so it can be re-used.
	// This will save a lot of webdriver calls if this methods is used multiple times.
	SCREEN_SIZE = SCREEN_SIZE || (await driver.getWindowRect());
	// Get the start position on the screen for the swipe
	const pressOptions = getDeviceScreenCoordinates(SCREEN_SIZE, from);
	// Get the move to position on the screen for the swipe
	const moveToScreenCoordinates = getDeviceScreenCoordinates(SCREEN_SIZE, to);

	await swipe(pressOptions, moveToScreenCoordinates);
}

export async function swipeDown(percentage = 1) {
	await swipeOnPercentage(calculateXY(SWIPE_DIRECTION.down.start, percentage), calculateXY(SWIPE_DIRECTION.down.end, percentage));
}

/**
 * Swipe Up based on a percentage
 */
export async function swipeUp(percentage = 1) {
	await swipeOnPercentage(calculateXY(SWIPE_DIRECTION.up.start, percentage), calculateXY(SWIPE_DIRECTION.up.end, percentage));
}

/**
 * Swipe left based on a percentage
 */
export async function swipeLeft(percentage = 1) {
	await swipeOnPercentage(calculateXY(SWIPE_DIRECTION.left.start, percentage), calculateXY(SWIPE_DIRECTION.left.end, percentage));
}

/**
 * Swipe right based on a percentage
 */
export async function swipeRight(percentage = 1) {
	await swipeOnPercentage(
		calculateXY(SWIPE_DIRECTION.right.start, percentage),
		calculateXY(SWIPE_DIRECTION.right.end, percentage)
	);
}
