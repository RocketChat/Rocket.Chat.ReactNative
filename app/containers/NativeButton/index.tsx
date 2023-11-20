import React from 'react';
import { TouchableNativeFeedback, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';

import { isIOS } from '../../lib/methods/helpers';

const NativeButton = (props: TouchableOpacityProps) => {
	if (isIOS) {
		return <TouchableOpacity {...props}>{props.children}</TouchableOpacity>;
	}

	return (
		<TouchableNativeFeedback {...props}>
			<View style={props.style}>{props.children}</View>
		</TouchableNativeFeedback>
	);
};

export default NativeButton;
