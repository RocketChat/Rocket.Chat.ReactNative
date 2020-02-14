import React, { useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { appStyles } from '../theme/style';
import { SafeAreaView }  from 'react-navigation';
import i18n from '../i18n';
import { KeyboardUtilityView } from '../components/KeyboardUtilityView';
import { Alert } from '../components/Alert';
import { TextInput } from 'react-native-gesture-handler';
import { appColors } from '../theme/colors';
import { Button } from '../components/Button';
import { Link } from '../components/Link';
import { useMutation } from '@apollo/react-hooks';
import { REGISTER } from '../api/mutations/authentication.mutations';
import SecurityManager from '../security/security-manager';
import { TokenPair } from '../security/models/token-pair';

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

const RegisterPage = ({ navigation }) => {    
    const [performRegistration, {data, loading}] = useMutation<{ register: TokenPair }>(REGISTER);
    const [registerFailed, setRegisterFailed] = useState(false);

    const [firstName, setFirstName] = useState(null);
    const [lastName, setLastName] = useState(null);
    const [username, setUsername] = useState(null);
    const [password, setPassword] = useState(null);
    const [email, setEmail] = useState(null);

    const onRegisterPress = async () => {
        setRegisterFailed(false);

        try {
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
            
            SecurityManager.storeTokens(result.data!.register);
            SecurityManager.setLoggedIn(true);
        } catch (error) {
            console.info(JSON.stringify(error));

            setRegisterFailed(true);
        }
    };

    const renderRegisterFailed = () => (
        <Alert title={i18n.t('register.error')} />
    );

    return <KeyboardUtilityView>
        <View style={styles.container}>
            <View>
                <Text style={[appStyles.title]}>{i18n.t('register.title')}</Text>
            </View>

            <View>
                <Text style={[styles.description, appStyles.text]}>{i18n.t('register.description')}</Text>
            </View>

            <View style={[styles.form]}>
                {registerFailed ? renderRegisterFailed() : null}
                <View style={[appStyles.formGroup]}>
                    <Text style={[appStyles.label]}>{i18n.t('register.firstName.label')}</Text>
                    <TextInput style={[appStyles.input]}
                               value={firstName}
                               onChangeText={value => setFirstName(value)}
                               placeholder={i18n.t('register.firstName.placeholder')}
                               placeholderTextColor={appColors.placeholder} />
                </View>
                <View style={[appStyles.formGroup]}>
                    <Text style={[appStyles.label]}>{i18n.t('register.lastName.label')}</Text>
                    <TextInput style={[appStyles.input]}
                               value={lastName}
                               onChangeText={value => setLastName(value)}
                               placeholder={i18n.t('register.lastName.placeholder')}
                               placeholderTextColor={appColors.placeholder} />
                </View>
                <View style={[appStyles.formGroup]}>
                    <Text style={[appStyles.label]}>{i18n.t('register.email.label')}</Text>
                    <TextInput style={[appStyles.input]}
                               autoCompleteType='email'
                               textContentType='email'
                               keyboardType='email-address'
                               autoCapitalize='none'
                               value={email}
                               onChangeText={value => setEmail(value)}
                               placeholder={i18n.t('register.email.placeholder')}
                               placeholderTextColor={appColors.placeholder} />
                </View>
                <View style={styles.separator} />
                <View style={[appStyles.formGroup]}>
                    <Text style={[appStyles.label]}>{i18n.t('register.username.label')}</Text>
                    <TextInput style={[appStyles.input]}
                               autoCompleteType='username'
                               textContentType='username'
                               autoCapitalize='none'
                               value={username}
                               onChangeText={value => setUsername(value)}
                               placeholder={i18n.t('register.username.placeholder')}
                               placeholderTextColor={appColors.placeholder} />
                </View>
                <View style={[appStyles.formGroup]}>
                    <Text style={[appStyles.label]}>{i18n.t('register.password.label')}</Text>
                    <TextInput secureTextEntry={true}
                               value={password}
                               onChangeText={value => setPassword(value)}
                               autoCompleteType='password'
                               textContentType='password'
                               style={[appStyles.input, styles.password]}
                               placeholder={i18n.t('register.password.placeholder')}
                               placeholderTextColor={appColors.placeholder} />
                </View>
                <View style={[appStyles.formGroup]}>
                    <Button loading={loading} title={i18n.t('register.submit.label')} onPress={onRegisterPress} />
                </View>
            </View>
            <View style={[styles.loginLabel]}>
                <Text style={[appStyles.text]}>{i18n.t('register.login.separator')}</Text>
            </View>
            <View style={[styles.loginLink]}>
                <Link title={i18n.t('register.login.link')} onPress={() => navigation.pop()} />
            </View>
        </View>
    </KeyboardUtilityView>
};

export default RegisterPage;