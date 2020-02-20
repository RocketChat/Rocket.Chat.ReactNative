import React, {useState} from 'react';
import i18n from '../i18n';
import { KeyboardUtilityView } from '../components/KeyboardUtilityView';
import { Text, StyleSheet, View, Picker, ScrollView } from 'react-native';
import { appStyles } from '../theme/style';
import { TextInput } from '../components/TextInput';
import { appColors } from '../theme/colors';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button'
import { Switch } from '../components/Switch'
import { ContentType } from '../enums/content-type';
import { ContentTypeButton } from '../components/ContentTypeButton';

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
)

const CreateThreadPage = () => {
    const [createThreadFailed, setCreateThreadFailed] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // const [suggestion, setSuggestion] = useState(true) //set toggle button suggestion to true
    const [response, setResponse] = useState(true) //set toggle button response to true
    const [type, setType] = useState(ContentType.TEXT)

    const onCreatePress = async () => {
        setCreateThreadFailed(false);
        setSubmitted(true);

        try {

        } catch(error) {
            setCreateThreadFailed(true);
        }
    };

    const createThreadIsFailed = () => {
        return <Alert title={i18n.t('createThread.error.label')} />
    }

    return <KeyboardUtilityView centerVertically={false}>
            <ScrollView style={styles.container}>
                <View>
                    <View style={[styles.form]}>
                        {createThreadFailed ? createThreadIsFailed() : null}
                        <View>
                            <Text style={[appStyles.label]}>{i18n.t('createThread.threadtitle.label')}</Text>
                            <TextInput 
                            required={true}
                            submitted={submitted}
                            placeholder={i18n.t('createThread.threadtitle.placeholder')}
                            placeholderTextColor={appColors.placeholder} />
                        </View>
                        <View style={[appStyles.formGroup]}>
                            <Text style={[appStyles.label]}>{i18n.t('createThread.description.label')}</Text>
                            <TextInput 
                                required={true}
                                multiline={true}
                                submitted={submitted}
                                numberOfLines={4}
                                placeholder={i18n.t('createThread.description.placeholder')}
                                placeholderTextColor={appColors.placeholder} 
                            />
                        </View>
                        <View style={[appStyles.formGroup]}>
                            <Text style={[appStyles.label]}>{i18n.t('createThread.contentType.label')}</Text>
                            <View style={[styles.contentTypesContainer]}>
                                {
                                    Object.values(ContentType).map((contentType, index) => (
                                        <ContentTypeButton
                                            active={type === contentType}
                                            onPress={() => setType(contentType)}
                                            type={contentType} />
                                    ))
                                }
                            </View>
                        </View>
                        <View style={[styles.switchContainer]}>
                            <Text style={[appStyles.label]}>{i18n.t('createThread.comment.label')}</Text>
                            <Switch  
                                value = {response}
                                onValueChange = {() => setResponse(!response) }
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardUtilityView>;
};

export default CreateThreadPage;