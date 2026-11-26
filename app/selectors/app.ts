import { type IApplicationState } from '../definitions/redux';
import { RootEnum } from '../definitions/redux/TRootEnum';

const readyRoots = new Set<RootEnum | undefined>([
	RootEnum.ROOT_INSIDE,
	RootEnum.ROOT_OUTSIDE,
	RootEnum.ROOT_SET_USERNAME,
	RootEnum.ROOT_SHARE_EXTENSION
]);

export const isAppReady = (state: IApplicationState): boolean => readyRoots.has(state.app.root);
