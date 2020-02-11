import React from 'react';
import { Image, View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from "react-navigation";
import { appStyles } from '../theme/style'
import { KeyboardUtilityView } from '../components/KeyboardUtilityView';
import { appColors } from '../theme/colors';
import i18n from '../i18n'
import { Button } from '../components/Button';
import { Link } from '../components/Link';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '90%',
        maxWidth: 310,
    },
    description: {
        marginTop: 10,
        textAlign: 'center',
    },
    form: {
        width: '100%',
        marginTop: 30,
    },
    registerLabel: {
        marginTop: 20,
    },
    registerLink: {
        marginTop: 20,
    }
});

const LoginPage = ({ navigation }) => {
    const moveToTimeline = () => {
        navigation.navigate('TimelinePage');
    };

    return <KeyboardUtilityView>
        <View style={styles.container}>
            <Image source={require('../assets/images/app-logo.png')} />
            <View>
                <Text style={[appStyles.title]}>{i18n.t('appName')}</Text>
            </View>
            <View>
                <Text style={[styles.description, appStyles.text]}>{i18n.t('login.description')}</Text>
            </View>
            <View style={[styles.form]}>
                <View style={[appStyles.formGroup]}>
                    <Text style={[appStyles.label]}>{i18n.t('login.username.label')}</Text>
                    <TextInput style={[appStyles.input]}
                               placeholder={i18n.t('login.username.placeholder')}
                               placeholderTextColor={appColors.placeholder} />
                </View>
                <View style={[appStyles.formGroup]}>
                    <Text style={[appStyles.label]}>{i18n.t('login.password.label')}</Text>
                    <TextInput secureTextEntry={true}
                               autoCompleteType='password'
                               style={[appStyles.input, styles.password]}
                               placeholder={i18n.t('login.password.placeholder')}
                               placeholderTextColor={appColors.placeholder} />
                </View>
                <View style={[appStyles.formGroup]}>
                    <Button title={i18n.t('login.submit.label')} onPress={moveToTimeline} />
                </View>
            </View>
            <View style={[styles.registerLabel]}>
                <Text style={[appStyles.text]}>{i18n.t('login.register.separator')}</Text>
            </View>
            <View style={[styles.registerLink]}>
                <Link title={i18n.t('login.register.link')} onPress={() => alert('nee')} />
            </View>
        </View>
    </KeyboardUtilityView>
};

export default LoginPage;
