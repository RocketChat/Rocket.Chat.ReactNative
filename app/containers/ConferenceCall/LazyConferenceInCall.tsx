import { type ComponentType, lazy, type ReactElement, Suspense } from 'react';

import ActivityIndicator from '~/containers/ActivityIndicator';

const ConferenceInCall = lazy(() => Promise.resolve(require('./ConferenceInCall') as { default: ComponentType }));

const LazyConferenceInCall = (): ReactElement => (
	<Suspense fallback={<ActivityIndicator />}>
		<ConferenceInCall />
	</Suspense>
);

export default LazyConferenceInCall;
