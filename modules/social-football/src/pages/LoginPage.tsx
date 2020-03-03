import React, { useState } from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from "react-navigation";
import { appStyles } from '../theme/style'
import { KeyboardUtilityView } from '../components/KeyboardUtilityView';
import { appColors } from '../theme/colors';
import i18n from '../i18n'
import { Button } from '../components/Button';
import { Link } from '../components/Link';
import { useMutation } from '@apollo/react-hooks';
import { TokenPair } from '../security/models/token-pair';
import { LOGIN } from '../api/mutations/authentication.mutations';
import SecurityManager from '../security/security-manager';
import { Alert } from '../components/Alert';
import { TextInput } from '../components/TextInput';

/**
 * Defines the standard Stylesheet for the Login Page.
 */
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

/**
 * Creates the Page.
 */
const LoginPage = ({ navigation }) => {
    const [username, setUsername] = useState(null);
    const [password, setPassword] = useState(null);

    const [performLogin, {data, loading, error}] = useMutation<{ loginApp: TokenPair }>(LOGIN);
    const [submitted, setSubmitted] = useState(false);

    const onLoginPress = async () => {
        setSubmitted(true);

        const result = await performLogin({
            variables: {
                credentials: {
                    username,
                    password,
                }
            }
        });

        await SecurityManager.storeTokens(result.data!.loginApp);
        SecurityManager.setLoggedIn(true);

    };

    const renderLoginFailed = () => (
        <Alert title={i18n.t('login.wrongCredentials')} />
    );

    /**
     * Creates the form to Login.
     */
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
                {error ? renderLoginFailed() : null}
                <View style={[appStyles.formGroup]}>
                    <Text style={[appStyles.label]}>{i18n.t('login.username.label')}</Text>
                    <TextInput id={'username'}
                               autoCompleteType='username'
                               textContentType='username'
                               autoCapitalize='none'
                               value={username}
                               required={true}
                               submitted={submitted}
                               onChangeText={value => setUsername(value)}
                               placeholder={i18n.t('login.username.placeholder')}
                               placeholderTextColor={appColors.placeholder} />
                </View>
                <View style={[appStyles.formGroup]}>
                    <Text style={[appStyles.label]}>{i18n.t('login.password.label')}</Text>
                    <TextInput id={'password'}
                               secureTextEntry={true}
                               value={password}
                               onChangeText={value => setPassword(value)}
                               autoCompleteType='password'
                               textContentType='password'
                               required={true}
                               submitted={submitted}
                               placeholder={i18n.t('login.password.placeholder')}
                               placeholderTextColor={appColors.placeholder} />
                </View>
                <View style={[appStyles.formGroup]}>
                    <Button id={'submit'} loading={loading} title={i18n.t('login.submit.label')} onPress={onLoginPress} />
                </View>
            </View>
            <View style={[styles.registerLabel]}>
                <Text style={[appStyles.text]}>{i18n.t('login.register.separator')}</Text>
            </View>
            <View style={[styles.registerLink]}>
                <Link id={'register'} title={i18n.t('login.register.link')} onPress={() => navigation.push('RegisterPage')} />
            </View>
        </View>
    </KeyboardUtilityView>
};

export default LoginPage;
