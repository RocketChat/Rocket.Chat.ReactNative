import React, {
	useRef,
	useState,
	forwardRef,
	useImperativeHandle
} from 'react';
import PropTypes from 'prop-types';
import { View, Keyboard, Dimensions } from 'react-native';
import ScrollBottomSheet from 'react-native-scroll-bottom-sheet';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import Item from './Item';

import Separator from '../Separator';
import { themes } from '../../constants/colors';
import styles from './styles';

const { height } = Dimensions.get('window');

const SNAP_POINTS = [128, '50%', height];

const ActionSheet = forwardRef(({ children, theme }, ref) => {
	const bottomSheetRef = useRef(null);
	const fall = new Animated.Value(0);
	const [content, setContent] = useState([]);

	const opacity = Animated.interpolate(fall, {
		inputRange: [0, 1],
		outputRange: [0, 0.5]
	});

	const hideActionSheet = () => {
		bottomSheetRef.current?.snapTo(2);
	};

	const showActionSheetWithOptions = ({ options }) => {
		Keyboard.dismiss();
		setContent(options);
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		bottomSheetRef.current?.snapTo(1);
	};

	useImperativeHandle(ref, () => ({
		showActionSheetWithOptions,
		hideActionSheet
	}));

	const renderHeader = () => (
		<View style={[styles.header, { backgroundColor: themes[theme].backgroundColor }]}>
			<View style={[styles.headerIndicator, { backgroundColor: themes[theme].auxiliaryText }]} />
		</View>
	);

	return (
		<>
			{children}
			<Animated.View
				pointerEvents='none'
				style={[
					styles.shadow,
					{
						backgroundColor: themes[theme].backdropColor,
						opacity
					}
				]}
			/>
			<ScrollBottomSheet
				ref={bottomSheetRef}
				componentType='FlatList'
				snapPoints={SNAP_POINTS}
				initialSnapIndex={2}
				renderHandle={renderHeader}
				animatedPosition={fall}
				data={content}
				renderItem={({ item }) => (
					<Item
						item={item}
						onPress={() => {
							item.onPress();
							hideActionSheet();
						}}
						theme={theme}
					/>
				)}
				style={{ backgroundColor: themes[theme].backgroundColor }}
				contentContainerStyle={styles.content}
				ListHeaderComponent={() => <Separator theme={theme} />}
				ItemSeparatorComponent={() => <Separator theme={theme} />}
			/>
		</>
	);
});
ActionSheet.propTypes = {
	children: PropTypes.node,
	theme: PropTypes.string
};

export default ActionSheet;
