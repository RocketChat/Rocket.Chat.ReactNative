import { useRef } from 'react';
import { AccessibilityInfo } from 'react-native';

import { usePrevious } from './usePrevious';

interface IUseA11yErrorAnnouncement {
	error: string | undefined;
}

const useA11yErrorAnnouncement = ({ error }: IUseA11yErrorAnnouncement) => {
	const previousMessage = usePrevious(error);
	const announced = useRef<boolean>(false);
	const shouldAnnounce = error && error !== previousMessage && !announced.current;
	if (shouldAnnounce) {
		const message = error || '';
		if (message) {
			AccessibilityInfo.announceForAccessibility(message);
			announced.current = true;
		}
	}
	announced.current = false;
};

export default useA11yErrorAnnouncement;
