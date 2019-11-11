import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import FastImage from 'react-native-fast-image';
import Touchable from 'react-native-platform-touchable';
import isEqual from 'lodash/isEqual';

import openLink from '../../utils/openLink';
import sharedStyles from '../../views/Styles';
import {
	COLOR_BACKGROUND_CONTAINER, COLOR_BORDER, COLOR_PRIMARY
} from '../../constants/colors';
import { withSplit } from '../../split';

const styles = StyleSheet.create({
	button: {
		marginTop: 6
	},
	container: {
		flex: 1,
		flexDirection: 'column',
		borderRadius: 4,
		backgroundColor: COLOR_BACKGROUND_CONTAINER,
		borderColor: COLOR_BORDER,
		borderWidth: 1
	},
	textContainer: {
		flex: 1,
		flexDirection: 'column',
		padding: 15,
		justifyContent: 'flex-start',
		alignItems: 'flex-start'
	},
	title: {
		color: COLOR_PRIMARY,
		fontSize: 16,
		...sharedStyles.textMedium
	},
	description: {
		fontSize: 16,
		...sharedStyles.textColorDescription,
		...sharedStyles.textRegular
	},
	marginTop: {
		marginTop: 4
	},
	image: {
		width: '100%',
		height: 150,
		borderTopLeftRadius: 4,
		borderTopRightRadius: 4
	}
});

const UrlImage = React.memo(({ image, user, baseUrl }) => {
	if (!image) {
		return null;
	}
	image = image.includes('http') ? image : `${ baseUrl }/${ image }?rc_uid=${ user.id }&rc_token=${ user.token }`;
	return <FastImage source={{ uri: image }} style={styles.image} resizeMode={FastImage.resizeMode.cover} />;
}, (prevProps, nextProps) => prevProps.image === nextProps.image);

const UrlContent = React.memo(({ title, description }) => (
	<View style={styles.textContainer}>
		{title ? <Text style={styles.title} numberOfLines={2}>{title}</Text> : null}
		{description ? <Text style={styles.description} numberOfLines={2}>{description}</Text> : null}
	</View>
), (prevProps, nextProps) => {
	if (prevProps.title !== nextProps.title) {
		return false;
	}
	if (prevProps.description !== nextProps.description) {
		return false;
	}
	return true;
});

const Url = React.memo(({
	url, index, user, baseUrl, split
}) => {
	if (!url) {
		return null;
	}

	const onPress = () => openLink(url.url);

	return (
		<Touchable
			onPress={onPress}
			style={[styles.button, index > 0 && styles.marginTop, styles.container, split && sharedStyles.tabletContent]}
			background={Touchable.Ripple('#fff')}
		>
			<>
				<UrlImage image={url.image} user={user} baseUrl={baseUrl} />
				<UrlContent title={url.title} description={url.description} />
			</>
		</Touchable>
	);
}, (oldProps, newProps) => isEqual(oldProps.url, newProps.url) && oldProps.split === newProps.split);

const Urls = React.memo(({
	urls, user, baseUrl, split
}) => {
	if (!urls || urls.length === 0) {
		return null;
	}

	return urls.map((url, index) => (
		<Url url={url} key={url.url} index={index} user={user} baseUrl={baseUrl} split={split} />
	));
}, (oldProps, newProps) => isEqual(oldProps.urls, newProps.urls) && oldProps.split === newProps.split);

UrlImage.propTypes = {
	image: PropTypes.string,
	user: PropTypes.object,
	baseUrl: PropTypes.string
};
UrlImage.displayName = 'MessageUrlImage';

UrlContent.propTypes = {
	title: PropTypes.string,
	description: PropTypes.string
};
UrlContent.displayName = 'MessageUrlContent';

Url.propTypes = {
	url: PropTypes.object.isRequired,
	index: PropTypes.number,
	user: PropTypes.object,
	baseUrl: PropTypes.string,
	split: PropTypes.bool
};
Url.displayName = 'MessageUrl';

Urls.propTypes = {
	urls: PropTypes.array,
	user: PropTypes.object,
	baseUrl: PropTypes.string,
	split: PropTypes.bool
};
Urls.displayName = 'MessageUrls';

export default withSplit(Urls);
