import React from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, TouchableOpacity, TextInput
} from 'react-native';
import ShareExtension from 'react-native-share-extension';
import { HeaderBackButton } from 'react-navigation';

import {
	COLOR_TEXT_DESCRIPTION, HEADER_BACK
} from '../../constants/colors';
import I18n from '../../i18n';
import RocketChat from '../../lib/rocketchat';
import styles from './styles';

export default class ShareView extends React.Component {
	static navigationOptions = ({ navigation }) => ({
		headerLeft: (
			<HeaderBackButton
				title={I18n.t('Back')}
				backTitleVisible
				onPress={navigation.goBack}
				tintColor={HEADER_BACK}
			/>
		),
		title: I18n.t('Share'),
		headerRight: (
			<TouchableOpacity onPress={navigation.getParam('sendMessage')} style={styles.sendButton}>
				<Text style={styles.send}>Enviar</Text>
			</TouchableOpacity>
		)
	})

	static propTypes = {
		navigation: PropTypes.object
	};

	constructor(props) {
		super(props);
		this.state = {
			rid: '',
			text: '',
			name: ''
		};
	}

	componentWillMount() {
		const { navigation } = this.props;
		const rid = navigation.getParam('rid', '');
		const name = navigation.getParam('name', '');
		const text = navigation.getParam('text', '');
		this.setState({ rid, text, name });

		navigation.setParams({ sendMessage: this._sendMessagee });
	}

	_sendMessage = () => {
		const { text, rid } = this.state;
		if (text !== '' && rid !== '') {
			RocketChat.sendMessage(rid, text, undefined).then(ShareExtension.close);
		}
	};

	render() {
		const { text, name } = this.state;

		return (
			<View
				style={styles.container}
			>
				<Text style={styles.text}>
					<Text style={styles.to}>{`${ I18n.t('To') }: `}</Text>
					<Text style={styles.name}>{`${ name }`}</Text>
				</Text>
				<View style={styles.content}>
					<TextInput
						ref={component => this.component = component}
						style={styles.input}
						returnKeyType='default'
						keyboardType='twitter'
						blurOnSubmit={false}
						placeholder=''
						onChangeText={handleText => this.setState({ text: handleText })}
						underlineColorAndroid='transparent'
						defaultValue={text}
						multiline
						placeholderTextColor={COLOR_TEXT_DESCRIPTION}
					/>
				</View>
			</View>
		);
	}
}
