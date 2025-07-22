import { useRef } from 'react';
import { AccessibilityInfo } from 'react-native';

import { useDebounce } from '../methods/helpers';
import { textInputDebounceTime } from '../constants';

interface IUseA11yErrorAnnouncement {
	error: string | undefined;
}

const useA11yErrorAnnouncement = ({ error }: IUseA11yErrorAnnouncement) => {
	const previousMessage = useRef<string>(error);
	const announced = useRef<boolean>(false);
	const shouldAnnounce = error && error !== previousMessage.current && !announced.current;

	const handleA11yAnnouncement = useDebounce(() => {
		if (shouldAnnounce) {
			const message = (error || '').trim();
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
