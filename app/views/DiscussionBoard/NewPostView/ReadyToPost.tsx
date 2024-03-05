import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

import PopUpModal from '../Components/PopUpModal';
import { ReadyToPostModalProps } from './interfaces';
import { getIcon, getColor } from '../helpers';
import { withTheme } from '../../../theme';

const BoardDropdownModal: React.FC<ReadyToPostModalProps> = props => {
	const { show, close, onPost } = props;

	return (
		<PopUpModal show={show} close={close} darkBackground>
			<View style={styles.container}>
				<View style={styles.header}>
					<Image source={getIcon('save')} style={styles.icon} resizeMode='contain' />
					<Text style={styles.headerText}>Ready to post?</Text>
				</View>
				<TouchableOpacity style={{ ...styles.button, ...styles.primaryButton }} onPress={onPost}>
					<Text style={{ ...styles.buttonText, ...styles.primaryButtonText }}>Post</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.button} onPress={close}>
					<Text style={styles.buttonText}>Make changes</Text>
				</TouchableOpacity>
			</View>
		</PopUpModal>
	);
};

export default withTheme(BoardDropdownModal);

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 20,
		width: '100%',
		alignItems: 'center'
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 24
	},
	icon: {
		height: 24,
		width: 24,
		marginRight: 16
	},
	headerText: {
		fontSize: 24,
		fontWeight: '600',
		lineHeight: 29
	},
	button: {
		backgroundColor: '#fff',
		width: '100%',
		alignItems: 'center',
		height: 54,
		borderRadius: 30,
		borderWidth: 1,
		borderColor: getColor('mossGreen'),
		justifyContent: 'center',
		marginBottom: 16
	},
	buttonText: {
		fontSize: 16,
		fontWeight: '600',
		color: getColor('black')
	},
	primaryButton: {
		backgroundColor: getColor('mossGreen')
	},
	primaryButtonText: {
		color: '#fff'
	}
});
