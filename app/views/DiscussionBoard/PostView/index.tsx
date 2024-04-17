import React, { useEffect, useRef, useState } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	Image,
	ScrollView,
	TextInput,
	KeyboardAvoidingView,
	Platform,
	Keyboard,
	Dimensions,
	Alert
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import FastImage from 'react-native-fast-image';
import { createImageProgress } from 'react-native-image-progress';
import * as Progress from 'react-native-progress';

import * as HeaderButton from '../../../containers/HeaderButton';
import {
	//  useTheme,
	withTheme
} from '../../../theme';
import { IApplicationState } from '../../../definitions';
import { themes } from '../../../lib/constants';
import styles from './styles';
import CommentOptionsModal from './PostOptions';
import PostDeleteModal from './PostDelete';
import PostReportModal from './PostReport';
import { DeleteType, ReportType, CommentProps } from './interfaces';
import { getDate, getIcon } from '../helpers';
import Markdown from '../../../containers/markdown';
import Avatar from '../../../containers/Avatar/Avatar';
import { formatAttachmentUrl, hasPermission } from '../../../lib/methods/helpers';
import { getUserSelector } from '../../../selectors/login';
import { Services } from '../../../lib/services';
import { loadThreadMessages, sendMessage } from '../../../lib/methods';
import RoomServices from './../../RoomView/services';

import { ResizeMode, Video } from 'expo-av';


const hitSlop = { top: 10, right: 10, bottom: 10, left: 10 };

const PostView: React.FC = ({ route }) => {
	const navigation = useNavigation<StackNavigationProp<any>>();
	const [newComment, setNewComment] = useState('');
	const [textinputHeight, setTextinputHeight] = useState(0);
	const [showCommentOptionsModal, setShowCommentOptionsModal] = useState(false);
	const [selectedComment, setSelectedComment] = useState({} as CommentProps);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [deleteType, setDeleteType] = useState(DeleteType.COMMENT);
	const [showReportModal, setShowReportModal] = useState(false);
	const [reportType, setReportType] = useState(ReportType.COMMENT);
	const [keyboardHeight, setKeyboardHeight] = useState(0);
	const [postHeight, setPostHeight] = useState(0);

	const textInputRef = useRef(null);
	const scrollviewRef = useRef(null);
	const commentsRef = useRef(null);

	const [ownPost, setOwnPost] = useState(false);

	const user = useSelector((state: IApplicationState) => getUserSelector(state));
	const customEmojis = useSelector((state: IApplicationState) => state.customEmojis);
	const server = useSelector((state: IApplicationState) => state.server.server);
	const isMasterDetail = useSelector((state: IApplicationState) => state.app.isMasterDetail);
	const deleteMessagePermission = useSelector((state: IApplicationState) => state.permissions['delete-message']);
	const messagePermission = useSelector((state: IApplicationState) => state.permissions['create-d']);

	// const { theme } = useTheme();
	const theme = 'light';

	const [postUser, setPostUser] = useState(null);
	const [post, setPost] = useState(null);
	const [bannerImage, setBannerImage] = useState<string | null>(null);
	const [description, setDescription] = useState(null);
	const [bannerHeight, setBannerHeight] = useState(100);
	const [reportReason, setReportReason] = useState(null);
	const [replies, setReplies] = useState([]);
	const [postLiked, setPostLiked] = useState(false);
	const [postLikes, setPostLikes] = useState(false);
	const [showDelete, setShowDelete] = useState(true);
	const [showCreateChat, setShowCreateChat] = useState(false);

	const [videoUri, setVideoUri] = useState<string | null>(null);
	const videoRef = useRef<Video>(null);

	const ImageProgress = createImageProgress(FastImage);

	useEffect(() => {
		const post = route.params?.item;
		if (post) {
			// Parse post._raw.u if it's a stringified JSON
			const postUser = typeof post._raw.u === 'string' ? JSON.parse(post._raw.u) : post._raw.u;
			setPostUser(postUser);
			setPost(post._raw);
			setDescription(post?._raw?.msg);

			const attachments = post?._raw?.attachments;
			if (typeof attachments !== 'string' && attachments?.length > 0) {
				const attachment = attachments[0];
				if (attachment.video_url) {
					const url = formatAttachmentUrl(attachment.video_url, user.id, user.token, server);
					const uri = encodeURI(url);
					setVideoUri(uri);
				} else {
					const banner = formatAttachmentUrl(attachment.image_url, user.id, user.token, server);
					setBannerImage(banner);
					setDescription(attachment.description);
					Image.getSize(banner, (width, height) => {
						const bannerContainerWidth = Dimensions.get('window').width - 40;
						const bannerContainerHeight = (bannerContainerWidth * height) / width;
						setBannerHeight(bannerContainerHeight);
					});
				}
			}

			if (postUser._id === user.id) {
				setOwnPost(true);
			}

			loadComments();
			checkPermission(postUser._id === user.id);

			const reactions = post?._raw?.reactions;
			if (reactions && typeof reactions !== 'string') {
				const likes = reactions?.filter(reaction => reaction?.emoji === ':thumbsup:') || [];
				const likedReaction = likes?.find(reaction => {
					const hasReacted = reaction?.usernames?.find(name => name === user.username);
					return hasReacted;
				});
				const likeCount = likes[0]?.usernames?.length || 0;
				setPostLikes(likeCount);
				setPostLiked(likedReaction);
			}
		}
	}, [route.params, user.id, user.token, user.username, server]);

	const getCustomEmoji = (name: string) => {
		const emoji = customEmojis[name];
		if (emoji) {
			return emoji;
		}
		return null;
	};

	const loadComments = async () => {
		const post = route.params?.item._raw;
		const repliesList = await loadThreadMessages({ tmid: post.id, rid: post.rid });
		if (repliesList && repliesList?.length > 0) {
			let formattedReplies = repliesList?.map(item => ({
				user: item.u,
				date: item.ts,
				description: item.msg,
				reactions: item.reactions,
				_id: item._id,
				rid: item.rid,
				tmid: item.tmid
			}));

			formattedReplies = [...formattedReplies];
			if (formattedReplies.length > 1) {
				formattedReplies = formattedReplies.reverse();
			}
			setReplies(formattedReplies);
		}
	};

	useEffect(() => {
		navigation.setOptions({ title: '', headerStyle: { shadowColor: 'transparent' } });
		if (!isMasterDetail) {
			navigation.setOptions({
				headerLeft: () => (
					<TouchableOpacity style={{ marginLeft: 20 }} onPress={() => navigation.goBack()}>
						<Image
							source={require('../../../static/images/discussionboard/arrow_left.png')}
							style={{ width: 11, height: 19 }}
							resizeMode='contain'
						/>
					</TouchableOpacity>
				),
				headerRight: () => (
					<View style={{ marginRight: 8 }}>
						<HeaderButton.Container>
							<HeaderButton.Item
								iconName='search'
								color={themes[theme].superGray}
								onPress={() => navigation.navigate('DiscussionSearchView')}
							/>
						</HeaderButton.Container>
					</View>
				)
			});
		}
	});

	useEffect(() => {
		const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event: any) => {
			setKeyboardHeight(event.endCoordinates.height);
		});
		const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
			setKeyboardHeight(0);
		});

		return () => {
			keyboardDidShowListener.remove();
			keyboardDidHideListener.remove();
		};
	}, []);

	const likeComment = async (id: string) => {
		await like(id);
		loadComments();
	};

	const likePost = async () => {
		try {
			await like(post?.id);
			if (!postLiked) {
				setPostLikes(postLikes + 1);
			} else {
				setPostLikes(postLikes - 1);
			}
			setPostLiked(!postLiked);
			// sync room chats
			await RoomServices.getMessages(post.rid);
		} catch (error) {
			console.log(error);
		}
	};

	const like = async (id: string) => {
		try {
			await Services.setReaction('thumbsup', id);
		} catch (error) {
			console.log(error);
		}
	};

	const comment = (item: CommentProps, key: number) => {
		const {
			_id,
			user: { name, username },
			date,
			description,
			reactions
		} = item;

		const likes = reactions?.filter(reaction => reaction?.emoji === ':thumbsup:') || [];
		const likedReaction = likes?.find(reaction => {
			const hasReacted = reaction?.usernames?.find(name => name === user.username);
			return hasReacted;
		});
		const likeCount = likes[0]?.usernames?.length || 0;
		const hasLiked = likedReaction;

		return (
			<View style={styles.comment} key={key}>
				<View style={styles.commentHeader}>
					<TouchableOpacity
						onPress={() => navigation.navigate('ConnectView', { user: item.user, fromRid: post?.rid, room: route.params?.room })}
					>
						<Avatar text={username} style={styles.profileImage} size={24} server={server} borderRadius={12} />
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.commentUsernameContainer}
						onPress={() => navigation.navigate('ConnectView', { user: item.user, fromRid: post?.rid, room: route.params?.room })}
					>
						<Text style={styles.commentUsername}>{name}</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.commentOptions}
						onPress={() => {
							setSelectedComment(item);
							setShowCommentOptionsModal(!showCommentOptionsModal);
						}}
					>
						<Image source={getIcon('more')} style={styles.commentOptionsIcon} resizeMode='contain' />
					</TouchableOpacity>
				</View>
				{description ? (
					<Markdown
						msg={description}
						style={[styles.description]}
						username={postUser?.username}
						getCustomEmoji={getCustomEmoji}
						theme={theme}
					/>
				) : null}
				<View style={styles.commentFooter}>
					<Text style={styles.commentDate}>{getDate(date)}</Text>
					<TouchableOpacity style={styles.commentReactions} onPress={() => likeComment(_id)} hitSlop={hitSlop}>
						<Image
							style={[styles.commentReactionIcon, hasLiked && { tintColor: 'blue' }]}
							source={getIcon('like')}
							resizeMode='contain'
						/>
						<Text style={styles.commentReactionText}>{likeCount}</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	};

	const commentSection = () => (
		<View ref={commentsRef}>
			<Text style={styles.commentsTitle}>Comments</Text>
			{replies.map((item, key) => comment(item, key))}
		</View>
	);

	const scrollCommentsToTop = () => {
		scrollviewRef?.current?.scrollTo({ y: postHeight, animated: true });
	};

	const onLayoutFooter = (event: any) => {
		const { height } = event.nativeEvent.layout;
		setTextinputHeight(height);
	};

	const onPostLayout = (event: any) => {
		const { height } = event.nativeEvent.layout;
		setPostHeight(height);
	};

	const handleReport = async () => {
		try {
			const id = reportType === ReportType.POST ? post?.id : selectedComment?._id;
			if (id) {
				await Services.reportMessage(id, reportReason);
				Alert.alert('Post Reported');
			}
		} catch (e) {
			console.error(e);
		}
	};

	const handleDelete = async () => {
		const message = deleteType === DeleteType.COMMENT ? selectedComment : post;
		try {
			if (message) {
				const response = await Services.deleteMessage(deleteType === DeleteType.COMMENT ? message._id : message.id, message.rid);
				if (response.success) {
					if (deleteType === DeleteType.COMMENT) {
						setTimeout(() => {
							loadComments();
						}, 500);
					} else {
						navigation.goBack();
					}
				}
			}
		} catch (e) {
			console.error(e);
		}
	};

	const checkPermission = async (ownPost: boolean) => {
		let show = true;
		let chat = false;
		if (ownPost) {
			const deletePermissions = await hasPermission([deleteMessagePermission], post?.rid);
			if (!deletePermissions[0]) {
				show = false;
			}
		}
		setShowDelete(show);

		const createDirectPermissions = await hasPermission([messagePermission]);
		if (createDirectPermissions[0]) {
			chat = true;
		}
		setShowCreateChat(chat);
	};

	const sendReply = (message: string) => {
		sendMessage(post?.rid, message, post?.id, user).then(() => {
			loadComments();
			setNewComment('');
		});
	};
	return (
		<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
			<View style={styles.mainContainer}>
				<ScrollView showsVerticalScrollIndicator={false} ref={scrollviewRef}>
					<View onLayout={onPostLayout} style={styles.postContainer}>
						<View style={styles.header}>
							{postUser?.username ? (
								<TouchableOpacity
									onPress={() =>
										navigation.navigate('ConnectView', { user: postUser, fromRid: post?.rid, room: route.params?.room })
									}
								>
									<Avatar text={postUser?.username} style={styles.profileImage} size={24} server={server} borderRadius={12} />
								</TouchableOpacity>
							) : (
								<></>
							)}
							<TouchableOpacity
								style={styles.profileNameContainer}
								onPress={() =>
									navigation.navigate('ConnectView', { user: postUser, fromRid: post?.rid, room: route.params?.room })
								}
							>
								<Text style={styles.profileName}>{post?.u?.name ?? ''}</Text>
							</TouchableOpacity>
							{showDelete && (
								<TouchableOpacity
									onPress={() => {
										if (ownPost) {
											setDeleteType(DeleteType.POST);
											setShowDeleteModal(true);
										} else {
											setReportType(ReportType.POST);
											setShowReportModal(true);
										}
									}}
									hitSlop={hitSlop}
								>
									<Image source={getIcon('more')} style={styles.moreMenuIcon} resizeMode='contain' />
								</TouchableOpacity>
							)}
						</View>
						<View style={styles.content}>
						   {videoUri &&
							   <Video
								source={{ uri: videoUri }}
								rate={1.0}
								volume={1.0}
								isMuted={false}
								resizeMode={ResizeMode.CONTAIN}
								shouldPlay
								isLooping={false}
								style={{ aspectRatio: 16 / 9, width: '100%' }}
								useNativeControls
								onError={console.log}
								ref={videoRef}
							   />
							 }

							{bannerImage && (
								<ImageProgress
									style={[styles.banner, { height: bannerHeight }]}
									source={{ uri: encodeURI(bannerImage) }}
									resizeMode={FastImage.resizeMode.cover}
									indicator={Progress.Pie}
									indicatorProps={{
										color: themes[theme].actionTintColor
									}}
								/>
							)}
							{description ? (
								<Markdown
									msg={description}
									// style={[isReply && style]}
									style={[styles.description]}
									username={postUser?.username}
									getCustomEmoji={getCustomEmoji}
									theme={theme}
								/>
							) : (
								<></>
							)}
							<Text style={styles.postDate}>{getDate(post?.ts)}</Text>
						</View>
						<View style={styles.reactions}>
							<TouchableOpacity
								onPress={() => {
									likePost();
								}}
								style={{ flexDirection: 'row', alignItems: 'center' }}
								hitSlop={hitSlop}
							>
								<Image
									style={{ ...styles.icon, ...(postLiked && { tintColor: 'blue' }) }}
									source={getIcon('like')}
									resizeMode='contain'
								/>
								<Text style={styles.reactionText}>{postLikes > 0 ? postLikes : '0'}</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={() => scrollCommentsToTop()}
								style={{ flexDirection: 'row', alignItems: 'center' }}
								hitSlop={hitSlop}
							>
								<Image style={styles.icon} source={getIcon('comment')} resizeMode='contain' />
								<Text style={styles.reactionText}>{replies?.length ?? '0'}</Text>
							</TouchableOpacity>
						</View>
					</View>
					{replies && commentSection()}
					<View style={{ height: textinputHeight }} />
				</ScrollView>
			</View>
			{!showCommentOptionsModal && (
				<View style={{ ...styles.addCommentContainer, paddingBottom: keyboardHeight + 33 }} onLayout={onLayoutFooter}>
					<View style={styles.textInputContainer}>
						<TextInput
							ref={textInputRef}
							style={styles.textInput}
							value={newComment}
							placeholder={'Add a comment ...'}
							placeholderTextColor='#000000b3'
							onChangeText={text => {
								setNewComment(text);
							}}
							multiline
							maxLength={2000}
							underlineColorAndroid='transparent'
						/>
						<TouchableOpacity
							onPress={() => {
								// send api request to post comment
								sendReply(newComment);
								Keyboard.dismiss();
							}}
						>
							<Image source={getIcon('send')} style={styles.sendIcon} resizeMode='contain' />
						</TouchableOpacity>
					</View>
				</View>
			)}
			<CommentOptionsModal
				show={showCommentOptionsModal}
				comment={selectedComment}
				close={() => setShowCommentOptionsModal(false)}
				onDelete={() => {
					setDeleteType(DeleteType.COMMENT);
					setShowCommentOptionsModal(false);
					setShowDeleteModal(true);
					// loadComments();
				}}
				onReport={() => {
					setReportType(ReportType.COMMENT);
					setShowReportModal(true);
					setShowCommentOptionsModal(false);
				}}
				showDelete={showDelete}
				showMessage={showCreateChat}
			/>
			<PostDeleteModal
				show={showDeleteModal}
				type={deleteType}
				close={() => setShowDeleteModal(false)}
				delete={() => {
					handleDelete();
					setShowDeleteModal(false);
				}}
			/>
			<PostReportModal
				type={reportType}
				show={showReportModal}
				cancel={() => setShowReportModal(false)}
				report={() => {
					handleReport();
					setShowReportModal(false);
				}}
				onText={e => {
					setReportReason(e);
				}}
			/>
		</KeyboardAvoidingView>
	);
};

export default withTheme(PostView);
