import React from 'react';

import { PeerList } from './PeerList';
import { SelectedPeer } from './SelectedPeer';
import { Container } from './Container';
import { CreateCall } from './CreateCall';

export const NewMediaCall = (): React.ReactElement => (
	<Container>
		<SelectedPeer />
		<PeerList />
		<CreateCall />
	</Container>
);
