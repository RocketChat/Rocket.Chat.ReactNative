import { ViewStyle } from 'react-native';

import { EDGE_DISTANCE } from '../../constants';

export const useNavBottomStyle = (): ViewStyle => ({
	top: EDGE_DISTANCE,
	scaleY: -1
});
