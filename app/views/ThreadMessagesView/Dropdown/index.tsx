import React from 'react';
import { Animated, Easing, TouchableWithoutFeedback } from 'react-native';
import { EdgeInsets, withSafeAreaInsets } from 'react-native-safe-area-context';

import styles from '../styles';
import { themes } from '../../../constants/colors';
import { withTheme } from '../../../theme';
import { headerHeight } from '../../../containers/Header';
import * as List from '../../../containers/List';
import { Filter } from '../filters';
import DropdownItemFilter from './DropdownItemFilter';
import DropdownItemHeader from './DropdownItemHeader';

const ANIMATION_DURATION = 200;

interface IDropdownProps {
	isMasterDetail?: boolean;
	theme?: string;
	insets?: EdgeInsets;
	currentFilter: Filter;
	onClose: () => void;
	onFilterSelected: (value: Filter) => void;
}

class Dropdown extends React.Component<IDropdownProps> {
	private animatedValue: Animated.Value;

	constructor(props: IDropdownProps) {
		super(props);
		this.animatedValue = new Animated.Value(0);
	}

	componentDidMount() {
		Animated.timing(this.animatedValue, {
			toValue: 1,
			duration: ANIMATION_DURATION,
			easing: Easing.inOut(Easing.quad),
			useNativeDriver: true
		}).start();
	}

	close = () => {
		const { onClose } = this.props;
		Animated.timing(this.animatedValue, {
			toValue: 0,
			duration: ANIMATION_DURATION,
			easing: Easing.inOut(Easing.quad),
			useNativeDriver: true
		}).start(() => onClose());
	};

	render() {
		const { isMasterDetail, insets, theme, currentFilter, onFilterSelected } = this.props;
		const statusBarHeight = insets?.top ?? 0;
		const heightDestination = isMasterDetail ? headerHeight + statusBarHeight : 0;
		const translateY = this.animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [-300, heightDestination] // approximated height of the component when closed/open
		});
		const backdropOpacity = this.animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [0, themes[theme!].backdropOpacity]
		});
		return (
			<>
				<TouchableWithoutFeedback onPress={this.close}>
					<Animated.View
						style={[
							styles.backdrop,
							{
								backgroundColor: themes[theme!].backdropColor,
								opacity: backdropOpacity,
								top: heightDestination
							}
						]}
					/>
				</TouchableWithoutFeedback>
				<Animated.View
					style={[
						styles.dropdownContainer,
						{
							transform: [{ translateY }],
							backgroundColor: themes[theme!].backgroundColor,
							borderColor: themes[theme!].separatorColor
						}
					]}>
					<DropdownItemHeader currentFilter={currentFilter} onPress={this.close} />
					<List.Separator />
					<DropdownItemFilter currentFilter={currentFilter} value={Filter.All} onPress={onFilterSelected} />
					<DropdownItemFilter currentFilter={currentFilter} value={Filter.Following} onPress={onFilterSelected} />
					<DropdownItemFilter currentFilter={currentFilter} value={Filter.Unread} onPress={onFilterSelected} />
				</Animated.View>
			</>
		);
	}
}

export default withTheme(withSafeAreaInsets(Dropdown));
