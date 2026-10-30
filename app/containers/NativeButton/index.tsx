import {
	type StyleProp,
	TouchableNativeFeedback,
	TouchableOpacity,
	type TouchableOpacityProps,
	View,
	type ViewStyle
} from 'react-native';

import { isIOS } from '~/lib/methods/helpers';

interface INativeButtonProps extends Omit<TouchableOpacityProps, 'style'> {
	style?: StyleProp<ViewStyle>;
}

const NativeButton = (props: INativeButtonProps) => {
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
