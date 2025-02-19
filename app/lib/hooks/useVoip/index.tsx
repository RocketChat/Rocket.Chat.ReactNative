import { useDispatch } from 'react-redux';

import { startCall } from '../../../actions/voip';

export const useVoip = (): { startCall: (digitis: string) => void } => {
	const dispatch = useDispatch();

	return { startCall: (digits: string) => dispatch(startCall(digits)) };
};
