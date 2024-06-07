import React, { useEffect, useRef } from 'react';
import { Animated, Easing, FlatList, TouchableWithoutFeedback } from 'react-native';

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
	const animatedValue = useRef(new Animated.Value(0)).current;
	const { colors } = useTheme();

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

	const translateY = animatedValue.interpolate({
		inputRange: [0, 1],
		outputRange: [-300, HEIGHT_DESTINATION] // approximated height of the component when closed/open
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
							backgroundColor: colors.backdropColor,
							opacity: backdropOpacity,
							top: HEIGHT_DESTINATION
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
						borderColor: colors.strokeLight
					}
				]}>
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
