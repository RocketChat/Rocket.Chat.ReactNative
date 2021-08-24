import React, {
	useState,
	forwardRef,
	useImperativeHandle
} from 'react';
import PropTypes from 'prop-types';
import {
	View,
	Text,
	StyleSheet,
	InteractionManager
} from 'react-native';
import Modal from 'react-native-modal';
import { connect } from 'react-redux';

import I18n from '../../i18n';
import Button from '../../containers/Button';
import TextInput from '../../containers/TextInput';
import RocketChat from '../../lib/rocketchat';
import sharedStyles from '../Styles';

import { themes } from '../../constants/colors';

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

const JoinCode = React.memo(forwardRef(({
	rid,
	t,
	onJoin,
	isMasterDetail,
	theme
}, ref) => {
	const [visible, setVisible] = useState(false);
	const [error, setError] = useState(false);
	const [code, setCode] = useState('');

	const show = () => setVisible(true);

	const hide = () => setVisible(false);

	const joinRoom = async() => {
		try {
			await RocketChat.joinRoom(rid, code, t);
			onJoin();
			hide();
		} catch (e) {
			setError(true);
		}
	};

	useImperativeHandle(ref, () => ({ show }));

	return (
		<Modal
			transparent
			avoidKeyboard
			useNativeDriver
			isVisible={visible}
			hideModalContentWhileAnimating
		>
			<View style={styles.container} testID='join-code'>
				<View style={[styles.content, isMasterDetail && [sharedStyles.modalFormSheet, styles.tablet], { backgroundColor: themes[theme].backgroundColor }]}>
					<Text style={[styles.title, { color: themes[theme].titleText }]}>{I18n.t('Insert_Join_Code')}</Text>
					<TextInput
						value={code}
						theme={theme}
						inputRef={e => InteractionManager.runAfterInteractions(() => e?.getNativeRef()?.focus())}
						returnKeyType='send'
						autoCapitalize='none'
						onChangeText={setCode}
						onSubmitEditing={joinRoom}
						placeholder={I18n.t('Join_Code')}
						secureTextEntry
						error={error && { error: 'error-code-invalid', reason: I18n.t('Code_or_password_invalid') }}
						testID='join-code-input'
					/>
					<View style={styles.buttonContainer}>
						<Button
							title={I18n.t('Cancel')}
							type='secondary'
							style={styles.button}
							backgroundColor={themes[theme].chatComponentBackground}
							theme={theme}
							testID='join-code-cancel'
							onPress={hide}
						/>
						<Button
							title={I18n.t('Join')}
							type='primary'
							style={styles.button}
							theme={theme}
							testID='join-code-submit'
							onPress={joinRoom}
						/>
					</View>
				</View>
			</View>
		</Modal>
	);
}));
JoinCode.propTypes = {
	rid: PropTypes.string,
	t: PropTypes.string,
	onJoin: PropTypes.func,
	isMasterDetail: PropTypes.bool,
	theme: PropTypes.string
};

const mapStateToProps = state => ({
	isMasterDetail: state.app.isMasterDetail
});
export default connect(mapStateToProps, null, null, { forwardRef: true })(JoinCode);
