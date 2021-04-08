import React, { useRef } from 'react';

import PropTypes from 'prop-types';
import styles from './styles';
import CustomField from '../CustomField';
import I18n from '../../../i18n';
import RCTextInput from '../../../containers/TextInput';

const FormProfile = ({
	Accounts_AllowUserAvatarChange,
	Accounts_AllowRealNameChange,
	Accounts_AllowUsernameChange,
	Accounts_AllowEmailChange,
	Accounts_AllowPasswordChange,
	Accounts_CustomFields,
	customFields,
	name,
	username,
	email,
	newPassword,
	avatarUrl,
	setState,
	theme,
	submit
}) => {
	const nameRef = useRef(null);
	const usernameRef = useRef(null);
	const emailRef = useRef(null);
	const newPasswordRef = useRef(null);
	const avatarUrlRef = useRef(null);

	return (
		<>
			<RCTextInput
				editable={Accounts_AllowRealNameChange}
				inputStyle={[
					!Accounts_AllowRealNameChange && styles.disabled
				]}
				inputRef={nameRef}
				label={I18n.t('Name')}
				placeholder={I18n.t('Name')}
				value={name}
				onChangeText={value => setState({ name: value })}
				onSubmitEditing={() => { usernameRef.current.focus(); }}
				testID='profile-view-name'
				theme={theme}
			/>
			<RCTextInput
				editable={Accounts_AllowUsernameChange}
				inputStyle={[
					!Accounts_AllowUsernameChange && styles.disabled
				]}
				inputRef={usernameRef}
				label={I18n.t('Username')}
				placeholder={I18n.t('Username')}
				value={username}
				onChangeText={value => setState({ username: value })}
				onSubmitEditing={() => { emailRef.current.focus(); }}
				testID='profile-view-username'
				theme={theme}
			/>
			<RCTextInput
				editable={Accounts_AllowEmailChange}
				inputStyle={[
					!Accounts_AllowEmailChange && styles.disabled
				]}
				inputRef={emailRef}
				label={I18n.t('Email')}
				placeholder={I18n.t('Email')}
				value={email}
				onChangeText={value => setState({ email: value })}
				onSubmitEditing={() => { newPasswordRef.current.focus(); }}
				testID='profile-view-email'
				theme={theme}
			/>
			<RCTextInput
				editable={Accounts_AllowPasswordChange}
				inputStyle={[
					!Accounts_AllowPasswordChange && styles.disabled
				]}
				inputRef={newPasswordRef}
				label={I18n.t('New_Password')}
				placeholder={I18n.t('New_Password')}
				value={newPassword}
				onChangeText={value => setState({ newPassword: value })}
				secureTextEntry
				testID='profile-view-new-password'
				theme={theme}
			/>
			<RCTextInput
				editable={Accounts_AllowUserAvatarChange}
				inputStyle={[
					!Accounts_AllowUserAvatarChange && styles.disabled
				]}
				inputRef={avatarUrlRef}
				label={I18n.t('Avatar_Url')}
				placeholder={I18n.t('Avatar_Url')}
				value={avatarUrl}
				onChangeText={value => setState({ avatarUrl: value })}
				onSubmitEditing={submit}
				testID='profile-view-avatar-url'
				theme={theme}
			/>

			<CustomField
				Accounts_CustomFields={Accounts_CustomFields}
				customFields={customFields}
				setState={setState}
				theme={theme}
			/>
		</>
	);
};

FormProfile.propTypes = {
	theme: PropTypes.object,
	customFields: PropTypes.object,
	Accounts_AllowUserAvatarChange: PropTypes.bool,
	Accounts_AllowRealNameChange: PropTypes.bool,
	Accounts_AllowUsernameChange: PropTypes.bool,
	Accounts_AllowEmailChange: PropTypes.bool,
	Accounts_AllowPasswordChange: PropTypes.bool,
	Accounts_CustomFields: PropTypes.bool,
	setState: PropTypes.func,
	name: PropTypes.string,
	username: PropTypes.string,
	email: PropTypes.string,
	newPassword: PropTypes.string,
	avatarUrl: PropTypes.string,
	submit: PropTypes.func
};

export default FormProfile;
