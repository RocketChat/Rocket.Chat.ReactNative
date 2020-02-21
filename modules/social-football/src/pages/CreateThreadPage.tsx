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
import {HeaderSaveThreadButton} from "../components/header/HeaderSaveThreadButton";
import {useMutation} from "@apollo/react-hooks";
import {CREATE_THREAD} from "../api/mutations/threads.mutations";
import {Alert} from "../components/Alert";

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
        }
    }
);

const CreateThreadPage = ({navigation}) => {
    const [performCreation, {data, loading, error}] = useMutation<{ createThread: boolean }>(CREATE_THREAD);
    const [submitted, setSubmitted] = useState(false);

    const [commentsEnabled, setCommentsEnabled] = useState(true); // set toggle button response to true
    const [type, setType] = useState(ContentType.TEXT);
    const [title, setTitle] = useState<string | null>(null);
    const [description, setDescription] = useState<string | null>(null);
    const [link, setLink] = useState<string | null>(null);
    const [youtube, setYoutube] = useState<string | null>(null);

    const determineAssetUrl = () => {
        switch (type) {
            case ContentType.YOUTUBE:
                return youtube;
            case ContentType.LINK:
                return link;
        }
    };

    const isValid = () => {
        return (
            !!title &&
            !!type &&
            !!description &&
            (type !== ContentType.LINK || !!link) &&
            (type !== ContentType.YOUTUBE || !!youtube)
        );
    };

    const onCreatePress = async () => {
        setSubmitted(true);

        if (!isValid()) {
            return;
        }

        await performCreation({
            variables: {
                thread: {
                    title,
                    type,
                    description,
                    commentsEnabled,
                    published: false,
                    assetUrl: determineAssetUrl(),
                }
            }
        });
    };

    const renderLinkInput = () => {
        return <View style={appStyles.formGroup}>
            <Text style={[appStyles.label]}>{i18n.t('createThread.link.label')}</Text>
            <TextInput
                id={'link'}
                required={true}
                submitted={submitted}
                placeholder={i18n.t('createThread.link.placeholder')}
                placeholderTextColor={appColors.placeholder}
                value={link}
                textContentType='URL'
                autoCapitalize='none'
                onChangeText={value => setLink(value)}
            />
        </View>;
    };

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

    useEffect(() => {
        navigation.setParams({
            headerRight: <HeaderSaveThreadButton onPress={onCreatePress}/>
        });
    }, []);

    const renderThreadIsFailed = () => {
        return <View style={styles.error}>
            <Alert title={i18n.t('createThread.error.label')}/>
        </View>
    };

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
                    <View style={[styles.switchContainer, appStyles.formGroup]}>
                        <Text style={[appStyles.label]}>{i18n.t('createThread.comment.label')}</Text>
                        <Switch
                            id={'commentsEnabled'}
                            value={commentsEnabled}
                            onValueChange={(value) => setCommentsEnabled(value)}
                        />
                    </View>
                </View>
            </View>
        </ScrollView>
    </KeyboardUtilityView>;
};

CreateThreadPage.navigationOptions = ({navigation}) => {
    return {
        headerRight: navigation.getParam('headerRight', null),
    };
};

export default CreateThreadPage;
