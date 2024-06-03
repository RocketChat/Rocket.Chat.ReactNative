import React, { useEffect, useRef } from 'react';
import { Animated, Easing, TouchableWithoutFeedback } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import styles from '../styles';
import { headerHeight } from '../../../lib/methods/helpers/navigation';
import * as List from '../../../containers/List';
import { Filter } from '../filters';
import DropdownItemFilter from './DropdownItemFilter';
import DropdownItemHeader from './DropdownItemHeader';
import { useTheme } from '../../../theme';

const ANIMATION_DURATION = 200;

interface IDropdownProps {
	isMasterDetail?: boolean;
	currentFilter: Filter;
	onClose: () => void;
	onFilterSelected: (value: Filter) => void;
}

const Dropdown = ({ isMasterDetail, currentFilter, onClose, onFilterSelected }: IDropdownProps) => {
	const animatedValue = useRef(new Animated.Value(0)).current;
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();

	useEffect(() => {
		Animated.timing(animatedValue, {
			toValue: 1,
			duration: ANIMATION_DURATION,
			easing: Easing.inOut(Easing.quad),
			useNativeDriver: true
		}).start();
	}, [animatedValue]);

	const close = () => {
		Animated.timing(animatedValue, {
			toValue: 0,
			duration: ANIMATION_DURATION,
			easing: Easing.inOut(Easing.quad),
			useNativeDriver: true
		}).start(() => onClose());
	};

	const heightDestination = isMasterDetail ? headerHeight + insets.top : 0;

	const translateY = animatedValue.interpolate({
		inputRange: [0, 1],
		outputRange: [-300, heightDestination] // approximated height of the component when closed/open
	});

	const backdropOpacity = animatedValue.interpolate({
		inputRange: [0, 1],
		outputRange: [0, colors.backdropOpacity]
	});

	return (
		<>
			<TouchableWithoutFeedback onPress={close}>
				<Animated.View
					style={[
						styles.backdrop,
						{
							transform: [{ translateY }],
							backgroundColor: colors.surfaceRoom,
							borderColor: colors.strokeLight,
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
						backgroundColor: colors.surfaceRoom,
						borderColor: colors.surfaceSelected
					}
				]}>
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
