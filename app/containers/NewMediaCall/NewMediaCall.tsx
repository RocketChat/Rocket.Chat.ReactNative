import React, { useEffect } from 'react';

import { PeerList } from './PeerList';
import { SelectedPeer } from './SelectedPeer';
import { Container } from './Container';
import { CreateCall } from './CreateCall';
import { usePeerAutocompleteStore } from '../../lib/services/voip/usePeerAutocompleteStore';

export const NewMediaCall = (): React.ReactElement => {
	// reset the store when the action sheet is closed
	const reset = usePeerAutocompleteStore(state => state.reset);
	useEffect(() => () => reset(), [reset]);

	return (
		<Container>
			<SelectedPeer />
			<PeerList />
			<CreateCall />
		</Container>
	);
};
