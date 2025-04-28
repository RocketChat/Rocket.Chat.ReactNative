import React, { useEffect, useRef } from 'react';
import { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { View, TouchableWithoutFeedback, Keyboard } from 'react-native';
import Modal from 'react-native-modal';
import styles from './style';
import { useTheme } from '../../theme';

interface ICustomModalProps {
	open: boolean;
	onClose: () => void;
	children: React.ReactNode;
}

const CustomModal: React.FC<ICustomModalProps> = ({ open, onClose, children }) => {
	const { colors } = useTheme();
	const opacity = useSharedValue(0);
	useEffect(() => {
		if (open) {
			opacity.value = withTiming(1, { duration: 250 });
		} else {
			opacity.value = withTiming(0, { duration: 250 });
		}
	}, [open]);

	const animatedStyle = useAnimatedStyle(() => {
		return {
			opacity: opacity.value
		};
	});

	const handleOutsidePress = () => {
		Keyboard.dismiss();
		onClose?.();
	};
	return (
		<Modal
			customBackdrop={<View aria-hidden style={[styles.overlay, { backgroundColor: colors.overlayBackground }]} />}
			avoidKeyboard
			useNativeDriver
			isVisible={open}
			hideModalContentWhileAnimating>
			<TouchableWithoutFeedback onPress={handleOutsidePress}>
				<View style={{ ...styles.backdrop }}>
					<Animated.View style={[styles.modalContainer, animatedStyle]}>{children}</Animated.View>
				</View>
			</TouchableWithoutFeedback>
		</Modal>
	);
};

export default CustomModal;
