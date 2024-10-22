import React, { useEffect, useState } from 'react';
import {
	Text,
	View,
	TouchableOpacity,
	Image,
	TextInput,
	ScrollView,
	Dimensions,
	KeyboardAvoidingView,
	Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import ImagePicker from 'react-native-image-crop-picker';
import I18n from 'i18n-js';

import { IApplicationState } from '../../../definitions';
import { useTheme, withTheme } from '../../../theme';
import { themes } from '../../../lib/constants';
import { getIcon, handleSendMessage } from '../helpers';
import BoardDropdownModal from './BoardDropdown';
import styles from './styles';
import ReadyToPost from './ReadyToPost';
import IconOrAvatar from '../../../containers/RoomItem/IconOrAvatar';
import { useAppSelector } from '../../../lib/hooks';
import { getUidDirectMessage } from '../../../lib/methods/helpers';
import { getUserSelector } from '../../../selectors/login';

const hitSlop = { top: 10, right: 10, bottom: 10, left: 10 };

type ScreenProps = {
	route: any;
};

const NewPostView: React.FC<ScreenProps> = ({ route }) => {
	const navigation = useNavigation<StackNavigationProp<any>>();
	const isMasterDetail = useSelector((state: IApplicationState) => state.app.isMasterDetail);
	const { displayMode, showAvatar } = useSelector((state: IApplicationState) => state.sortPreferences);
	const server = useSelector((state: IApplicationState) => state.share.server.server || state.server.server);
	const user = useSelector((state: IApplicationState) => getUserSelector(state));
	// const { theme } = useTheme();
	const theme = 'light';

	const [title, setTitle] = useState('');
	const [image, setImage] = useState(null);
	const [description, setDescription] = useState('');
	const [showBoardsModal, setShowBoardsModal] = useState(false);
	const [selectedBoard, setSelectedBoard] = useState(route.params?.selectedBoard ?? undefined);
	const [showReadyToPost, setShowReadyToPost] = useState(false);
	const [boards, setBoards] = useState(route.params?.boards ?? []);

	const id = getUidDirectMessage(selectedBoard);
	const userStatus = useAppSelector(state => state.activeUsers[id || '']?.status);

	useEffect(() => {
		navigation.setOptions({ title: 'Create a post', headerStyle: { shadowColor: 'transparent' } });
		if (!isMasterDetail) {
			navigation.setOptions({
				headerLeft: () => (
					<TouchableOpacity style={{ marginLeft: 20 }} onPress={() => navigation.goBack()} hitSlop={hitSlop}>
						<Image source={getIcon('arrowLeft')} style={{ width: 11, height: 19 }} resizeMode='contain' />
					</TouchableOpacity>
				),
				headerRight: () => null
			});
		}
	});

	const onImagePicker = () => {
		const options = {
			cropping: true,
			compressImageQuality: 0.8,
			freeStyleCropEnabled: true,
			cropperAvoidEmptySpaceAroundImage: false,
			cropperChooseText: I18n.t('Choose'),
			cropperCancelText: I18n.t('Cancel'),
			includeBase64: true
		};
		ImagePicker.openPicker(options).then(image => {
			setImage({ ...image, data: `data:image/jpeg;base64,${image.data}` });
		});
	};

	const showBanner = () => {
		if (image) {
			const imageAspectRatio = image?.width / image?.height;
			const width = Dimensions.get('window').width - 40;
			const height = width / imageAspectRatio;
			return (
				<View>
					<Image style={{ width, height, ...styles.bannerImage }} source={{ uri: image.data }} resizeMode='contain' />
				</View>
			);
		}
	};

	const getSelectedBoardIcon = () => {
		if (!selectedBoard) {
			return <Image source={getIcon('discussionBoardIcon')} style={styles.discussionIcon} resizeMode='contain' />;
		}

		const status = selectedBoard?.t === 'l' ? selectedBoard?.visitor?.status || selectedBoard?.v?.status : userStatus;
		return (
			<IconOrAvatar
				displayMode={displayMode}
				avatar={selectedBoard?.avatar}
				type={selectedBoard?.t}
				rid={selectedBoard?.rid}
				showAvatar={showAvatar}
				prid={selectedBoard?.prid}
				status={status}
				isGroupChat={selectedBoard?.isGrouChat}
				teamMain={selectedBoard?.teamMain}
				showLastMessage={false}
				displayMode={displayMode}
				sourceType={selectedBoard?.source}
				iconSize={40}
				borderRadius={10}
			/>
		);
	};

	const isButtonDisabled = () => {
		if (title.trim() == '' && description.trim() == '') {
			return true;
		}
		return false;
	};

	return (
		<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
			<ScrollView style={styles.mainContainer}>
				<View style={styles.boardContainer}>
					<Text style={styles.titleText}>Select Board</Text>
					<TouchableOpacity style={styles.discussionBoard} onPress={() => setShowBoardsModal(true)} hitSlop={hitSlop}>
						<View style={styles.boardIconContainer}>{getSelectedBoardIcon()}</View>
						<View style={styles.dropdown}>
							<Text style={styles.dropdownText}>{selectedBoard?.title ? selectedBoard.title : 'Select'}</Text>
							<Image source={getIcon('arrowDown')} style={styles.dropdownIcon} resizeMode='contain' />
						</View>
					</TouchableOpacity>
				</View>
				<View style={styles.titleContainer}>
					<Text style={styles.titleText}>Post Title</Text>
					<TextInput
						style={styles.textInput}
						placeholder='Title'
						placeholderTextColor={themes[theme].auxiliaryText}
						underlineColorAndroid='transparent'
						onChangeText={e => setTitle(e)}
						value={title}
					/>
				</View>
				{showBanner()}
				<View style={styles.descriptionContainer}>
					<Text style={styles.titleText}>Media</Text>
					<TouchableOpacity
						style={styles.mediaContainer}
						onPress={onImagePicker}
						hitSlop={{ top: 0, right: 0, bottom: 0, left: 0 }}
					>
						<Image source={getIcon('saveMedia')} style={styles.selectImage} resizeMode='contain' />
						<Text style={styles.mediaText}>Add Photos/Videos</Text>
					</TouchableOpacity>
				</View>
				<View style={styles.descriptionContainer}>
					<Text style={styles.titleText}>Description</Text>
					<TextInput
						style={{ ...styles.textInput, ...styles.largeTextInput, textAlignVertical: 'top' }}
						placeholder='Description'
						placeholderTextColor={themes[theme].auxiliaryText}
						underlineColorAndroid='transparent'
						onChangeText={e => setDescription(e)}
						multiline
						value={description}
						maxLength={4000}
					/>
				</View>
				<View style={styles.footer} />
			</ScrollView>
			<View style={styles.buttonContainer}>
				<TouchableOpacity
					style={{ ...styles.button, ...(isButtonDisabled() && { opacity: 0.5 }) }}
					onPress={() => setShowReadyToPost(true)}
					disabled={isButtonDisabled()}
				>
					<Text style={styles.buttonText}>Publish</Text>
				</TouchableOpacity>
			</View>
			<BoardDropdownModal
				show={showBoardsModal}
				close={() => setShowBoardsModal(false)}
				data={boards}
				onSelect={board => {
					setSelectedBoard(board);
					setShowBoardsModal(false);
				}}
			/>
			<ReadyToPost
				show={showReadyToPost}
				close={() => setShowReadyToPost(false)}
				onPost={() => {
					const { rid } = selectedBoard;
					const hasAttachment = image ? true : false;
					let finalDescrition = description;

					if (title) {
						finalDescrition = `${title} \n\n ${description}`;
					}

					let fileInfo = {};
					if (hasAttachment) {
						fileInfo = {
							name: image.filename,
							description: finalDescrition,
							size: image.size,
							type: image.mime,
							path: image.path,
							store: 'Uploads'
						};
					}

					handleSendMessage({
						message: finalDescrition,
						rid,
						callBack: () => {
							setShowReadyToPost(false);
							navigation.goBack();
						},
						hasAttachment,
						fileInfo,
						server,
						user: { id: user.id, token: user.token }
					});
				}}
			/>
		</KeyboardAvoidingView>
	);
};

export default withTheme(NewPostView);
