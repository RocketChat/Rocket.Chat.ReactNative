import React from 'react';
import { RectButton, RectButtonProps } from 'react-native-gesture-handler';

import { themes } from '../constants/colors';

interface ITouchProps extends RectButtonProps {
	children: React.ReactNode;
	theme: string;
	accessibilityLabel?: string;
	testID?: string;
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
		const { children, onPress, theme, underlayColor, ...props } = this.props;

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
