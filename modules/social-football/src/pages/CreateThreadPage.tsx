import React, {useState} from 'react';
import i18n from '../i18n';
import {KeyboardUtilityView} from '../components/KeyboardUtilityView';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {appStyles} from '../theme/style';
import {TextInput} from '../components/TextInput';
import {appColors} from '../theme/colors';
import {Button} from '../components/Button'
import {Switch} from '../components/Switch'
import {ContentType} from '../enums/content-type';
import {ContentTypeButton} from '../components/ContentTypeButton';

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
            marginBottom: 40,
        },
    }
);

const CreateThreadPage = () => {
    const [submitted, setSubmitted] = useState(false);

    const [commentsEnabled, setCommentsEnabled] = useState(true); // set toggle button response to true
    const [type, setType] = useState(ContentType.TEXT);
    const [title, setTitle] = useState<string | null>(null);
    const [description, setDescription] = useState<string | null>(null);
    const [link, setLink] = useState<string | null>(null);
    const [youtube, setYoutube] = useState<string | null>(null);

    const onCreatePress = async () => {
        setSubmitted(true);
    };

    const renderLinkInput = () => {
        return <View>
                <Text style={[appStyles.label]}>{i18n.t('createThread.link.label')}</Text>
                <TextInput
                    id={'link'}
                    required={true}
                    submitted={submitted}
                    placeholder={i18n.t('createThread.link.placeholder')}
                    placeholderTextColor={appColors.placeholder}
                    value={link}
                    onChangeText={value => setLink(value)}
                />
            </View>;
    };

    const renderYoutubeInput = () => {
        return <View>
                <Text style={[appStyles.label]}>{i18n.t('createThread.youtube.label')}</Text>
                <TextInput
                    id={'youtube'}
                    required={true}
                    submitted={submitted}
                    placeholder={i18n.t('createThread.youtube.placeholder')}
                    placeholderTextColor={appColors.placeholder}
                    value={youtube}
                    onChangeText={value => setYoutube(value)} />
            </View>;
    };

    // const createThreadIsFailed = () => {
    //     return <Alert title={i18n.t('createThread.error.label')} />
    // };

    return <KeyboardUtilityView centerVertically={false}>
        <ScrollView style={styles.container}>
            <View>
                <View style={[styles.form]}>
                    {/*{error ? createThreadIsFailed() : null}*/}
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
                    { type === ContentType.LINK ? renderLinkInput() : null }
                    { type === ContentType.YOUTUBE ? renderYoutubeInput() : null }
                    <View style={[styles.switchContainer]}>
                        <Text style={[appStyles.label]}>{i18n.t('createThread.comment.label')}</Text>
                        <Switch
                            id={'commentsEnabled'}
                            value={commentsEnabled}
                            onValueChange={(value) => setCommentsEnabled(value)}
                        />
                    </View>
                    <View style={[appStyles.formGroup]}>
                        <Button id={'submit'} title={i18n.t('createThread.create')} onPress={onCreatePress}/>
                    </View>
                </View>
            </View>
        </ScrollView>
    </KeyboardUtilityView>;
};

export default CreateThreadPage;
