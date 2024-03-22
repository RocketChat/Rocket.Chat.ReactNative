import React, { useEffect } from 'react';
import { FlatList, TouchableWithoutFeedback } from 'react-native';
import Animated, { Easing, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import styles from '../styles';
import { useTheme } from '../../../theme';
import * as List from '../../../containers/List';
import DropdownItemFilter from './DropdownItemFilter';
import DropdownItemHeader from './DropdownItemHeader';
import { ROW_HEIGHT } from './DropdownItem';
import { ILivechatDepartment } from '../../../definitions/ILivechatDepartment';

const ANIMATION_DURATION = 200;
const HEIGHT_DESTINATION = 0;
const MAX_ROWS = 5;

interface IDropdownProps {
	currentDepartment: ILivechatDepartment;
	onClose: () => void;
	onDepartmentSelected: (value: ILivechatDepartment) => void;
	departments: ILivechatDepartment[];
}

const Dropdown = ({ currentDepartment, onClose, onDepartmentSelected, departments }: IDropdownProps) => {
	const animatedValue = useSharedValue(0);
	const { colors } = useTheme();

	useEffect(() => {
		animatedValue.value = withTiming(1, { duration: ANIMATION_DURATION, easing: Easing.inOut(Easing.quad) });
	}, [animatedValue]);

	const close = () => {
		const runOnClose = () => onClose();
		animatedValue.value = withTiming(0, { duration: ANIMATION_DURATION, easing: Easing.inOut(Easing.quad) }, () =>
			runOnJS(runOnClose)()
		);
	};

	const animatedTranslateY = useAnimatedStyle(() => ({
		transform: [
			{
				translateY: interpolate(
					animatedValue.value,
					[0, 1],
					[-300, HEIGHT_DESTINATION] // approximated height of the component when closed/open
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
							top: HEIGHT_DESTINATION
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
				<DropdownItemHeader department={currentDepartment} onPress={close} />
				<List.Separator />
				<FlatList
					style={{ maxHeight: MAX_ROWS * ROW_HEIGHT }}
					data={departments}
					keyExtractor={item => item._id}
					renderItem={({ item }) => (
						<DropdownItemFilter onPress={onDepartmentSelected} currentDepartment={currentDepartment} value={item} />
					)}
					keyboardShouldPersistTaps='always'
				/>
			</Animated.View>
		</>
	);
};

export default Dropdown;
