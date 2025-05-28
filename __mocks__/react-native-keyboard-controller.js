export const KeyboardController = {
	addListener: jest.fn(),
	removeListener: jest.fn(),
	dismiss: jest.fn(async () => {}),
	setFocusTo: jest.fn(async () => {})
	// Add any other methods you use in your code
};

export const useKeyboardHandler = () => {};

export const useReanimatedKeyboardAnimation = () => ({
	height: { value: 0 },
	progress: { value: 0 }
});

export default { KeyboardController, useKeyboardHandler, useReanimatedKeyboardAnimation };
