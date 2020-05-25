import { useState, useEffect } from 'react';
import Orientation from 'react-native-orientation-locker';

export default function useOrientation() {
	const [orientation, setOrientation] = useState(Orientation.getInitialOrientation());

	useEffect(() => {
		function onOrientationDidChange(data) {
			setOrientation(data);
		}

		Orientation.addOrientationListener(onOrientationDidChange);
		return () => {
			Orientation.removeOrientationListener(onOrientationDidChange);
		};
	});

	return orientation;
}
