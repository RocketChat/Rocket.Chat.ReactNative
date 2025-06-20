import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

interface IUseA11yErrorAnnouncement {
	errorMessage: string | undefined;
}

const useA11yErrorAnnouncement = ({ errorMessage }: IUseA11yErrorAnnouncement) => {
	const [errorAnnounced, setErrorAnnounced] = useState(false);

	useEffect(() => {
		if (errorMessage && !errorAnnounced) {
			const message = errorMessage ?? '';
			if (message) {
				console.log('ANNOUNCED');
				AccessibilityInfo.announceForAccessibility(message);
				setErrorAnnounced(true);
			}
		} else if (!errorMessage && errorAnnounced) {
			setErrorAnnounced(false);
		}
	}, [errorMessage]);
};

export default useA11yErrorAnnouncement;
