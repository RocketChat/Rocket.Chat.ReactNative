import React, {useState} from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {appColors} from "../theme/colors";
import i18n from '../i18n';
import {appStyles} from "../theme/style";
import BaseImagePicker, { Image as ImageModel } from 'react-native-image-crop-picker';
import ActionSheet from 'react-native-action-sheet';
import RNHeicConverter from 'react-native-heic-converter';

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 60,
        marginTop: 15,
        marginBottom: 15,
        borderWidth: 2,
        borderRadius: 5,
        borderStyle: 'dashed',
        borderColor: appColors.primary,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        height: 220,
    },
    error: {
        borderColor: appColors.error,
    },
    errorText: {
        color: appColors.error,
    },
    remove: {
        width: 40,
        height: 40,
        backgroundColor: appColors.light,
        position: "absolute",
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        right: 10,
        top: 10,
        shadowColor: appColors.dark,
        shadowRadius: 20,
        shadowOpacity: 0.20,
    },
    removeImage: {
        width: 18,
        height: 18,
    },
});

export const ImagePicker = ({ onChange = (path) => {}, required = false, submitted = false }) => {
    const [image, setImage] = useState<ImageModel|null>(null);

    /**
     * Emit value to parent
     * @param value 
     */
    const change = (value) => {
        setImage(value);
        onChange(value);
    };

    /**
     * When action sheet option was chosen
     * @param key selected number
     */
    const handlePress = async (key) => {
        let image: ImageModel|null = null;

        const options = {
            cropping: false,
            compressImageQuality: 0.8,
            avoidEmptySpaceAroundImage: false,
            loadingLabelText: i18n.t('Processing')
        };

        switch(key) {
            case 0:
                return;
            case 1:
                image = await BaseImagePicker.openCamera(options) as ImageModel;
                break;
            case 2:
                image = await BaseImagePicker.openPicker(options) as ImageModel;
                break;
        }

        change(image);
    };

    /**
     * Show an action sheet with available actions
     */
    const openUpload = () => {
        ActionSheet.showActionSheetWithOptions({
            options: [
                i18n.t('Cancel'),
                i18n.t('Take_a_photo'),
                i18n.t('Choose_from_library'),
            ],
            cancelButtonIndex: 0,
        }, (actionIndex) => {
            handlePress(actionIndex);
        });
    };

    const invalid = submitted && required && !image;

    return <TouchableOpacity onPress={() => openUpload()} style={[styles.container, image ? styles.image : {}, invalid ? styles.error : {}]}>
        {!image && <Text style={[appStyles.label, invalid ? styles.errorText : {}]}>{i18n.t('imagePicker.select')}</Text>}
        {image && <Image source={{ uri: image.path }} style={{width: '100%', height: '100%' }} />}
        {image && <TouchableOpacity id={'remove'} style={styles.remove} onPress={() => change(null)}>
            <Image style={styles.removeImage} source={require('../assets/images/remove.png')} />  
        </TouchableOpacity>}
    </TouchableOpacity>;
};
