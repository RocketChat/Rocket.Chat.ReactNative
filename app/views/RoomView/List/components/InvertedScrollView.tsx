import type { ComponentType } from 'react';
import { type ScrollViewProps } from 'react-native';

import RNLikeInvertedScrollView from './RNLikeInvertedScrollView';

interface InvertedScrollViewProps extends ScrollViewProps {
	exitFocusNativeId?: string;
}

export default RNLikeInvertedScrollView as ComponentType<InvertedScrollViewProps>;
