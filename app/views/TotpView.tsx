import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, ToastAndroid, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../stacks/types';

import I18n from '../i18n';
import SafeAreaView from '../containers/SafeAreaView';
import { useAppSelector } from '../lib/hooks';
import { getUserSelector } from '../selectors/login';
import { requestUserTotp } from '../lib/services/restApi';
import { useTheme } from '../theme';
import Button from '../containers/Button';

interface State {
    isLoading: boolean;
    secret: string;
    url: string;
}

function TotpView() {
    const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList, 'TotpView'>>();
    const user = useAppSelector(state => getUserSelector(state));
    const { colors } = useTheme();
    const [state, setState] = useState<State>({
        isLoading: true,
        secret: '',
        url: ''
    });

    useEffect(() => {
        navigation.setOptions({
            title: I18n.t('Two_Factor_Authentication_Setup_Verification_Title')
        });
    }, []);

    useFocusEffect(
        useCallback(() => {
            console.log('TotpView');
            fetchTotp();
        }, [])
    );

    const fetchTotp = async () => {
        setState({
            isLoading: true,
            secret: '',
            url: ''
        });

        const res = await requestUserTotp(user.id);
        setState({
            isLoading: false,
            secret: res.secret,
            url: res.url
        });
    };

    if (state.isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceRoom }]}>
                <ActivityIndicator size='large' color={colors.fontDefault} />
                <Text style={[styles.loadingText, { color: colors.fontDefault }]}>{I18n.t('Loading')}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView>
            <View style={[styles.container, { backgroundColor: colors.surfaceRoom }]}>
                <Text style={[styles.title, { color: colors.fontDefault }]}>{I18n.t('Two_Factor_Authentication')}</Text>

                <Text style={[styles.infoText, { color: colors.fontDefault }]}>
                    Scan this QR code in Authy, Google Authenticator, or any TOTP app.
                </Text>

                <View style={styles.qrWrapper}>
                    <QRCode value={state.url} size={220} color={colors.fontDefault} backgroundColor='transparent' />
                </View>

                <View style={styles.secretRow}>
                    <Text style={[styles.secretText, { color: colors.fontDefault }]}>{state.secret}</Text>
                    <Button
                        onPress={() => {
                            Clipboard.setString(state.secret);
                            ToastAndroid.show('Secret copied', ToastAndroid.SHORT);
                        }}
                        title={I18n.t('Copy')}
                        type='secondary'
                        small
                        testID='e2e-encryption-security-view-reset-key'
                        style={{ marginLeft: 5 }}
                    />
                </View>
            </View>
            <Button
                onPress={() => {
                    Linking.openURL(state.url);
                    navigation.navigate('TotpVerifyView');
                }}
                title={I18n.t('Open_Authentication_App')}
                type='primary'
                testID='e2e-encryption-security-view-reset-key'
                style={{ width: '95%', alignSelf: 'center' }}
            />
            <Button
                onPress={() => {
                    navigation.navigate('TotpVerifyView');
                }}
                title={I18n.t('Enter_Code')}
                type='primary'
                testID='totp-view-enter-code'
                style={{ width: '95%', alignSelf: 'center' }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        alignItems: 'center'
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center'
    },
    infoText: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 20
    },
    qrWrapper: {
        marginBottom: 24,
        alignItems: 'center'
    },
    secretRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        paddingHorizontal: 10
    },
    secretText: {
        flex: 1,
        fontSize: 16
    },
    copyButton: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 6,
        marginLeft: 10
    },
    copyButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff'
    },
    openAppButton: {
        paddingVertical: 10,
        borderRadius: 5,
        alignItems: 'center',
        width: '95%',
        alignSelf: 'center',
        marginBottom: 20
    },
    openAppButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff'
    }
});

export default TotpView;
