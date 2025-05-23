export const KeyboardController = {
	addListener: jest.fn(),
	removeListener: jest.fn(),
	dismiss: jest.fn(async () => {}),
	setFocusTo: jest.fn(async () => {})
	// Add any other methods you use in your code
};
export const useKeyboardHandler = () => {};
export default { KeyboardController, useKeyboardHandler };
