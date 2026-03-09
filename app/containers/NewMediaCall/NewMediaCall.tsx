import React, { useEffect } from 'react';

import { PeerList } from './PeerList';
import { SelectedPeer } from './SelectedPeer';
import { Container } from './Container';
import { CreateCall } from './CreateCall';
import { FilterHeader } from './FilterHeader';
import { usePeerAutocompleteStore } from '../../lib/services/voip/usePeerAutocompleteStore';

export const NewMediaCall = (): React.ReactElement => {
	// reset the store when the action sheet is closed
	const reset = usePeerAutocompleteStore(state => state.reset);
	useEffect(() => () => reset(), [reset]);

	return (
		<Container>
			<FilterHeader />
			<SelectedPeer />
			<PeerList />
			<CreateCall />
		</Container>
	);
};
