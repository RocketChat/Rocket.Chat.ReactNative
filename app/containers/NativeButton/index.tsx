import { TouchableNativeFeedback, TouchableOpacity, type TouchableOpacityProps, View } from 'react-native';

import { isIOS } from '~/lib/methods/helpers/deviceInfo';

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
