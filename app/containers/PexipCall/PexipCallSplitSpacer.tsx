import { View } from 'react-native';

import { useIsPexipCallSplit } from '~/lib/services/videoConf/usePexipCallStore';
import { usePexipSplitLayout } from './usePexipSplitLayout';

const PexipCallSplitSpacer = () => {
	const isSplit = useIsPexipCallSplit();
	const { isLandscape, size } = usePexipSplitLayout();
	if (!isSplit) return null;
	return (
		<View
			style={[isLandscape ? { width: size } : { height: size }, { backgroundColor: '#000' }]}
			testID='pexip-call-split-spacer'
		/>
	);
};

export default PexipCallSplitSpacer;
