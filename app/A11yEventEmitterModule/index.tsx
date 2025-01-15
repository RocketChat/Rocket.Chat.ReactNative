import { NativeModules } from 'react-native';

const { A11yEvent } = NativeModules;

// Function to get the next accessibility focusable element
const getNextFocusableElement = async () => {
	try {
		const elementDescription = await new Promise((resolve, reject) => {
			A11yEvent.getNextAccessibilityFocus((response: any) => {
				if (response) {
					resolve(response);
				} else {
					reject('No focusable element found');
				}
			});
		});
		console.log('Next Focusable Element:', elementDescription);
	} catch (error) {
		console.error('Error:', error);
	}
};

export { getNextFocusableElement };
