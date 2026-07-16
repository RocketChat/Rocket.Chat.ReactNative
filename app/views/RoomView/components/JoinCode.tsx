import { forwardRef, memo, useImperativeHandle, useState } from 'react';
import { InteractionManager, StyleSheet, Text, View } from 'react-native';
import Modal from 'react-native-modal';
import { connect } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import I18n from '../../../i18n';
import Button from '../../../containers/Button';
import { FormTextInput } from '../../../containers/TextInput';
import sharedStyles from '../../Styles';
import { useTheme } from '../../../theme';
import { joinRoom } from '../../../lib/services/restApi';
import { withMasterDetail } from '../../../lib/hooks/useMasterDetail';
import { type IJoinCode, type IJoinCodeProps } from '../definitions';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	content: {
		padding: 16,
		width: '100%',
		borderRadius: 4
	},
	title: {
		fontSize: 16,
		paddingBottom: 8,
		...sharedStyles.textBold,
		...sharedStyles.textAlignCenter
	},
	button: {
		minWidth: 96,
		marginBottom: 0
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between'
	},
	tablet: {
		height: undefined
	}
});

const JoinCode = memo(
	forwardRef<IJoinCode, IJoinCodeProps>(({ rid, t, onJoin, isMasterDetail }, ref) => {
		const { colors } = useTheme();
		const [visible, setVisible] = useState(false);
		const [error, setError] = useState(false);
		const [code, setCode] = useState('');

		const show = () => setVisible(true);

		const hide = () => setVisible(false);

		const handleJoinRoom = async () => {
			try {
				await joinRoom(rid, code, t as any);
				onJoin();
				hide();
			} catch (e) {
				setError(true);
			}
		};

		useImperativeHandle(ref, () => ({ show }));

		return (
			<Modal avoidKeyboard useNativeDriver isVisible={visible} hideModalContentWhileAnimating>
				<GestureHandlerRootView style={styles.container} testID='join-code'>
					<View
						style={[
							styles.content,
							isMasterDetail && [sharedStyles.modalFormSheet, styles.tablet],
							{ backgroundColor: colors.surfaceRoom }
						]}>
						<Text style={[styles.title, { color: colors.fontTitlesLabels }]}>{I18n.t('Insert_Join_Code')}</Text>
						<FormTextInput
							value={code}
							inputRef={(e: any) => {
								if (e) {
									InteractionManager.runAfterInteractions(() => {
										e.focus();
									});
								}
							}}
							returnKeyType='send'
							autoCapitalize='none'
							onChangeText={setCode}
							onSubmitEditing={handleJoinRoom}
							placeholder={I18n.t('Join_Code')}
							secureTextEntry
							error={error ? { error: 'error-code-invalid', reason: I18n.t('Code_or_password_invalid') } : undefined}
							testID='join-code-input'
						/>
						<View style={styles.buttonContainer}>
							<Button
								title={I18n.t('Cancel')}
								type='secondary'
								style={styles.button}
								backgroundColor={colors.surfaceTint}
								testID='join-code-cancel'
								onPress={hide}
							/>
							<Button
								title={I18n.t('Join')}
								type='primary'
								style={styles.button}
								testID='join-code-submit'
								onPress={handleJoinRoom}
							/>
						</View>
					</View>
				</GestureHandlerRootView>
			</Modal>
		);
	})
);

const mapStateToProps = () => ({});

export default connect(mapStateToProps, null, null, { forwardRef: true })(withMasterDetail(JoinCode));
