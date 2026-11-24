import { useHeaderHeight } from '@react-navigation/elements';

import NowPlayingAudio from '~/containers/NowPlayingAudio';
import { hasNativeHeaderBar } from '~/lib/methods/helpers/deviceInfo';

const RoomsListNowPlayingAudio = () => {
	const headerHeight = useHeaderHeight();
	return <NowPlayingAudio style={hasNativeHeaderBar ? { marginTop: headerHeight } : undefined} />;
};

export default RoomsListNowPlayingAudio;
