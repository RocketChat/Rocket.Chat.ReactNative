import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Modal from 'react-native-modal';
import I18n from 'i18n-js';

import styles from './style';
import { showToast } from '../../../lib/methods/helpers/showToast';
import { useTheme } from '../../../theme';
import { CustomIcon } from '../../../containers/CustomIcon';

interface TOTPEnableModalProps {
	open: boolean;
	onClose: () => void;
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
		showToast(I18n.t('Backup_keys_copied_to_clipboard'));
	};

	const copyManualCode = () => {
		Clipboard.setString(manualCode);
		showToast(I18n.t("Manual_code_copied_to_clipboard"))
	};

	const color = useTheme();
	return (
		<Modal
			customBackdrop={<View aria-hidden style={[styles.overlay, { backgroundColor: color.colors.overlayBackground }]} />}
			avoidKeyboard
			useNativeDriver
			isVisible={open}
			hideModalContentWhileAnimating>
			<View style={{ ...styles.container, backgroundColor: color.colors.strokeLight }}>
				<TouchableOpacity style={{ position: 'absolute', right: 10, top: 10 }} onPress={onClose}>
					<CustomIcon name={'close'} size={24} color={color.colors.fontHint} />
				</TouchableOpacity>
				<Text style={{ ...styles.title, color: color.colors.fontDefault }}>
					{I18n.t('Enable_Two_factor_authentication_via_TOTP')}
				</Text>

				{showBackupKeys && (
					<>
						<Text style={{ ...styles.instructions, color: color.colors.fontDefault }}>
							{I18n.t('Make_sure_you_have_a_copy_of_your_codes')}
						</Text>

						<View style={[styles.secretCode, styles.copyCodeContainer]}>
							<Text selectable style={{ textAlign: 'center', fontWeight: 'bold', color: color.colors.fontDefault }}>
								{backupKeys}
							</Text>
							<TouchableOpacity style={[styles.verifyButton, { marginBottom: 10 }]} onPress={copyToClipboard}>
								<CustomIcon name={'copy'} size={24} color={color.colors.fontTitlesLabels} />
							</TouchableOpacity>
							fontTitlesLabels
						</View>

						<Text style={{ ...styles.manualCode, color: color.colors.fontDefault }}>{I18n.t('Backup_codes_description')}</Text>
					</>
				)}

				{!showBackupKeys && !isEnabled && (
					<>
						<Text style={{ ...styles.instructions, color: color.colors.fontDefault }}>
							{I18n.t('TOTP_authenticator_instructions')}
						</Text>

						<Text style={{ ...styles.manualCode, color: color.colors.fontDefault }}>{I18n.t('Enter_this_code_manually')}</Text>

						<View style={{ ...styles.copyCodeContainer }}>
							<Text
								selectable
								style={{
									...styles.secretCode,
									color: color.colors.strokeHighlight
								}}>
								{manualCode}
							</Text>

							<TouchableOpacity onPress={copyManualCode}>
								<CustomIcon name={'copy'} size={24} color={color.colors.fontTitlesLabels} />
							</TouchableOpacity>
						</View>

						<View style={{ rowGap: 10 }}>
							<Text style={{ ...styles.codeInputLabel, color: color.colors.fontDefault }}>
								{I18n.t('Enter_this_code_manually')}
							</Text>
							<TextInput
								style={{ ...styles.codeInput, color: color.colors.fontDefault, borderColor: color.colors.fontHint }}
								value={code}
								onChangeText={setCode}
								placeholder='6-digit code'
								keyboardType='number-pad'
								maxLength={6}
								autoFocus
							/>

							<TouchableOpacity
								style={{
									...styles.verifyButton,
									backgroundColor: isLoading
										? color.colors.buttonBackgroundPrimaryDisabled
										: color.colors.buttonBackgroundPrimaryDefault
								}}
								onPress={() => onVerify(code)}
								disabled={isLoading}>
								<Text style={{ ...styles.verifyButtonText, color: color.colors.fontWhite }}>
									{isLoading ? 'Verifying...' : 'Verify'}
								</Text>
							</TouchableOpacity>
						</View>
					</>
				)}

				{!showBackupKeys && isEnabled && (
					<>
						<TouchableOpacity style={[styles.verifyButton, { backgroundColor: color.colors.strokeError }]} onPress={onDisable}>
							<Text style={styles.verifyButtonText}>{I18n.t('Disable_two_factor_authentication_via_TOTP')}</Text>
						</TouchableOpacity>

						<View style={{ rowGap: 10, marginTop: 20 }}>
							<Text style={styles.instructions}> {I18n.t('Backup_codes')}</Text>
							<Text style={styles.manualCode}>{I18n.t('You_have_codes_remaining', { count: backupCodesRemaining })}</Text>

							<TouchableOpacity
								style={[styles.verifyButton, { backgroundColor: color.colors.statusFontSuccess }]}
								onPress={onRegenerateCodes}>
								<Text style={styles.verifyButtonText}>{I18n.t('Regenerate_codes')}</Text>
							</TouchableOpacity>
						</View>
					</>
				)}
			</View>
		</Modal>
	);
};

export default TOTPEnableModal;
