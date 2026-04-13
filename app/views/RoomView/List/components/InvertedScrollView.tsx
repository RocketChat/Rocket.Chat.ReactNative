import type { ComponentType } from 'react';
import { type ScrollViewProps } from 'react-native';

import InvertedScrollViewAdapter from './RNLikeInvertedScrollView';

interface InvertedScrollViewProps extends ScrollViewProps {
	exitFocusNativeId?: string;
}

export default InvertedScrollViewAdapter as ComponentType<InvertedScrollViewProps>;
