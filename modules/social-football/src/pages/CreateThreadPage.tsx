import React, {useEffect, useState} from 'react';
import i18n from '../i18n';
import {KeyboardUtilityView} from '../components/KeyboardUtilityView';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {appStyles} from '../theme/style';
import {TextInput} from '../components/TextInput';
import {appColors} from '../theme/colors';
import {Switch} from '../components/Switch'
import {ContentType} from '../enums/content-type';
import {ContentTypeButton} from '../components/ContentTypeButton';
import {useMutation, useQuery} from "refetch-queries";
import {CREATE_THREAD} from "../api/mutations/threads.mutations";
import {Alert} from "../components/Alert";
import {Button} from "../components/Button";
import Urls from "../../../../app/containers/message/Urls"
import {AssetMetadata} from '../models/asset-metadata';
import isURL from 'is-url'
import {PREVIEW_METADATA} from '../api/queries/threads.queries';
import {ThreadsQueries} from '../api';
import {ImagePicker} from "../components/ImagePicker";
import { Image } from 'react-native-image-crop-picker';
import {ReactNativeFile} from 'apollo-upload-client';

/**
 * Defines the standard Stylesheet for the Create Thread Page.
 */
const styles = StyleSheet.create({
        container: {
            width: '100%',
            maxWidth: 350,
        },
        form: {
            width: '100%',
            marginTop: 30,
        },
        switchContainer: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        contentTypesContainer: {
            marginTop: 10,
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        error: {
            marginBottom: 20,
        },
        publish: {
            marginTop: 10,
        },
    }
);

/**
 * Creates the Page.
 */
const CreateThreadPage = ({navigation}) => {
    const [performCreation, {data, loading, error}] = useMutation<{ createThread: boolean }>(CREATE_THREAD);
    const { data: urlLinkPreview, refetch: refetchLinkUrlPreview } = useQuery<{ getPreviewMetadata: AssetMetadata | undefined }>(PREVIEW_METADATA);
    const { data: urlYoutubePreview, refetch: refetchYoutubeUrlPreview } = useQuery<{ getPreviewMetadata: AssetMetadata | undefined }>(PREVIEW_METADATA);
    const [submitted, setSubmitted] = useState(false);

    const [commentsEnabled, setCommentsEnabled] = useState(true); // set toggle button response to true
    const [type, setType] = useState(ContentType.TEXT);
    const [title, setTitle] = useState<string | null>(null);
    const [description, setDescription] = useState<string | null>(null);
    const [link, setLink] = useState<string | null>(null);
    const [youtube, setYoutube] = useState<string | null>(null);
    const [image, setImage] = useState<Image | null>(null);

    /**
     * Checks if the added URL is a special content type.
     */
    const determineAssetUrl = () => {
        switch (type) {
            case ContentType.YOUTUBE:
                return youtube;
            case ContentType.LINK:
                return link;
        }
    };

    /**
     * Check if file was uploaded
     */
    const determineAssetFile = () => {
        switch (type) {
            case ContentType.IMAGE:
                const pathParts = image!.path.split('/');
                const fileName = image!.filename ?? pathParts[pathParts.length - 1];

                return new ReactNativeFile({
                    uri: image!.path,
                    name: fileName,
                    type: image!.mime,
                })
            default:
                return {};
        }
    };

    /**
     * Checks if all required information for the Thread is filled.
     *
     * @returns {bool}
     */
    const isValid = () => {
        return (
            !!title &&
            !!type &&
            !!description &&
            (type !== ContentType.LINK || !!link) &&
            (type !== ContentType.YOUTUBE || !!youtube) &&
            (type !== ContentType.IMAGE || !!image)
        );
    };

    const onCreatePress = async (published: boolean) => {
        setSubmitted(true);

        if (!isValid()) {
            return;
        }

        const thread = {
            title,
            type,
            description,
            commentsEnabled,
            published,
            assetUrl: determineAssetUrl(),
            assetFile: determineAssetFile(),
        };

        await performCreation({
            variables: {
                thread,
            },
            refetchQueriesMatch: [
                {
                    query: ThreadsQueries.TIMELINE,
                    variables: { }
                }
            ]
        });

        await navigation.pop();
    };

    /**
     * Creates the Form that has to be filled in when creating a new Thread.
     *
     * @returns {JSX.element Form}
     */
    const renderLinkInput = () => {
        return <View style={appStyles.formGroup}>
            <Text style={[appStyles.label]}>{i18n.t('createThread.link.label')}</Text>
            <TextInput
                id={'link'}
                required={true}
                submitted={submitted}
                placeholder={i18n.t('createThread.link.placeholder')}
                placeholderTextColor={appColors.placeholder}
                textContentType='URL'
                autoCapitalize='none'
                onChangeText={value => setLink(value)}
            />
        </View>;
    };

    /**
     * Creates the Card that shows the Youtube card information.
     *
     * @returns {JSX.element Form}
     */
    const renderYoutubeInput = () => {
        return <View style={appStyles.formGroup}>
            <Text style={[appStyles.label]}>{i18n.t('createThread.youtube.label')}</Text>
            <TextInput
                id={'youtube'}
                required={true}
                submitted={submitted}
                placeholder={i18n.t('createThread.youtube.placeholder')}
                placeholderTextColor={appColors.placeholder}
                value={youtube}
                onChangeText={value => setYoutube(value)}/>
        </View>;
    };

    const renderThreadIsFailed = () => {
        return <View style={styles.error}>
            <Alert title={i18n.t('createThread.error.label')}/>
        </View>
    };

    /**
     * Checks if the filled URL is a correct and supported link.
     */
    useEffect(() => {
        const url = type === ContentType.LINK ? link : youtube;

        if (!isURL(url)) {
            return;
        }

        if (type === ContentType.LINK && refetchLinkUrlPreview) {
            refetchLinkUrlPreview({
                type,
                url,
            });
        } else {
            refetchYoutubeUrlPreview({
                type,
                url,
            });
        }
    }, [type, youtube, link])

    /**
     * Decides which Link Card to show.
     */
    const renderLinkPreview = () => {
        if (urlYoutubePreview?.getPreviewMetadata && ContentType.YOUTUBE === type) {
            return <Urls urls={[urlYoutubePreview.getPreviewMetadata]} user={{}} />
        } else if (urlLinkPreview?.getPreviewMetadata && ContentType.LINK === type) {
            return <Urls urls={[urlLinkPreview.getPreviewMetadata]} user={{}} />
        }

        return null;
    };

    /**
     * Render image input
     */
    const renderImageInput = () => {
        return <View style={appStyles.formGroup}>
            <Text style={[appStyles.label]}>{i18n.t('createThread.image.label')}</Text>
            <ImagePicker
                id={'image'}
                required={true}
                submitted={submitted}
                onChange={(path) => setImage(path)} />
        </View>;
    };

    /**
     * Makes sure that the Keyboard is rendered correctly.
     *
     * @returns {KeyboardUtilityView}
     */
    return <KeyboardUtilityView centerVertically={false}>
        <ScrollView style={styles.container}>
            <View>
                <View style={[styles.form]}>
                    {error ? renderThreadIsFailed() : null}
                    <View>
                        <Text style={[appStyles.label]}>{i18n.t('createThread.threadtitle.label')}</Text>
                        <TextInput
                            id={'title'}
                            required={true}
                            submitted={submitted}
                            placeholder={i18n.t('createThread.threadtitle.placeholder')}
                            placeholderTextColor={appColors.placeholder}
                            value={title}
                            onChangeText={(value) => setTitle(value)}
                        />
                    </View>
                    <View style={[appStyles.formGroup]}>
                        <Text style={[appStyles.label]}>{i18n.t('createThread.description.label')}</Text>
                        <TextInput
                            id={'description'}
                            required={true}
                            multiline={true}
                            submitted={submitted}
                            numberOfLines={4}
                            placeholder={i18n.t('createThread.description.placeholder')}
                            placeholderTextColor={appColors.placeholder}
                            value={description}
                            onChangeText={(value) => setDescription(value)}
                        />
                    </View>
                    <View style={[appStyles.formGroup]}>
                        <Text style={[appStyles.label]}>{i18n.t('createThread.contentType.label')}</Text>
                        <View style={[styles.contentTypesContainer]}>
                            {
                                Object.values(ContentType).map((contentType, index) => (
                                    <ContentTypeButton
                                        id={`type-${contentType}`}
                                        key={`type-${contentType}`}
                                        active={type === contentType}
                                        onPress={() => setType(contentType)}
                                        type={contentType}/>
                                ))
                            }
                        </View>
                    </View>
                    {type === ContentType.LINK ? renderLinkInput() : null}
                    {type === ContentType.YOUTUBE ? renderYoutubeInput() : null}
                    {type === ContentType.IMAGE ? renderImageInput() : null}
                    {renderLinkPreview()}
                    <View style={[styles.switchContainer, appStyles.formGroup]}>
                        <Text style={[appStyles.label]}>{i18n.t('createThread.comment.label')}</Text>
                        <Switch
                            id={'commentsEnabled'}
                            value={commentsEnabled}
                            onValueChange={(value) => setCommentsEnabled(value)}
                        />
                    </View>
                    <View style={[appStyles.formGroup]}>
                        <Button type={'secondary'} title={i18n.t('createThread.save')} onPress={() => onCreatePress(false)} loading={loading} />

                        <View style={[styles.publish]}>
                            <Button title={i18n.t('createThread.publish')} onPress={() => onCreatePress(true)} loading={loading} />
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
    </KeyboardUtilityView>;
};

/**
 * Gets the localized title for the header.
 *
 * @returns {headerTitle}
 */
CreateThreadPage.navigationOptions = ({navigation}) => {
    return {
        headerTitle: i18n.t('createThread.title'),
    };
};

export default CreateThreadPage;
