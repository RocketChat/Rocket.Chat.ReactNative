import React, {
	useRef,
	useState,
	forwardRef,
	useImperativeHandle
} from 'react';
import PropTypes from 'prop-types';
import { Keyboard } from 'react-native';
import BottomSheet from 'reanimated-bottom-sheet';
import useDeepCompareEffect from 'use-deep-compare-effect';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import Header from './Header';
import Content from './Content';
import Shadow from './Shadow';

import { ITEM_HEIGHT } from './styles';

const ActionSheet = React.memo(forwardRef(({ children, theme }, ref) => {
	const bottomSheetRef = useRef();
	const fall = new Animated.Value(1);
	const [title, setTitle] = useState();
	const [header, setHeader] = useState();
	const [content, setContent] = useState([]);
	const [onPress, setOnPress] = useState();

	const hideActionSheet = () => {
		setContent([]);
		onPress && onPress();
	};

	const showActionSheetWithOptions = ({ options, header: customHeader, title: headerTitle }, callback) => {
		Keyboard.dismiss();
		setHeader(customHeader);
		setTitle(headerTitle);
		setContent(options);
		setOnPress(() => (idx) => {
			callback(idx);
			setContent([]);
		});
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	};

	useImperativeHandle(ref, () => ({
		showActionSheetWithOptions,
		hideActionSheet
	}));

	useDeepCompareEffect(() => {
		if (content.length) {
			bottomSheetRef.current.snapTo(2);
		} else {
			bottomSheetRef.current.snapTo(0);
		}
	}, [content]);

	const renderHeader = () => (
		<Header
			title={title}
			header={header}
			theme={theme}
		/>
	);

	const renderContent = () => (
		<Content
			options={content}
			onPress={onPress}
			theme={theme}
		/>
	);

	const height = content.length * ITEM_HEIGHT + ((title || header) ? 82 : 26);

	return (
		<>
			{children}
			<Shadow
				fall={fall}
				theme={theme}
			/>
			<BottomSheet
				ref={bottomSheetRef}
				initialSnap={0}
				snapPoints={[0, height / 2, height]}
				onCloseEnd={hideActionSheet}
				renderHeader={renderHeader}
				renderContent={renderContent}
				enabledContentGestureInteraction={false}
				enabledManualSnapping={false}
				enabledInnerScrolling={false}
				overdragResistanceFactor={8}
				callbackNode={fall}
				borderRadius={10}
			/>
		</>
	);
}));
ActionSheet.propTypes = {
	children: PropTypes.node,
	theme: PropTypes.string
};

export default ActionSheet;
