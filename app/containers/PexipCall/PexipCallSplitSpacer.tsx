import { View } from 'react-native';

import { useIsPexipCallSplit } from '~/lib/services/videoConf/usePexipCallStore';
import { usePexipSplitHeight } from './usePexipSplitHeight';

const PexipCallSplitSpacer = () => {
	const isSplit = useIsPexipCallSplit();
	const height = usePexipSplitHeight();
	if (!isSplit) return null;
	return <View style={{ height, backgroundColor: '#000' }} testID='pexip-call-split-spacer' />;
};

export default PexipCallSplitSpacer;
