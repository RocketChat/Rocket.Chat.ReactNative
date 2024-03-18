import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { InteractionManager, StyleSheet, Text, View } from 'react-native';
import Modal from 'react-native-modal';
import { connect } from 'react-redux';

import I18n from '../../i18n';
import Button from '../../containers/Button';
import { FormTextInput } from '../../containers/TextInput';
import sharedStyles from '../Styles';
import { themes } from '../../lib/constants';
import { IApplicationState } from '../../definitions';
import { Services } from '../../lib/services';
import { TSupportedThemes } from '../../theme';

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

export interface IJoinCodeProps {
	rid: string;
	t: string;
	onJoin: Function;
	isMasterDetail: boolean;
	theme: TSupportedThemes;
}

export interface IJoinCode {
	show: () => void;
}

const JoinCode = React.memo(
	forwardRef<IJoinCode, IJoinCodeProps>(({ rid, t, onJoin, isMasterDetail, theme }, ref) => {
		const [visible, setVisible] = useState(false);
		const [error, setError] = useState(false);
		const [code, setCode] = useState('');

		const show = () => setVisible(true);

		const hide = () => setVisible(false);

		const handleJoinRoom = async () => {
			try {
				await Services.joinRoom(rid, code, t as any);
				onJoin();
				hide();
			} catch (e) {
				setError(true);
			}
		};

		useImperativeHandle(ref, () => ({ show }));

		return (
			<Modal avoidKeyboard useNativeDriver isVisible={visible} hideModalContentWhileAnimating>
				<View style={styles.container} testID='join-code'>
					<View
						style={[
							styles.content,
							isMasterDetail && [sharedStyles.modalFormSheet, styles.tablet],
							{ backgroundColor: themes[theme].surfaceRoom }
						]}
					>
						<Text style={[styles.title, { color: themes[theme].fontTitlesLabels }]}>{I18n.t('Insert_Join_Code')}</Text>
						<FormTextInput
							value={code}
							// TODO: find a way to type this ref
							inputRef={(e: any) => InteractionManager.runAfterInteractions(() => e?.getNativeRef()?.focus())}
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
								backgroundColor={themes[theme].surfaceTint}
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
				</View>
			</Modal>
		);
	})
);

const mapStateToProps = (state: IApplicationState) => ({
	isMasterDetail: state.app.isMasterDetail
});

export default connect(mapStateToProps, null, null, { forwardRef: true })(JoinCode);
