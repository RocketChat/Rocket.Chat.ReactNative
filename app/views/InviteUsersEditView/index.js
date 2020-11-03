import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import { connect } from 'react-redux';
import RNPickerSelect from 'react-native-picker-select';

import {
	inviteLinksSetParams as inviteLinksSetParamsAction,
	inviteLinksCreate as inviteLinksCreateAction
} from '../../actions/inviteLinks';
import * as List from '../../containers/List';
import styles from './styles';
import Button from '../../containers/Button';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import SafeAreaView from '../../containers/SafeAreaView';
import { logEvent, events } from '../../utils/log';

const OPTIONS = {
	days: [{
		label: '1', value: 1
	},
	{
		label: '7', value: 7
	},
	{
		label: '15', value: 15
	},
	{
		label: '30', value: 30
	}],
	maxUses: [{
		label: '1', value: 1
	},
	{
		label: '5', value: 5
	},
	{
		label: '10', value: 10
	},
	{
		label: '25', value: 25
	},
	{
		label: '50', value: 50
	},
	{
		label: '100', value: 100
	}]
};

class InviteUsersView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('Invite_users')
	})

	static propTypes = {
		navigation: PropTypes.object,
		route: PropTypes.object,
		theme: PropTypes.string,
		createInviteLink: PropTypes.func,
		inviteLinksSetParams: PropTypes.func
	}

	constructor(props) {
		super(props);
		this.rid = props.route.params?.rid;
	}

	onValueChangePicker = (key, value) => {
		logEvent(events.IU_EDIT_SET_LINK_PARAM);
		const { inviteLinksSetParams } = this.props;
		const params = {
			[key]: value
		};
		inviteLinksSetParams(params);
	}

	createInviteLink = () => {
		logEvent(events.IU_EDIT_CREATE_LINK);
		const { createInviteLink, navigation } = this.props;
		createInviteLink(this.rid);
		navigation.pop();
	}

	renderPicker = (key, first) => {
		const { props } = this;
		const { theme } = props;
		const firstEl = [{
			label: I18n.t(first), value: 0
		}];
		return (
			<RNPickerSelect
				style={{ viewContainer: styles.viewContainer }}
				value={props[key]}
				textInputProps={{ style: { ...styles.pickerText, color: themes[theme].actionTintColor } }}
				useNativeAndroidPickerStyle={false}
				placeholder={{}}
				onValueChange={value => this.onValueChangePicker(key, value)}
				items={firstEl.concat(OPTIONS[key])}
			/>
		);
	}

	render() {
		const { theme } = this.props;
		return (
			<SafeAreaView>
				<List.Container>
					<StatusBar />
					<List.Section>
						<List.Separator />
						<List.Item
							title='Expiration_Days'
							right={() => this.renderPicker('days', 'Never')}
						/>
						<List.Separator />
						<List.Item
							title='Max_number_of_uses'
							right={() => this.renderPicker('maxUses', 'No_limit')}
						/>
						<List.Separator />
					</List.Section>
					<View style={styles.innerContainer}>
						<Button
							title={I18n.t('Generate_New_Link')}
							type='primary'
							onPress={this.createInviteLink}
							theme={theme}
						/>
					</View>
				</List.Container>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	days: state.inviteLinks.days,
	maxUses: state.inviteLinks.maxUses
});

const mapDispatchToProps = dispatch => ({
	inviteLinksSetParams: params => dispatch(inviteLinksSetParamsAction(params)),
	createInviteLink: rid => dispatch(inviteLinksCreateAction(rid))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(InviteUsersView));
