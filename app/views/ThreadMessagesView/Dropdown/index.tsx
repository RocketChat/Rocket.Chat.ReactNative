import React, { useEffect } from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import styles from '../styles';
import { headerHeight } from '../../../lib/methods/helpers/navigation';
import * as List from '../../../containers/List';
import { Filter } from '../filters';
import DropdownItemFilter from './DropdownItemFilter';
import DropdownItemHeader from './DropdownItemHeader';
import { useTheme } from '../../../theme';

const ANIMATION_DURATION = 200;
const ANIMATION_PROPS = {
	duration: ANIMATION_DURATION,
	easing: Easing.inOut(Easing.quad)
};

interface IDropdownProps {
	isMasterDetail?: boolean;
	currentFilter: Filter;
	onClose: () => void;
	onFilterSelected: (value: Filter) => void;
}

const Dropdown = ({ isMasterDetail, currentFilter, onClose, onFilterSelected }: IDropdownProps) => {
	const animatedValue = useSharedValue(0);
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();

	useEffect(() => {
		animatedValue.value = withTiming(1, ANIMATION_PROPS);
	}, [animatedValue]);

	const close = () => {
		const runOnClose = () => onClose();
		animatedValue.value = withTiming(0, ANIMATION_PROPS, () => runOnJS(runOnClose)());
	};

	const heightDestination = isMasterDetail ? headerHeight + insets.top : 0;

	const animatedTranslateY = useAnimatedStyle(() => ({
		transform: [
			{
				translateY: interpolate(
					animatedValue.value,
					[0, 1],
					[-300, heightDestination] // approximated height of the component when closed/open
				)
			}
		]
	}));

	const animatedBackdropOpacity = useAnimatedStyle(() => ({
		opacity: interpolate(animatedValue.value, [0, 1], [0, colors.backdropOpacity])
	}));

	return (
		<>
			<TouchableWithoutFeedback onPress={close}>
				<Animated.View
					style={[
						styles.backdrop,
						{
							backgroundColor: colors.backdropColor,
							top: heightDestination
						},
						animatedBackdropOpacity
					]}
				/>
			</TouchableWithoutFeedback>
			<Animated.View
				style={[
					styles.dropdownContainer,
					{
						backgroundColor: colors.backgroundColor,
						borderColor: colors.separatorColor
					},
					animatedTranslateY
				]}
			>
				<DropdownItemHeader currentFilter={currentFilter} onPress={close} />
				<List.Separator />
				<DropdownItemFilter currentFilter={currentFilter} value={Filter.All} onPress={onFilterSelected} />
				<DropdownItemFilter currentFilter={currentFilter} value={Filter.Following} onPress={onFilterSelected} />
				<DropdownItemFilter currentFilter={currentFilter} value={Filter.Unread} onPress={onFilterSelected} />
			</Animated.View>
		</>
	);
};

export default Dropdown;
