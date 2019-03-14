import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import { connect } from 'react-redux';
import Modal from 'react-native-modal';
import { responsive } from 'react-native-responsive-ui';

import EmojiPicker from '../../containers/EmojiPicker';
import { toggleReactionPicker as toggleReactionPickerAction } from '../../actions/messages';
import styles from './styles';
import { isAndroid } from '../../utils/deviceInfo';

const margin = isAndroid ? 40 : 20;
const tabEmojiStyle = { fontSize: 15 };

@connect(state => ({
	showReactionPicker: state.messages.showReactionPicker,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
}), dispatch => ({
	toggleReactionPicker: message => dispatch(toggleReactionPickerAction(message))
}))
@responsive
export default class ReactionPicker extends React.Component {
	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		window: PropTypes.any,
		showReactionPicker: PropTypes.bool,
		toggleReactionPicker: PropTypes.func,
		onEmojiSelected: PropTypes.func
	};

	shouldComponentUpdate(nextProps) {
		const { showReactionPicker, window } = this.props;
		return nextProps.showReactionPicker !== showReactionPicker || window.width !== nextProps.window.width;
	}

	onEmojiSelected(emoji, shortname) {
		// standard emojis: `emoji` is unicode and `shortname` is :joy:
		// custom emojis: only `emoji` is returned with shortname type (:joy:)
		// to set reactions, we need shortname type
		const { onEmojiSelected } = this.props;
		onEmojiSelected(shortname || emoji);
	}

	render() {
		const {
			window: { width, height }, showReactionPicker, baseUrl, toggleReactionPicker
		} = this.props;

		return (showReactionPicker
			? (
				<Modal
					isVisible={showReactionPicker}
					style={{ alignItems: 'center' }}
					onBackdropPress={() => toggleReactionPicker()}
					onBackButtonPress={() => toggleReactionPicker()}
					animationIn='fadeIn'
					animationOut='fadeOut'
				>
					<View
						style={[styles.reactionPickerContainer, { width: width - margin, height: Math.min(width, height) - (margin * 2) }]}
						testID='reaction-picker'
					>
						<EmojiPicker
							tabEmojiStyle={tabEmojiStyle}
							width={Math.min(width, height) - margin}
							onEmojiSelected={(emoji, shortname) => this.onEmojiSelected(emoji, shortname)}
							baseUrl={baseUrl}
						/>
					</View>
				</Modal>
			)
			: null
		);
	}
}
