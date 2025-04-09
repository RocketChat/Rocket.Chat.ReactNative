import React, { useEffect, useRef } from 'react';
import { Modal, View, StyleSheet, TouchableWithoutFeedback, Animated, Dimensions, Platform, Keyboard } from 'react-native';
import styles from './style';

interface ICustomModalProps {
	open: boolean;
	onClose: () => void;
	children: React.ReactNode;
}

const CustomModal: React.FC<ICustomModalProps> = ({ open, onClose, children }) => {
	const opacity = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (open) {
			Animated.timing(opacity, {
				toValue: 1,
				duration: 250,
				useNativeDriver: true
			}).start();
		} else {
			Animated.timing(opacity, {
				toValue: 0,
				duration: 250,
				useNativeDriver: true
			}).start();
		}
	}, [open]);

	const handleOutsidePress = () => {
		Keyboard.dismiss();
		onClose?.();
	};

	return (
		<Modal visible={open} transparent animationType='fade' onRequestClose={onClose} statusBarTranslucent>
			<TouchableWithoutFeedback onPress={handleOutsidePress}>
				<View style={styles.backdrop}>
					<TouchableWithoutFeedback>
						<Animated.View style={[styles.modalContainer, { opacity }]}>{children}</Animated.View>
					</TouchableWithoutFeedback>
				</View>
			</TouchableWithoutFeedback>
		</Modal>
	);
};

export default CustomModal;
