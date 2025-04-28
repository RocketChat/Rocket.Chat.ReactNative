import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import 'text-encoding';

import styles from './style';
import Modal from '../../../containers/Model/Modal';
import { showToast } from '../../../lib/methods/helpers/showToast';
import { useTheme } from '../../../theme';

interface TOTPEnableModalProps {
	open: boolean;
	onClose: () => void;
	qrCodeValue: string;
	manualCode: string;
	onVerify: (code: string) => void;
	onDisable: () => void;
	onRegenerateCodes: () => void;
	isLoading?: boolean;
	isEnabled: boolean;
	backupCodesRemaining: number;
	showBackupKeys?: boolean;
	backupKeys?: string;
}

const TOTPEnableModal: React.FC<TOTPEnableModalProps> = ({
	open,
	onClose,
	qrCodeValue,
	manualCode,
	onVerify,
	onDisable,
	onRegenerateCodes,
	isLoading = false,
	isEnabled,
	backupCodesRemaining = 0,
	showBackupKeys = false,
	backupKeys = ''
}) => {
	const [code, setCode] = useState<string>('');
	const copyToClipboard = () => {
		Clipboard.setString(backupKeys);
		showToast('Backup keys copied to clipboard!');
		// You might want to add a toast notification here
	};

	const color = useTheme();
	return (
		<Modal open={open} onClose={onClose}>
			<TouchableOpacity style={{ position: 'absolute', right: 10, top: 10 }} onPress={onClose}>
				<Icon name='close' size={24} color={color.colors.backdropColor} />
			</TouchableOpacity>

			<View style={styles.container}>
				<Text style={styles.title}>Two-factor authentication via TOTP</Text>

				{showBackupKeys && (
					<>
						<Text style={styles.instructions}>Make sure you have a copy of your codes:</Text>

						<View style={[styles.secretCode, { marginVertical: 15 }]}>
							<Text selectable style={{ textAlign: 'center' }}>
								{backupKeys}
							</Text>
						</View>

						<TouchableOpacity style={[styles.verifyButton, { marginBottom: 10 }]} onPress={copyToClipboard}>
							<Text style={styles.verifyButtonText}>Copy</Text>
						</TouchableOpacity>

						<Text style={styles.manualCode}>
							If you lose access to your authenticator app, you can use one of these codes to log in.
						</Text>
					</>
				)}

				{!showBackupKeys && !isEnabled && (
					<>
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
								onChangeText={setCode}
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
					</>
				)}

				{!showBackupKeys && isEnabled && (
					<>
						<TouchableOpacity style={[styles.verifyButton, { backgroundColor: '#ff3b30' }]} onPress={onDisable}>
							<Text style={styles.verifyButtonText}>Disable two-factor authentication via TOTP</Text>
						</TouchableOpacity>

						<View style={{ rowGap: 10, marginTop: 20 }}>
							<Text style={styles.instructions}>Backup codes</Text>
							<Text style={styles.manualCode}>You have {backupCodesRemaining} codes remaining.</Text>

							<TouchableOpacity style={[styles.verifyButton, { backgroundColor: '#34C759' }]} onPress={onRegenerateCodes}>
								<Text style={styles.verifyButtonText}>Regenerate codes</Text>
							</TouchableOpacity>
						</View>
					</>
				)}
			</View>
		</Modal>
	);
};

export default TOTPEnableModal;
