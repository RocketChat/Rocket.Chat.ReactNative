import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import I18n from '../../i18n';
import sharedStyles from '../Styles';

interface ApiKeyModalProps {
	visible: boolean;
	title: string;
	placeholder: string;
	initialValue: string;
	onSave: (value: string) => void;
	onCancel: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ visible, title, placeholder, initialValue, onSave, onCancel }) => {
	const { colors } = useTheme();
	const [value, setValue] = useState(initialValue);

	useEffect(() => {
		setValue(initialValue);
	}, [initialValue, visible]);

	const handleSave = () => {
		onSave(value.trim());
	};

	return (
		<Modal visible={visible} transparent animationType='fade' onRequestClose={onCancel}>
			<View style={styles.overlay}>
				<View style={[styles.modal, { backgroundColor: colors.surfaceLight }]}>
					<Text style={[styles.title, { color: colors.fontTitlesLabels }]}>{title}</Text>

					<TextInput
						style={[
							styles.input,
							{
								backgroundColor: colors.surfaceNeutral,
								borderColor: colors.strokeLight,
								color: colors.fontDefault
							}
						]}
						value={value}
						onChangeText={setValue}
						placeholder={placeholder}
						placeholderTextColor={colors.fontHint}
						secureTextEntry
						autoFocus
						autoCapitalize='none'
						autoCorrect={false}
					/>

					<View style={styles.buttonContainer}>
						<TouchableOpacity
							style={[styles.button, styles.cancelButton, { borderColor: colors.strokeLight }]}
							onPress={onCancel}>
							<Text style={[styles.buttonText, { color: colors.fontDefault }]}>{I18n.t('Cancel')}</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={[styles.button, styles.saveButton, { backgroundColor: colors.buttonBackgroundPrimaryDefault }]}
							onPress={handleSave}>
							<Text style={[styles.buttonText, { color: colors.fontWhite }]}>{I18n.t('Save')}</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20
	},
	modal: {
		width: '100%',
		maxWidth: 400,
		borderRadius: 12,
		padding: 24,
		elevation: 8,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 4
		},
		shadowOpacity: 0.25,
		shadowRadius: 12
	},
	title: {
		...sharedStyles.textSemibold,
		fontSize: 18,
		marginBottom: 16,
		textAlign: 'center'
	},
	input: {
		height: 48,
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 16,
		fontSize: 16,
		marginBottom: 24
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 12
	},
	button: {
		flex: 1,
		height: 44,
		borderRadius: 8,
		justifyContent: 'center',
		alignItems: 'center'
	},
	cancelButton: {
		borderWidth: 1
	},
	saveButton: {
		// Background color set dynamically
	},
	buttonText: {
		...sharedStyles.textSemibold,
		fontSize: 16
	}
});

export default ApiKeyModal;
