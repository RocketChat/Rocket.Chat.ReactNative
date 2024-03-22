import React from 'react';
import { KeyboardAvoidingView, Platform, View, Modal, TouchableWithoutFeedback, ViewProps, StyleSheet } from 'react-native';

type Props = {
	show: boolean;
	close: () => void;
	children?: React.ReactNode;
	customStyles?: ViewProps['style'];
	darkBackground?: boolean;
};

const PopUpModal: React.FC<Props> = props => {
	const { show, close, children, customStyles, darkBackground } = props;
	return (
		<Modal
			visible={show}
			style={styles.modal}
			animationType={darkBackground ? 'fade' : 'slide'}
			onRequestClose={close}
			transparent={true}
		>
			<KeyboardAvoidingView
        		behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        		pointerEvents="box-none"
				style={styles.flexContainer}
			>
				<TouchableWithoutFeedback onPress={close}>
					<View style={[styles.flexContainer, darkBackground && styles.darkBackground]} />
				</TouchableWithoutFeedback>
				<View style={[styles.content, customStyles]}>{children && children}</View>
			</KeyboardAvoidingView>
		</Modal>
	);
};

export default PopUpModal;

const styles = StyleSheet.create({
	modal: {
		backgroundColor: 'transparent',
		flex: 1
	},
	flexContainer: {
		flex: 1,
		justifyContent: 'flex-end',
	},
	darkBackground: {
		backgroundColor: '#00000080'
	},
	content: {
		paddingVertical: 26,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#fff',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.15,
		shadowRadius: 100,
		borderTopLeftRadius: 25,
		borderTopRightRadius: 25,
		minHeight: 100,
		elevation: 5,
	}
});
