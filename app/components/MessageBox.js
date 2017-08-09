import React from 'react';
import PropTypes from 'prop-types';
import { View, TextInput, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
	textBox: {
		paddingTop: 1,
		backgroundColor: '#ccc'
	},
	textBoxInput: {
		height: 40,
		backgroundColor: '#fff',
		paddingLeft: 15
	}
});

export default class MessageBox extends React.PureComponent {
	static propTypes = {
		onSubmit: PropTypes.func.isRequired
	}

	constructor(props) {
		super(props);

		this.state = {
			text: ''
		};
	}

	submit = () => {
		if (this.state.text.trim() === '') {
			return;
		}

		this.props.onSubmit(this.state.text)
			.then(() => {
				this.setState({
					text: ''
				});
			});
	};

	render() {
		return (
			<View style={styles.textBox}>
				<TextInput
					style={styles.textBoxInput}
					value={this.state.text}
					onChangeText={text => this.setState({ text })}
					returnKeyType='send'
					onSubmitEditing={this.submit}
					blurOnSubmit={false}
					autoFocus
					placeholder='New message'
				/>
			</View>
		);
	}
}
