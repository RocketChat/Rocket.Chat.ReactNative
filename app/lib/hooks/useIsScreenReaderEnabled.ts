import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export const useIsScreenReaderEnabled = (): boolean => {
	const [enabled, setEnabled] = useState(false);

	useEffect(() => {
		let ignore = false;
		AccessibilityInfo.isScreenReaderEnabled().then(result => {
			if (!ignore) {
				setEnabled(result);
			}
		});
		const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', result => {
			if (!ignore) {
				setEnabled(result);
			}
		});
		return () => {
			ignore = true;
			subscription.remove();
		};
	}, []);

	return enabled;
};
