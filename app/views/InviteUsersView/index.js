import React from 'react';
import PropTypes from 'prop-types';
import {
	View, Alert, Share, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-navigation';
import equal from 'deep-equal';

import KeyboardView from '../../presentation/KeyboardView';
import RCTextInput from '../../containers/TextInput';
import styles from './styles';
import sharedStyles from '../Styles';
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

const possibleDays = [0, 1, 7, 15, 30];
const possibleUses = [0, 1, 5, 10, 25, 50, 100];

class InviteUsersView extends React.Component {
	static navigationOptions = ({ screenProps }) => ({
		title: I18n.t('Invite_users'),
		...themedHeader(screenProps.theme)
	})

	static propTypes = {
		navigation: PropTypes.object,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.state = {
			url: '',
			days: 1,
			maxUses: 0
		};
		this.rid = props.navigation.getParam('rid');
    console.log('TCL: constructor -> this.rid', this.rid);
	}

	componentDidMount() {
		this.findOrCreateInvite();
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

	findOrCreateInvite = async() => {
		// this.setState({ searchText, loading: true, messages: [] });
		const { days, maxUses } = this.state;

		try {
			const result = await RocketChat.findOrCreateInvite({ rid: this.rid, days, maxUses });
			console.log('TCL: findOrCreateInvite -> result', result);
			if (!result.success) {
				Alert.alert(I18n.t('Oops'), 'ERROR');
				return;
			}

			this.setState({ url: result.url });

			// if (result.success) {
			// 	this.setState({
			// 		messages: result.messages || [],
			// 		loading: false
			// 	});
			// }
		} catch (e) {
			// this.setState({ loading: false });
			log(e);
		}
	}

	share = () => {
		const { url } = this.state;
		Share.share({ message: url });
	}

	render() {
		const { url } = this.state;
		const { theme } = this.props;
		return (
			<ScrollView {...scrollPersistTaps} style={{ backgroundColor: themes[theme].backgroundColor }}>
				<SafeAreaView style={[styles.container, { backgroundColor: themes[theme].backgroundColor }]} forceInset={{ vertical: 'never' }}>
					<StatusBar theme={theme} />
					<View style={styles.innerContainer}>
						<RCTextInput
							label={I18n.t('Invite_Link')}
							theme={theme}
							value={url}
							editable={false}
						/>
						<Markdown msg={'Your invite link will expire on 9 de Janeiro de 2020 às 17:39.'} username='' baseUrl='' theme={theme} />
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
							onPress={this.resetPassword}
							theme={theme}
						/>
					</View>
				</SafeAreaView>
			</ScrollView>
		);
	}
}

export default withTheme(InviteUsersView);
