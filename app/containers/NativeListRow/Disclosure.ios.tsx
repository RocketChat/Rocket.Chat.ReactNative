import { Host } from '@expo/ui/swift-ui';

import NativeListIndicator from '~/containers/List/native/Indicator.ios';

const Disclosure = () => (
	<Host matchContents>
		<NativeListIndicator indicator='disclosure' />
	</Host>
);

export default Disclosure;
