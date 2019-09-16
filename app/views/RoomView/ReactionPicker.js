import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import { connect } from 'react-redux';
import Modal from 'react-native-modal';
import { responsive } from 'react-native-responsive-ui';

import EmojiPicker from '../../containers/EmojiPicker';
import styles from './styles';
import { isAndroid } from '../../utils/deviceInfo';

const margin = isAndroid ? 40 : 20;
const tabEmojiStyle = { fontSize: 15 };

class ReactionPicker extends React.Component {
	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		window: PropTypes.any,
		message: PropTypes.object,
		show: PropTypes.bool,
		reactionClose: PropTypes.func,
		onEmojiSelected: PropTypes.func
	};

	shouldComponentUpdate(nextProps) {
		const { show, window } = this.props;
		return nextProps.show !== show || window.width !== nextProps.window.width;
	}

	onEmojiSelected(emoji, shortname) {
		// standard emojis: `emoji` is unicode and `shortname` is :joy:
		// custom emojis: only `emoji` is returned with shortname type (:joy:)
		// to set reactions, we need shortname type
		const { onEmojiSelected, message } = this.props;
		onEmojiSelected(shortname || emoji, message.id);
	}

	render() {
		const {
			window: { width, height }, show, baseUrl, reactionClose
		} = this.props;

		return (show
			? (
				<Modal
					isVisible={show}
					style={{ alignItems: 'center' }}
					onBackdropPress={reactionClose}
					onBackButtonPress={reactionClose}
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

const mapStateToProps = state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
});

export default responsive(connect(mapStateToProps)(ReactionPicker));
