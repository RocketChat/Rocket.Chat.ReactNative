import { connect } from 'react-redux';
import { responsive } from 'react-native-responsive-ui';
import React from 'react';
import PropTypes from 'prop-types';
import { SafeAreaView } from 'react-navigation';
import { isAndroid } from '../../utils/deviceInfo';
import RocketChat from '../../lib/rocketchat';
import log from '../../utils/log';
import ReactionPicker from '../../containers/EmojiPicker/ReactionPicker';
import i18n from '../../i18n';
import styles from './styles';
import LoggedView from '../View';
import StatusBar from '../../containers/StatusBar';

const margin = isAndroid ? 40 : 20;
const tabEmojiStyle = { fontSize: 15 };

@connect(state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	actionMessage: state.messages.actionMessage
}))
@responsive
export default class ReactionPickerView extends LoggedView {
	static navigationOptions = {
		title: i18n.t('Reactions_search')
	}

	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		window: PropTypes.any,
		actionMessage: PropTypes.object,
		navigation: PropTypes.object
	}

	constructor(props) {
		super('ReactionPickerView', props);
	}

	onEmojiSelected(emoji) {
		// standard emojis: `emoji` is unicode and `shortname` is :joy:
		// custom emojis: only `emoji` is returned with shortname type (:joy:)
		// to set reactions, we need shortname type
		const { actionMessage, navigation } = this.props;

		try {
			if (actionMessage) {
				RocketChat.setReaction(emoji, actionMessage._id);
				navigation.goBack();
			}
		} catch (e) {
			log('RoomView.onReactionPress', e);
		}
	}

	render() {
		const {
			window: { width, height },
			baseUrl
		} = this.props;

		return (
			<SafeAreaView style={styles.container} testID='reaction-picker' forceInset={{ bottom: 'never' }}>
				<StatusBar />
				<ReactionPicker
					tabEmojiStyle={tabEmojiStyle}
					width={Math.min(width, height) - margin}
					onEmojiSelected={(emoji, shortname) => this.onEmojiSelected(shortname || emoji)}
					baseUrl={baseUrl}
				/>
			</SafeAreaView>
		);
	}
}
