import React from 'react';
import { RectButton, RectButtonProps } from 'react-native-gesture-handler';
import { TouchableOpacity } from 'react-native';

import { TSupportedThemes } from '../theme';
import { themes } from '../lib/constants';

interface ITouchProps extends RectButtonProps {
	children: React.ReactNode;
	theme: TSupportedThemes;
	accessibilityLabel?: string;
	testID?: string;
	touchable?: boolean;
}

class Touch extends React.Component<ITouchProps> {
	private ref: any;

	setNativeProps(props: ITouchProps): void {
		this.ref.setNativeProps(props);
	}

	getRef = (ref: RectButton): void => {
		this.ref = ref;
	};

	render(): JSX.Element {
		const { children, onPress, theme, underlayColor, touchable, ...props } = this.props;

		if (touchable) {
			return (
				<TouchableOpacity onPress={onPress as () => {}} {...(props as any)}>
					{children}
				</TouchableOpacity>
			);
		}
		return (
			<RectButton
				ref={this.getRef}
				onPress={onPress}
				activeOpacity={1}
				underlayColor={underlayColor || themes[theme].bannerBackground}
				rippleColor={themes[theme].bannerBackground}
				{...props}>
				{children}
			</RectButton>
		);
	}
}

export default Touch;
