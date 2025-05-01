import React, { useEffect } from 'react';
import { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { View, TouchableWithoutFeedback, Keyboard } from 'react-native';
import RCTModal from 'react-native-modal';
import styles from './style';
import { useTheme } from '../../theme';

interface IModalProps {
	open: boolean;
	onClose: () => void;
	children: React.ReactNode;
}

const Modal: React.FC<IModalProps> = ({ open, onClose, children }) => {
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
		<RCTModal
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
		</RCTModal>
	);
};

export default Modal;
