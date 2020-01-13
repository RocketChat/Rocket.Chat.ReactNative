import React from 'react';
import PropTypes from 'prop-types';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-navigation';
import { connect } from 'react-redux';
import RNPickerSelect from 'react-native-picker-select';

import {
	inviteLinksSetParams as inviteLinksSetParamsAction,
	inviteLinksCreate as inviteLinksCreateAction
} from '../../actions/inviteLinks';
import ListItem from '../../containers/ListItem';
import styles from './styles';
import Button from '../../containers/Button';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import { themedHeader } from '../../utils/navigation';
import Separator from '../../containers/Separator';

const OPTIONS = {
	days: [{
		label: I18n.t('Never'), value: 0
	},
	{
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
		label: I18n.t('No_limit'), value: 0
	},
	{
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
	static navigationOptions = ({ screenProps }) => ({
		title: I18n.t('Invite_users'),
		...themedHeader(screenProps.theme)
	})

	static propTypes = {
		navigation: PropTypes.object,
		theme: PropTypes.string,
		timeDateFormat: PropTypes.string,
		createInviteLink: PropTypes.func,
		inviteLinksSetParams: PropTypes.func
	}

	constructor(props) {
		super(props);
		this.rid = props.navigation.getParam('rid');
	}

	onValueChangePicker = (key, value) => {
		const { inviteLinksSetParams } = this.props;
		const params = {
			[key]: value
		};
		inviteLinksSetParams(params);
	}

	createInviteLink = () => {
		const { createInviteLink, navigation } = this.props;
		createInviteLink(this.rid);
		navigation.pop();
	}

	renderPicker = (key) => {
		const { props } = this;
		const { theme } = props;
		return (
			<RNPickerSelect
				style={{ viewContainer: styles.viewContainer }}
				value={props[key]}
				textInputProps={{ style: { ...styles.pickerText, color: themes[theme].actionTintColor } }}
				useNativeAndroidPickerStyle={false}
				placeholder={{}}
				onValueChange={value => this.onValueChangePicker(key, value)}
				items={OPTIONS[key]}
			/>
		);
	}

	render() {
		const { theme } = this.props;
		return (
			<SafeAreaView style={[styles.container, { backgroundColor: themes[theme].backgroundColor }]} forceInset={{ vertical: 'never' }}>
				<ScrollView
					{...scrollPersistTaps}
					style={{ backgroundColor: themes[theme].auxiliaryBackground }}
					contentContainerStyle={styles.contentContainer}
					showsVerticalScrollIndicator={false}
				>
					<StatusBar theme={theme} />
					<Separator theme={theme} />
					<ListItem
						title={I18n.t('Expiration_Days')}
						right={() => this.renderPicker('days')}
						theme={theme}
					/>
					<Separator theme={theme} />
					<ListItem
						title={I18n.t('Max_number_of_uses')}
						right={() => this.renderPicker('maxUses')}
						theme={theme}
					/>
					<Separator theme={theme} />
					<View style={styles.innerContainer}>
						<View style={[styles.divider, { backgroundColor: themes[theme].separatorColor }]} />
						<Button
							title={I18n.t('Generate_New_Link')}
							type='primary'
							onPress={this.createInviteLink}
							theme={theme}
						/>
					</View>
				</ScrollView>
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
