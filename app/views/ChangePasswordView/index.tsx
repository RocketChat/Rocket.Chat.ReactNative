import React from 'react';
import { Keyboard, StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import { sha256 } from 'js-sha256';

import KeyboardView from '../../containers/KeyboardView';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import { FormTextInput } from '../../containers/TextInput';
import Button from '../../containers/Button';

import I18n from '../../i18n';
import { TSupportedThemes, withTheme } from '../../theme';
import sharedStyles from '../Styles';
import { themes } from '../../lib/constants';

import { setUser } from '../../actions/login';
import { events, logEvent } from '../../lib/methods/helpers/log';
import { getUserSelector } from '../../selectors/login';
import { ProfileStackParamList } from '../../stacks/types';
import { Services } from '../../lib/services';
import { showErrorAlert } from '../../lib/methods/helpers';
import EventEmitter from '../../lib/methods/helpers/events';
import { LISTENER } from '../../containers/Toast';
import { twoFactor } from '../../lib/services/twoFactor';
import { TwoFactorMethods } from '../../definitions/ITotp';


interface IChangePasswordViewProps extends IActionSheetProvider, IBaseScreen<ProfileStackParamList, 'ChangePasswordView'> {
	user: IUser;
	Accounts_AllowPasswordChange: boolean;
}

interface IChangePasswordViewState {
	saving: boolean;
	confirmPassword: string | null;
	currentPassword: string | null;
	theme: TSupportedThemes;
	twoFactorCode: null | {
		twoFactorCode: string;
		twoFactorMethod: string;
	};
}

class ChangePasswordView extends React.Component<IChangePasswordViewProps, IChangePasswordViewState> {
	private newPassword?: TextInput;
	private confirmPassword?: TextInput;

    constructor(props: IChangePasswordViewProps) {
        super(props);
    }

    state = {
            saving: false,
            confirmPassword: null,
            currentPassword: null,
            newPassword: null,
		    twoFactorCode: null
        };

	isFormChanged = () => {
        const { confirmPassword, newPassword } = this.state;
        return !!confirmPassword && !!newPassword;
	};

	handleError = (e: any, action: string) => {
        if (e.error === 'error-password-same-as-current') {
			return showErrorAlert(I18n.t('Password_Must_Be_Different'));
        }
		if (I18n.isTranslated(e.error)) {
			return showErrorAlert(I18n.t(e.error));
		}
		showErrorAlert(I18n.t('There_was_an_error_while_action', { action: I18n.t(action) }));
	};

	submit = async (): Promise<void> => {
	    Keyboard.dismiss();

		if (!this.isFormChanged()) {
			return;
		}

		this.setState({ saving: true });
		const { newPassword, confirmPassword, currentPassword } = this.state;

		const { user, dispatch } = this.props;
		const params = {} as IChangePasswordParams;

		if (newPassword) {
			params.newPassword = newPassword;
		}

		if (currentPassword) {
			params.currentPassword = sha256(currentPassword);
		}

		if (confirmPassword !== newPassword) {
			this.setState({ saving: false });
			return showErrorAlert(I18n.t('Password_and_confirm_password_do_not_match'));
		}

		try {
			const twoFactorOptions = params.currentPassword
				? {
					twoFactorCode: params.currentPassword,
					twoFactorMethod: TwoFactorMethods.PASSWORD
				  }
				: null;

			const result = await Services.saveUserProfileMethod(params, null, twoFactorOptions);

			if (result) {
				logEvent(events.PROFILE_SAVE_CHANGES);
				dispatch(setUser({ ...params }));
				EventEmitter.emit(LISTENER, { message: I18n.t('Password_Updated') });
			}
			this.setState({ saving: false, currentPassword: null });
		} catch (e: any) {
            if (!Object.keys(e).length){
                return;
            }

			if (e?.error === 'totp-invalid' && e?.details.method !== TwoFactorMethods.PASSWORD) {
				try {
					const code = await twoFactor({ method: e?.details.method, invalid: e?.error === 'totp-invalid' && !!twoFactorCode });
					return this.setState({ twoFactorCode: code }, () => this.submit());
				} catch {
					// cancelled twoFactor modal
				}
			}
			logEvent(events.PROFILE_SAVE_CHANGES_F);
			this.setState({ saving: false, currentPassword: null });
			this.handleError(e, 'saving_password');
		}
	};


	render() {
		const { newPassword, confirmPassword, saving } = this.state;
		const {
			user,
			theme,
			Accounts_AllowPasswordChange,
		} = this.props;

		return (
			<KeyboardView
				style={{ backgroundColor: themes[theme].auxiliaryBackground }}
				contentContainerStyle={sharedStyles.container}
				keyboardVerticalOffset={128}>
				<StatusBar />
				<SafeAreaView testID='changePassword-view' style={styles.containerPadding}>
						<FormTextInput
							editable={Accounts_AllowPasswordChange}
							inputStyle={[!Accounts_AllowPasswordChange && styles.disabled]}
							inputRef={e => {
								if (e) {
									this.newPassword = e;
								}
							}}
							label={I18n.t('New_Password')}
							placeholder={I18n.t('New_Password')}
							value={newPassword || undefined}
							onChangeText={value => this.setState({ newPassword: value })}
							onSubmitEditing={() => {
								this.confirmPassword?.focus();
							}}
							secureTextEntry
							testID='changePassword-view-new-password'
						/>
						<FormTextInput
							editable={Accounts_AllowPasswordChange}
							inputStyle={[!Accounts_AllowPasswordChange && styles.disabled]}
							inputRef={e => {
								if (e) {
									this.confirmPassword = e;
								}
							}}
							label={I18n.t('Confirm_password')}
							placeholder={I18n.t('Confirm_password')}
							value={confirmPassword || undefined}
							onChangeText={value => this.setState({ confirmPassword: value })}
							secureTextEntry
							testID='changePassword-view-confirm-password'
						/>
						<Button
							title={I18n.t('Save_New_Password')}
							type='primary'
							onPress={this.submit}
							disabled={!this.isFormChanged()}
							testID='changePassword-view-submit'
							loading={saving}
						/>
				</SafeAreaView>
			</KeyboardView>
		);
	}
}


const styles = StyleSheet.create({
	disabled: {
		opacity: 0.3
	},
    containerPadding: {
	    padding: 16,
		paddingBottom: 30
    }
})

const mapStateToProps = (state: IApplicationState) => ({
	user: getUserSelector(state),
	Accounts_AllowPasswordChange: state.settings.Accounts_AllowPasswordChange as boolean,
});


export default connect(mapStateToProps)(withTheme(ChangePasswordView));
