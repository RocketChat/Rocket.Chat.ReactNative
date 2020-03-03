import React, { useState } from 'react';
import { Text, StyleSheet, View, ScrollView } from 'react-native';
import { appStyles } from '../theme/style';
import { SafeAreaView }  from 'react-navigation';
import i18n from '../i18n';
import { KeyboardUtilityView } from '../components/KeyboardUtilityView';
import { Alert } from '../components/Alert';
import { appColors } from '../theme/colors';
import { Button } from '../components/Button';
import { Link } from '../components/Link';
import { useMutation } from '@apollo/react-hooks';
import { REGISTER } from '../api/mutations/authentication.mutations';
import SecurityManager from '../security/security-manager';
import { TokenPair } from '../security/models/token-pair';
import { TextInput } from '../components/TextInput';

enum ErrorTypes {
    FIELD_UNAVAILABLE = '',
}

/**
 * Defines the standard Stylesheet for the Register Page.
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
    separator: {
        width: '100%',
        height: 1,
        backgroundColor: appColors.primary,
        marginTop: 20,
        opacity: 0.5,
    },
    form: {
        width: '100%',
        marginTop: 30,
    },
    loginLabel: {
        marginTop: 20,
    },
    loginLink: {
        marginTop: 20,
    }
});

/**
 * Creates the Page.
 */
const RegisterPage = ({ navigation }) => {
    const [performRegistration, {data, loading, error }] = useMutation<{ register: TokenPair }>(REGISTER);
    const [submitted, setSubmitted] = useState(false);

    const [firstName, setFirstName] = useState(null);
    const [lastName, setLastName] = useState(null);
    const [username, setUsername] = useState(null);
    const [password, setPassword] = useState(null);
    const [email, setEmail] = useState(null);

    const onRegisterPress = async () => {
        setSubmitted(true);

        const result = await performRegistration({
            variables: {
                user: {
                    username,
                    password,
                    firstName,
                    lastName,
                    email,
                }
            }
        });

        await SecurityManager.storeTokens(result.data!.register);
        SecurityManager.setLoggedIn(true);
    };

    const renderRegisterFailed = () => {
        if (error!.graphQLErrors.length > 0) {
            return <Alert title={error!.graphQLErrors.map(error => error.message).join(', ')!} />
        } else {
            return <Alert title={i18n.t('register.error')} />
        }
    };

    /**
     * Creates the Form to Register.
     * 
     * @returns {KeyboardUtilityView}
     */
    return <KeyboardUtilityView>
        <View style={styles.container}>
            <View>
                <Text style={[appStyles.title]}>{i18n.t('register.title')}</Text>
            </View>

            <View>
                <Text style={[styles.description, appStyles.text]}>{i18n.t('register.description')}</Text>
            </View>

            <View style={[styles.form]}>
                {error ? renderRegisterFailed() : null}
                <View style={[appStyles.formGroup]}>
                    <Text style={[appStyles.label]}>{i18n.t('register.firstName.label')}</Text>
                    <TextInput id={'firstName'}
                               value={firstName}
                               required={true}
                               submitted={submitted}
                               onChangeText={value => setFirstName(value)}
                               placeholder={i18n.t('register.firstName.placeholder')}
                               placeholderTextColor={appColors.placeholder} />
                </View>
                <View style={[appStyles.formGroup]}>
                    <Text style={[appStyles.label]}>{i18n.t('register.lastName.label')}</Text>
                    <TextInput id={'lastName'}
                               value={lastName}
                               required={true}
                               submitted={submitted}
                               onChangeText={value => setLastName(value)}
                               placeholder={i18n.t('register.lastName.placeholder')}
                               placeholderTextColor={appColors.placeholder} />
                </View>
                <View style={[appStyles.formGroup]}>
                    <Text style={[appStyles.label]}>{i18n.t('register.email.label')}</Text>
                    <TextInput id={'email'}
                               autoCompleteType='email'
                               textContentType='email'
                               keyboardType='email-address'
                               autoCapitalize='none'
                               value={email}
                               required={true}
                               submitted={submitted}
                               onChangeText={value => setEmail(value)}
                               placeholder={i18n.t('register.email.placeholder')}
                               placeholderTextColor={appColors.placeholder} />
                </View>
                <View style={styles.separator} />
                <View style={[appStyles.formGroup]}>
                    <Text style={[appStyles.label]}>{i18n.t('register.username.label')}</Text>
                    <TextInput id={'username'}
                               autoCompleteType='username'
                               textContentType='username'
                               autoCapitalize='none'
                               value={username}
                               required={true}
                               submitted={submitted}
                               onChangeText={value => setUsername(value)}
                               placeholder={i18n.t('register.username.placeholder')}
                               placeholderTextColor={appColors.placeholder} />
                </View>
                <View style={[appStyles.formGroup]}>
                    <Text style={[appStyles.label]}>{i18n.t('register.password.label')}</Text>
                    <TextInput id={'password'}
                               secureTextEntry={true}
                               value={password}
                               onChangeText={value => setPassword(value)}
                               autoCompleteType='password'
                               textContentType='password'
                               required={true}
                               submitted={submitted}
                               placeholder={i18n.t('register.password.placeholder')}
                               placeholderTextColor={appColors.placeholder} />
                </View>
                <View style={[appStyles.formGroup]}>
                    <Button id={'submit'} loading={loading} title={i18n.t('register.submit.label')} onPress={onRegisterPress} />
                </View>
            </View>
            <View style={[styles.loginLabel]}>
                <Text style={[appStyles.text]}>{i18n.t('register.login.separator')}</Text>
            </View>
            <View style={[styles.loginLink]}>
                <Link id={'login'} title={i18n.t('register.login.link')} onPress={() => navigation.pop()} />
            </View>
        </View>
    </KeyboardUtilityView>
};

export default RegisterPage;
