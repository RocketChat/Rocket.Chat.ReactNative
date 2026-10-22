import { useStore } from 'react-redux';

import { type IApplicationState } from '~/definitions';
import { getUserSelector } from '~/selectors/login';

const sessionOf = (state: IApplicationState) => ({ server: state.server.server, userId: getUserSelector(state).id });

export const useCaptureSession = () => {
	const store = useStore<IApplicationState>();
	return () => {
		const captured = sessionOf(store.getState());
		return () => {
			const current = sessionOf(store.getState());
			return current.server === captured.server && current.userId === captured.userId;
		};
	};
};
