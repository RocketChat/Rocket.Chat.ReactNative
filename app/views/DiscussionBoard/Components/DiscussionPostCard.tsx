import React, { useEffect, useState } from 'react';
import { Text, View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import moment from 'moment';
import FastImage from 'react-native-fast-image';
import { createImageProgress } from 'react-native-image-progress';
import * as Progress from 'react-native-progress';

import { useTheme, withTheme } from '../../../theme';
import { SavedPostCardProps } from '../DiscussionHomeView/interaces';
import { getDate, getIcon } from '../helpers';
import { formatAttachmentUrl } from '../../../lib/methods/helpers';
import { useSelector } from 'react-redux';
import { IApplicationState } from '../../../definitions';
import { getUserSelector } from '../../../selectors/login';
import { themes } from '../../../lib/constants';
import Markdown from '../../../containers/markdown';
import Avatar from '../../../containers/Avatar/Avatar';
import { loadThreadMessages } from '../../../lib/methods';
import { Services } from '../../../lib/services';
import RoomServices from './../../RoomView/services';

const hitSlop = { top: 10, right: 10, bottom: 10, left: 10 };

const DiscussionPostCard = React.memo((item: SavedPostCardProps) => {
	const user = useSelector((state: IApplicationState) => getUserSelector(state));
	const customEmojis = useSelector((state: IApplicationState) => state.customEmojis);
	const server = useSelector((state: IApplicationState) => state.server.server);

	// const { theme } = useTheme();
	const theme = 'light';

	const { title, starPost, _raw, onPress, roomId } = item;
	const { msg, id, ts, u: userObject, urls, attachments, replies, reactions, starred, rid } = _raw;

	const [isSaved, setIsSaved] = useState(false);
	const [replyList, setReplyList] = useState([]);
	const [description, setDescription] = useState('');
	const [bannerImage, setBannerImage] = useState(null);
	const [likeCount, setLikeCount] = useState(0);
	const [hasLiked, setHasLiked] = useState(false);
	let userName = userObject?.username;

	const ImageProgress = createImageProgress(FastImage);

	const likePost = async () => {
		try {
			await like(id);
			if (roomId) {
				await RoomServices.getMessages(roomId);
			}
			if (!hasLiked) {
				setLikeCount(likeCount + 1);
			} else {
				setLikeCount(likeCount - 1);
			}
			setHasLiked(!hasLiked);
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

	const getCustomEmoji = name => {
		const emoji = customEmojis[name];
		if (emoji) {
			return emoji;
		}
		return null;
	};

	const getReplies = async () => {
		const repliesList = await loadThreadMessages({ tmid: id, rid: rid });
		if (repliesList) {
			setReplyList(repliesList);
		}
	};

	useEffect(() => {
		if (item) {
			setIsSaved(starred);
			setReplyList(replies);
			setDescription(msg);
			setLikeCount(0);
			setHasLiked(false);
			if (attachments?.length > 0) {
				setBannerImage(formatAttachmentUrl(attachments[0].image_url, user.id, user.token, server));
				setDescription(attachments[0].description);
			}
			if (reactions && typeof reactions !== 'string') {
				const likes = reactions?.filter((reaction: any) => reaction?.emoji === ':thumbsup:') || [];
				const likedReaction = likes?.find((reaction: any) => {
					const hasReacted = reaction?.usernames?.find((name: string) => name === user.username);
					return hasReacted ? true : false;
				});
				const count = likes[0]?.usernames?.length || 0;
				setLikeCount(count);
				setHasLiked(likedReaction ? true : false);
			}
			getReplies();
		}
	}, [item]);

	return (
		<TouchableOpacity style={styles.container} onPress={() => onPress && onPress({ item })} key={id}>
			<View style={styles.header}>
				{userName && <Avatar text={userName} style={styles.profileImage} size={34} server={server} borderRadius={17} />}
				<View style={styles.headerTextContainer}>
					<Text style={styles.nameText}>{userObject?.name}</Text>
					<Text style={styles.dateText}>{getDate(ts)}</Text>
				</View>
				<TouchableOpacity
					onPress={() => {
						if (starPost) {
							starPost(_raw);
							setIsSaved(!isSaved);
						}
					}}
					hitSlop={hitSlop}
				>
					<Image source={isSaved ? getIcon('solidSave') : getIcon('outlineSave')} style={styles.saveIcon} resizeMode='contain' />
				</TouchableOpacity>
			</View>
			{typeof attachments !== 'string' && attachments?.length > 0 && (
				<ImageProgress
					style={[styles.bannerImage]}
					source={{ uri: encodeURI(bannerImage) }}
					resizeMode={FastImage.resizeMode.cover}
					indicator={Progress.Pie}
					indicatorProps={{
						color: themes[theme].actionTintColor
					}}
				/>
			)}

			<View style={styles.textContainer}>
				{title ? <Text style={styles.title}>{title}</Text> : <></>}
				{description ? (
					<Markdown
						msg={`${description?.slice(0, 300)}${description?.length > 300 ? '...' : ''}`}
						// style={[isReply && style]}
						// style={[styles.description]}
						username={user.username}
						getCustomEmoji={getCustomEmoji}
						theme={theme}
					/>
				) : (
					<></>
				)}
			</View>
			<View style={styles.actionContainer}>
				<View style={styles.buttonContainer}>
					<TouchableOpacity onPress={likePost} style={styles.buttonContainer}>
						<Image source={getIcon('like')} style={{ ...styles.postReaction, ...(hasLiked && { tintColor: 'blue' }) }} />
						<Text style={styles.postReactionText}>{likeCount ? `${likeCount}` : '0'}</Text>
					</TouchableOpacity>
					<View style={{ width: 24 }} />
					<Image source={getIcon('comment')} style={styles.postReaction} />
					<Text style={styles.postReactionText}>{replyList?.length ?? '0'}</Text>
				</View>
				<TouchableOpacity hitSlop={hitSlop} onPress={() => onPress && onPress({ item })}>
					<Image source={getIcon('arrowRight')} style={styles.arrow} resizeMode='contain' />
				</TouchableOpacity>
			</View>
		</TouchableOpacity>
	);
});

export default withTheme(DiscussionPostCard);

const styles = StyleSheet.create({
	container: {
		width: '100%',
		elevation: 1,
		backgroundColor: '#fff',
		padding: 20,
		borderRadius: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.05,
		shadowRadius: 30,
		elevation: 5
	},
	header: {
		flexDirection: 'row',
		marginBottom: 12.5,
		alignItems: 'center'
	},
	profileImage: {
		width: 34,
		height: 34,
		borderRadius: 17,
		justifyContent: 'center',
		alignItems: 'center'
	},
	headerTextContainer: {
		marginLeft: 12,
		flex: 1
	},
	nameText: {
		fontSize: 14,
		lineHeight: 20,
		fontWeight: '400'
	},
	dateText: {
		fontSize: 12,
		lineHeight: 15,
		fontWeight: '400',
		color: '#00000080'
	},
	saveIcon: {
		width: 18,
		height: 18
	},
	postReaction: {
		height: 14,
		width: 14
	},
	postReactionText: {
		fontSize: 10,
		lineHeight: 12,
		fontWeight: '400',
		marginLeft: 6
	},
	bannerImage: {
		borderRadius: 20,
		height: 160,
		width: '100%',
		justifyContent: 'center',
		alignItems: 'center'
	},
	arrow: {
		height: 15,
		width: 15
	},
	textContainer: {
		paddingTop: 6,
		marginVertical: 10
	},
	title: {
		fontFamily: 'Inter',
		fontWeight: '500',
		fontSize: 16,
		lineHeight: 19,
		color: '#000000'
	},
	description: {
		fontFamily: 'Inter',
		fontWeight: '400',
		fontSize: 12,
		lineHeight: 15,
		marginTop: 4,
		color: '#000000b3'
	},
	actionContainer: {
		width: '100%',
		height: 33,
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between'
	},
	buttonContainer: {
		flexDirection: 'row',
		alignItems: 'center'
	}
});
