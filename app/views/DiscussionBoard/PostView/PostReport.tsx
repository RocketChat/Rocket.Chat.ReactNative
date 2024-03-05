import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, TextInput } from 'react-native';

import PopUpModal from '../Components/PopUpModal';
import { useTheme } from '../../../theme';
import { themes } from '../../../lib/constants';
import { PostReportModalProps, ReportType } from './interfaces';

const alert = require('../../../static/images/discussionboard/alert_circle.png');

const PostReportModal: React.FC<PostReportModalProps> = props => {
	const { show, type = ReportType.COMMENT, close, report, onText } = props;
	// const { theme } = useTheme();
	const theme = 'light';

	const [disableButton, setDisableButton] = React.useState(false);
	const [value, onChangeText] = React.useState('');

	const isComment = type === ReportType.COMMENT;

	return (
		<PopUpModal show={show} close={close} customStyles={styles.container}>
			<View style={styles.header}>
				<Image source={alert} style={styles.trashIcon} />
				<Text style={styles.headerText}>{`Report ${isComment ? 'Comment' : 'Post'}`}</Text>
			</View>

			<Text style={styles.text}>Reason for reporting</Text>
			<View style={styles.textContainer}>
				<TextInput
					style={styles.text}
					placeholder='Reason'
					placeholderTextColor='#000000b3'
					multiline
					underlineColorAndroid='transparent'
					value={value}
					onChangeText={text => {
						if (onText) {
							onText(text);
						}
						onChangeText(text);
					}}
					maxLength={2000}
				/>
			</View>

			<TouchableOpacity style={{ ...styles.submit, backgroundColor: themes[theme].mossGreen }} onPress={report}>
				<Text style={styles.submitText}>Submit</Text>
			</TouchableOpacity>
			<TouchableOpacity
				style={{ ...styles.cancel, borderColor: themes[theme].mossGreen }}
				onPress={() => {
					setDisableButton(true);
					setTimeout(() => {
						setDisableButton(false);
						close();
					}, 500);
				}}
				disabled={disableButton}
			>
				<Text style={styles.cancelText}>Cancel</Text>
			</TouchableOpacity>
		</PopUpModal>
	);
};

export default PostReportModal;

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 20
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 16
	},
	trashIcon: {
		height: 24,
		width: 24,
		marginRight: 16
	},
	headerText: {
		fontSize: 24,
		lineHeight: 29,
		fontWeight: '600'
	},
	textContainer: {
		width: '100%',
		marginBottom: 24,
		backgroundColor: '#efefef80',
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 8,
		marginTop: 8
	},
	text: {
		fontSize: 14,
		lineHeight: 20,
		fontWeight: '400',
		alignSelf: 'flex-start'
	},
	submit: {
		borderRadius: 30,
		width: '100%',
		marginBottom: 16,
		justifyContent: 'center',
		alignItems: 'center',
		height: 54
	},
	submitText: {
		fontSize: 16,
		lineHeight: 19,
		fontWeight: '600',
		color: '#FFF'
	},
	cancel: {
		borderWidth: 1,
		borderRadius: 30,
		width: '100%',
		justifyContent: 'center',
		alignItems: 'center',
		height: 54,
		marginBottom: 20
	},
	cancelText: {
		fontSize: 16,
		lineHeight: 19,
		fontWeight: '600'
	}
});
