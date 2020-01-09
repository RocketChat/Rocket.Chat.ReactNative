import React from 'react';
import PropTypes from 'prop-types';
import {
	View, Alert, Share, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-navigation';
import equal from 'deep-equal';
import moment from 'moment';
import { connect } from 'react-redux';

import { inviteLinksCreate as inviteLinksCreateAction } from '../../actions/inviteLinks';
import RCTextInput from '../../containers/TextInput';
import styles from './styles';
import Markdown from '../../containers/markdown';
import RocketChat from '../../lib/rocketchat';
import Button from '../../containers/Button';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import log from '../../utils/log';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import { themedHeader } from '../../utils/navigation';

class InviteUsersView extends React.Component {
	static navigationOptions = ({ screenProps }) => ({
		title: I18n.t('Invite_users'),
		...themedHeader(screenProps.theme)
	})

	static propTypes = {
		navigation: PropTypes.object,
		theme: PropTypes.string,
		timeDateFormat: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.rid = props.navigation.getParam('rid');
	}

	componentDidMount() {
		const { createInviteLink } = this.props;
		createInviteLink(this.rid);
	}

	// shouldComponentUpdate(nextProps, nextState) {
	// 	const { loading, searchText, messages } = this.state;
	// 	const { theme } = this.props;
	// 	if (nextProps.theme !== theme) {
	// 		return true;
	// 	}
	// 	if (nextState.loading !== loading) {
	// 		return true;
	// 	}
	// 	if (nextState.searchText !== searchText) {
	// 		return true;
	// 	}
	// 	if (!equal(nextState.messages, messages)) {
	// 		return true;
	// 	}
	// 	return false;
	// }

	// componentWillUnmount() {
	// 	this.search.stop();
	// }

	share = () => {
		const { url } = this.props;
		Share.share({ message: url });
	}

	edit = () => {
		const { navigation } = this.props;
		navigation.navigate('InviteUsersEditView');
	}

	render() {
		const {
			theme, timeDateFormat, url, expires
		} = this.props;
		return (
			<SafeAreaView style={[styles.container, { backgroundColor: themes[theme].backgroundColor }]} forceInset={{ vertical: 'never' }}>
				<ScrollView
					{...scrollPersistTaps}
					style={{ backgroundColor: themes[theme].auxiliaryBackground }}
					contentContainerStyle={styles.contentContainer}
					showsVerticalScrollIndicator={false}
					testID='notification-preference-view-list'
				>
					<StatusBar theme={theme} />
					<View style={styles.innerContainer}>
						<RCTextInput
							label={I18n.t('Invite_Link')}
							theme={theme}
							value={url}
							editable={false}
						/>
						<Markdown msg={I18n.t('Your_invite_will_expire_on', { date: moment(expires).format(timeDateFormat) })} username='' baseUrl='' theme={theme} />
						<View style={[styles.divider, { backgroundColor: themes[theme].separatorColor }]} />
						<Button
							title={I18n.t('Share_Link')}
							type='primary'
							onPress={this.share}
							theme={theme}
						/>
						<Button
							title={I18n.t('Edit_Invite')}
							type='secondary'
							onPress={this.edit}
							theme={theme}
						/>
					</View>
				</ScrollView>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	timeDateFormat: state.settings.Message_TimeAndDateFormat,
	days: state.inviteLinks.days,
	maxUses: state.inviteLinks.maxUses,
	url: state.inviteLinks.url,
	expires: state.inviteLinks.expires
});

const mapDispatchToProps = dispatch => ({
	createInviteLink: rid => dispatch(inviteLinksCreateAction(rid))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(InviteUsersView));
