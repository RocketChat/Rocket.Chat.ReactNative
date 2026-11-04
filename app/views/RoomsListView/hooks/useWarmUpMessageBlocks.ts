import { useEffect } from 'react';

import { warmUpMessageBlocks } from '~/containers/UIKit/warmUpMessageBlocks';

export const useWarmUpMessageBlocks = (): void => {
	useEffect(() => {
		const idleCallback = requestIdleCallback(warmUpMessageBlocks);
		return () => cancelIdleCallback(idleCallback);
	}, []);
};
