import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from './style';
import CustomModal from '../../../containers/Model/CustomModel';

interface TOTPEnableModalProps {
	open: boolean;
	onClose: () => void;
	qrCodeValue: string;
	manualCode: string;
	onVerify: (code: string) => void;
	isLoading?: boolean;
}

const TOTPEnableModal: React.FC<TOTPEnableModalProps> = ({
	open,
	onClose,
	qrCodeValue,
	manualCode,
	onVerify,
	isLoading = false
}) => {
	const [code, setcode] = useState<string>('');

	return (
		<CustomModal open={open} onClose={onClose}>
			<TouchableOpacity style={{ position: 'absolute', right: 10, top: 10 }} onPress={onClose}>
				<Icon name='close' size={24} color='#333' />
			</TouchableOpacity>

			<View style={styles.container}>
				<Text style={styles.title}>Two-factor authentication via TOTP</Text>

				<Text style={styles.instructions}>
					Using an authenticator app like Google Authenticator, Authy or Duo, scan the QR code. It will display a 6 digit code
					which you need to enter below.
				</Text>

				<View style={styles.qrContainer}>
					<QRCode value={qrCodeValue} size={200} />
				</View>

				<Text style={styles.manualCodeTitle}>Can't scan the QR code?</Text>
				<Text style={styles.manualCode}>Enter this code manually:</Text>
				<Text selectable style={styles.secretCode}>
					{manualCode}
				</Text>

				<View style={{ rowGap: 10 }}>
					<Text style={styles.codeInputLabel}>Enter authentication code</Text>
					<TextInput
						style={styles.codeInput}
						value={code}
						onChangeText={setcode}
						placeholder='6-digit code'
						keyboardType='number-pad'
						maxLength={6}
						autoFocus
					/>

					<TouchableOpacity
						style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]}
						onPress={() => onVerify(code)}
						disabled={isLoading}>
						<Text style={styles.verifyButtonText}>{isLoading ? 'Verifying...' : 'Verify'}</Text>
					</TouchableOpacity>
				</View>
			</View>
		</CustomModal>
	);
};

export default TOTPEnableModal;
