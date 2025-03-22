import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';

import { setNetInfoState } from '../../actions/app';

export default () =>
	(createStore: any) =>
	(...args: any) => {
		const store = createStore(...args);
		let currentType: NetInfoStateType | undefined;
		const handleInternetStateChange = (nextState: NetInfoState) => {
			if (nextState.type !== currentType) {
				store.dispatch(setNetInfoState(nextState.type));
				currentType = nextState.type;
			}
		};
		NetInfo.addEventListener(handleInternetStateChange);
		return store;
	};
