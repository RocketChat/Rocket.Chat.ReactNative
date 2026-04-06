import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export const useIsScreenReaderEnabled = (): boolean => {
	const [enabled, setEnabled] = useState(false);

	useEffect(() => {
		AccessibilityInfo.isScreenReaderEnabled().then(setEnabled);
		const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', setEnabled);
		return () => subscription.remove();
	}, []);

	return enabled;
};
