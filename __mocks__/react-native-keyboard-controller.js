export const KeyboardController = {
	addListener: jest.fn(),
	removeListener: jest.fn(),
	dismiss: jest.fn(() => Promise.resolve()),
	setFocusTo: jest.fn(async () => {})
};

export const useKeyboardHandler = () => {};

export const useReanimatedKeyboardAnimation = () => ({
	height: { value: 0 },
	progress: { value: 0 }
});

export default { KeyboardController, useKeyboardHandler, useReanimatedKeyboardAnimation };
