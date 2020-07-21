import React from 'react';
import {
	View,
	StyleSheet,
	Dimensions,
	Text,
	TouchableOpacity,
	Linking,
	Platform
} from 'react-native';
import PropTypes from 'prop-types';
import FastImage from '@rocket.chat/react-native-fast-image';
import { createImageProgress } from 'react-native-image-progress';
import * as Progress from 'react-native-progress';

import { themes } from '../../constants/colors';
import { showConfirmationAlert } from '../../utils/info';
import I18n from '../../i18n';
import log from '../../utils/log';

const { width: WIDTH_WINDOW } = Dimensions.get('window');
const ImageProgress = createImageProgress(FastImage);

const styles = StyleSheet.create({
	reacttionPosition: {
		position: 'absolute',
		bottom: -9,
		right: 5
	},
	imageMaps: {
		width: WIDTH_WINDOW / 1.5,
		height: 150
	},
	textAddress: {
		fontSize: 14,
		width: WIDTH_WINDOW / 1.5,
		marginTop: 3
	},
	msgInRoom: {
		padding: 5,
		borderRadius: 10,
		borderWidth: 0.5,
		borderColor: '#d8d8d8'
	}
});

const ImageMaps = React.memo(({
	coordinates, latitude, longitude, MapView_GMapsAPIKey, theme
}) => {
	const uriMaps = `https://maps.googleapis.com/maps/api/staticmap?zoom=13&size=350x200&maptype=roadmap&markers=color:red%7Clabel:%7C${ latitude },${ longitude }&key=${ MapView_GMapsAPIKey }`;
	if (!coordinates) {
		return <View style={[styles.imageMaps, { backgroundColor: themes[theme].backgroundColor }]} />;
	} else {
		return (
			<ImageProgress
				style={styles.imageMaps}
				source={{ uri: uriMaps }}
				resizeMode={FastImage.resizeMode.cover}
				indicator={Progress.Pie}
				indicatorProps={{
					color: themes[theme].actionTintColor
				}}
			/>
		);
	}
});

const ImageContainer = React.memo((props) => {
	const [currentAddress, setCurrentAddress] = React.useState('');
	const { coordinates } = props.location;
	const LATITUDE = coordinates[1];
	const LONGITUDE = coordinates[0];

	const fetchAddress = async() => {
		try {
			const URL = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${ LATITUDE },${ LONGITUDE }&location_type=ROOFTOP&result_type=street_address&key=${ props.MapView_GMapsAPIKey }`;
			const response = await fetch(URL);
			const responseJson = await response.json();
			const address = responseJson.results[0].formatted_address || '';
			setCurrentAddress(address);
		} catch (error) {
			log(error);
		}
	};

	const openMapsDevice = () => {
		const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
		const latLng = `${ LATITUDE },${ LONGITUDE }`;
		const label = 'Custom Label';
		const url = Platform.select({ ios: `${ scheme }${ label }@${ latLng }`, android: `${ scheme }${ latLng }(${ label })` });
		Linking.openURL(url);
	};

	const openMaps = () => {
		showConfirmationAlert({
			message: I18n.t('Open_Google_Maps'),
			callToAction: I18n.t('Confirm'),
			onPress: async() => {
				await openMapsDevice();
			}
		});
	};

	React.useEffect(() => {
		fetchAddress();
	}, []);

	return (
		<TouchableOpacity
			style={{ position: 'relative', ...styles.msgInRoom }}
			activeOpacity={0.5}
			onPress={openMaps}
		>
			<>
				<ImageMaps
					coordinates={coordinates}
					latitude={LATITUDE}
					longitude={LONGITUDE}
					MapView_GMapsAPIKey={props.MapView_GMapsAPIKey}
					theme={props.theme}
					baseUrl={props.baseUrl}
					author={props.author}
				/>
				{
					currentAddress ? (
						<Text
							numberOfLines={2}
							style={[styles.textAddress, { color: themes[props.theme].bodyText }]}
						>
							{currentAddress}
						</Text>
					) : null
				}
			</>
		</TouchableOpacity>
	);
});

export default ImageContainer;

ImageContainer.propTypes = {
	theme: PropTypes.string,
	user: PropTypes.object,
	author: PropTypes.object,
	MapView_GMapsAPIKey: PropTypes.string,
	location: PropTypes.object,
	baseUrl: PropTypes.string
};

ImageMaps.propTypes = {
	MapView_GMapsAPIKey: PropTypes.string,
	latitude: PropTypes.number,
	longitude: PropTypes.number,
	theme: PropTypes.string,
	coordinates: PropTypes.array
};
ImageMaps.displayName = 'ImageMaps';
