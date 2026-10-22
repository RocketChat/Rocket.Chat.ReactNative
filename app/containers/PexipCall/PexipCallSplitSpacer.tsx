import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { hasNativeHeaderBar } from '~/lib/methods/helpers/deviceInfo';
import { useIsPexipCallSplit } from '~/lib/services/videoConf/usePexipCallStore';
import { usePexipSplitLayout } from './usePexipSplitLayout';

const PexipCallSplitSpacer = () => {
	const isSplit = useIsPexipCallSplit();
	const { isLandscape, size } = usePexipSplitLayout();
	const { top } = useSafeAreaInsets();
	if (!isSplit) return null;
	// MediaCallHeader reserves the status bar except on native header bars, so the docked call sits below it here too
	const statusBarHeight = hasNativeHeaderBar ? top : 0;
	return (
		<View
			style={[isLandscape ? { width: size } : { height: size + statusBarHeight }, { backgroundColor: '#000' }]}
			testID='pexip-call-split-spacer'
		/>
	);
};

export default PexipCallSplitSpacer;
