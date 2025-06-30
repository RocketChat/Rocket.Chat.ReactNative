import { useRef } from 'react';
import { AccessibilityInfo } from 'react-native';

import { usePrevious } from './usePrevious';
import { useDebounce } from '../methods/helpers';
import { textInputDebounceTime } from '../constants';

interface IUseA11yErrorAnnouncement {
	error: string | undefined;
}

const useA11yErrorAnnouncement = ({ error }: IUseA11yErrorAnnouncement) => {
	const previousMessage = usePrevious(error);
	const announced = useRef<boolean>(false);
	const shouldAnnounce = error && error !== previousMessage && !announced.current;

	const handleA11yAnnouncement = useDebounce(() => {
		if (shouldAnnounce) {
			const message = error || '';
			if (message) {
				AccessibilityInfo.announceForAccessibility(message);
				announced.current = true;
			}
		} else if (!error) {
			announced.current = false;
		}
	}, textInputDebounceTime);

	handleA11yAnnouncement();
};

export default useA11yErrorAnnouncement;
