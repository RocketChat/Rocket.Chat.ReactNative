import React, { Component } from 'react';
import {
	View, Text, StyleSheet, Image, ScrollView, Platform
} from 'react-native';
import PropTypes from 'prop-types';
import Modal from 'react-native-modal';
import { responsive } from 'react-native-responsive-ui';
import equal from 'deep-equal';

import TextInput from '../TextInput';
import Button from '../Button';
import I18n from '../../i18n';

const cancelButtonColor = '#f7f8fa';

const styles = StyleSheet.create({
	titleContainer: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		paddingTop: 16
	},
	title: {
		fontWeight: 'bold'
	},
	container: {
		height: Platform.OS === 'ios' ? 404 : 430,
		backgroundColor: '#ffffff',
		flexDirection: 'column'
	},
	scrollView: {
		flex: 1,
		padding: 16
	},
	image: {
		height: 150,
		flex: 1,
		marginBottom: 16,
		resizeMode: 'contain'
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		padding: 16,
		backgroundColor: '#f7f8fa'
	},
	buttonMargin: {
		margin: 0
	}
});

@responsive
export default class UploadModal extends Component {
	static propTypes = {
		isVisible: PropTypes.bool,
		file: PropTypes.object,
		close: PropTypes.func,
		submit: PropTypes.func,
		window: PropTypes.object
	}

	state = {
		name: '',
		description: '',
		file: {}
	};

	static getDerivedStateFromProps(props, state) {
		if (!equal(props.file, state.file) && props.file && props.file.path) {
			return {
				file: props.file,
				name: props.file.filename || 'Filename',
				description: ''
			};
		}
		return null;
	}

	_submit = () => {
		const { file, submit } = this.props;
		const { name, description } = this.state;
		submit({ ...file, name, description });
	}

	render() {
		const { window: { width }, isVisible, close } = this.props;
		const { name, description, file } = this.state;
		return (
			<Modal
				isVisible={isVisible}
				style={{ alignItems: 'center' }}
				onBackdropPress={() => close()}
				onBackButtonPress={() => close()}
				animationIn='fadeIn'
				animationOut='fadeOut'
				useNativeDriver
				hideModalContentWhileAnimating
			>
				<View style={[styles.container, { width: width - 32 }]}>
					<View style={styles.titleContainer}>
						<Text style={styles.title}>Upload file?</Text>
					</View>

					<ScrollView style={styles.scrollView}>
						<Image source={{ isStatic: true, uri: file.path }} style={styles.image} />
						<TextInput
							placeholder='File name'
							value={name}
							onChangeText={value => this.setState({ name: value })}
						/>
						<TextInput
							placeholder='File description'
							value={description}
							onChangeText={value => this.setState({ description: value })}
						/>
					</ScrollView>
					<View style={styles.buttonContainer}>
						<Button
							title={I18n.t('Cancel')}
							type='secondary'
							backgroundColor={cancelButtonColor}
							margin={styles.buttonMargin}
							onPress={close}
						/>
						<Button
							title={I18n.t('Send')}
							type='primary'
							margin={styles.buttonMargin}
							onPress={this._submit}
						/>
					</View>
				</View>
			</Modal>
		);
	}
}
