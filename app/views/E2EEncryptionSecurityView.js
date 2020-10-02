import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import StatusBar from '../containers/StatusBar';
import * as List from '../containers/List';
import I18n from '../i18n';
import {
	loggerConfig, analytics, logEvent, events
} from '../utils/log';
import { withTheme } from '../theme';
import SafeAreaView from '../containers/SafeAreaView';
import TextInput from '../containers/TextInput';
import Button from '../containers/Button';
import { getUserSelector } from '../selectors/login';
import { PADDING_HORIZONTAL } from '../containers/List/constants';
import sharedStyles from './Styles';
import { themes } from '../constants/colors';

const styles = StyleSheet.create({
	title: {
		fontSize: 16,
		...sharedStyles.textMedium
	},
	description: {
		fontSize: 14,
		paddingVertical: 10,
		...sharedStyles.textRegular
	}
});

class E2EEncryptionSecurityView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('E2E_Encryption')
	});

	static propTypes = {
		theme: PropTypes.string,
		user: PropTypes.shape({
			roles: PropTypes.array,
			id: PropTypes.string
		})
	}

	render() {
		const { theme } = this.props;
		return (
			<SafeAreaView testID='settings-view' style={{ backgroundColor: themes[theme].backgroundColor }}>
				<StatusBar theme={theme} />
				<List.Container>
					<View style={{ paddingHorizontal: PADDING_HORIZONTAL }}>
						<List.Section>
							<Text style={[styles.title, { color: themes[theme].titleColor }]}>{I18n.t('E2E_encryption_change_password_title')}</Text>
							<Text style={[styles.description, { color: themes[theme].bodyText }]}>{I18n.t('E2E_encryption_change_password_description')}</Text>
							<TextInput
								inputRef={(e) => { this.passwordInput = e; }}
								placeholder={I18n.t('New_Password')}
								returnKeyType='send'
								secureTextEntry
								onSubmitEditing={this.submit}
								testID='e2e-enter-your-password-view-password'
								theme={theme}
							/>
							<Button
								onPress={this.submit}
								title={I18n.t('Save_Changes')}
								// disabled={!password}
								theme={theme}
								style={{ marginBottom: 4 }}
							/>
						</List.Section>

						<List.Separator />

						<List.Section>
							<Text style={[styles.title, { color: themes[theme].titleColor }]}>{I18n.t('E2E_encryption_reset_title')}</Text>
							<Text style={[styles.description, { color: themes[theme].bodyText }]}>{I18n.t('E2E_encryption_reset_description')}</Text>
							<Button
								onPress={this.submit}
								title={I18n.t('E2E_encryption_reset_button')}
								// disabled={!password}
								theme={theme}
								type='secondary'
								backgroundColor={themes[theme].chatComponentBackground}
							/>
						</List.Section>
					</View>
				</List.Container>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	user: getUserSelector(state)
});

export default connect(mapStateToProps)(withTheme(E2EEncryptionSecurityView));
