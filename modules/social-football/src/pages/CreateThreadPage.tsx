import React, {useState} from 'react';
import i18n from '../i18n';
import { KeyboardUtilityView } from '../components/KeyboardUtilityView';
import { Text, StyleSheet, View, Switch, Picker } from 'react-native';
import { appStyles } from '../theme/style';
import { TextInput } from '../components/TextInput';
import { appColors } from '../theme/colors';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button'
import symbolicateStackTrace from 'react-native/Libraries/Core/Devtools/symbolicateStackTrace';


const styles = StyleSheet.create({
        container: {
            flex: 1,
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: '100%',
            maxWidth: 350,
        },
        form: {
            width: '100%',
            marginTop: 30,
        },
        swithContainer: {
            height: 54,
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDirection: 'row'
        },
    }
)

const CreateThreadPage = () => {
    const [createThreadFailed, setCreateThreadFailed] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // const [suggestion, setSuggestion] = useState(true) //set toggle button suggestion to true
    const [response, setResponse] = useState(true) //set toggle button response to true
    const [type, setType] = useState('Tekst')

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

    return <KeyboardUtilityView>
        <View style={styles.container}>
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
                    submitted={submitted}
                    style={[appStyles.description]}
                    placeholder={i18n.t('createThread.description.placeholder')}
                    placeholderTextColor={appColors.placeholder} 
                    />
                </View>
                <View style={[appStyles.formGroup]}>
                    <Text style={[appStyles.label]}>{i18n.t('createThread.contentType.label')}</Text>
                    <Picker 
                    selectedValue = {type}
                    onValueChange={() => setType(value)}>
                        <Picker.Item label={i18n.t('createThread.text.label')} value="Text"></Picker.Item>
                        <Picker.Item label={i18n.t('createThread.link.label')} value="Link"></Picker.Item>
                        <Picker.Item label={i18n.t('createThread.photo.label')} value="Photo"></Picker.Item>
                        <Picker.Item label={i18n.t('createThread.video.label')} value="Video"></Picker.Item>
                        <Picker.Item label={i18n.t('createThread.exercise.label')} value="Exercise"></Picker.Item>
                        <Picker.Item label={i18n.t('createThread.program.label')} value="Practice_Program"></Picker.Item>
                    </Picker>
                </View>
                <View style={[styles.swithContainer]}>
                    <Text style={[appStyles.label]}>{i18n.t('createThread.comment.label')}</Text>
                    <Switch  
                    value = {response}
                    onValueChange = {() => setResponse(!response) }
                    />
                </View>
                {/* <View style={[styles.swithContainer]}>
                    <Text style={[appStyles.label]}>{i18n.t('createThread.categoricalResponse.label')}</Text>
                    <Switch
                    value = {suggestion}
                    onValueChange = {() => setSuggestion(!suggestion) }
                    />
                </View> */}
                <View style={[appStyles.formGroup]}>
                    <Button title={i18n.t('createThread.create')} onPress={onCreatePress} />
                </View>
            </View>
        </View>
    </KeyboardUtilityView>
};

export default CreateThreadPage;