import React, { useCallback, useEffect } from 'react';
import { Text } from 'react-native';
import { useDispatch } from 'react-redux';
import { Image } from 'expo-image';

import { inviteLinksClear } from '../../actions/inviteLinks';
import { selectServerRequest, serverFinishAdd, serverRequest } from '../../actions/server';
import Button from '../../containers/Button';
import FormContainer, { FormContainerInner } from '../../containers/FormContainer';
import * as HeaderButton from '../../containers/Header/components/HeaderButton';
import { INewServerViewProps } from './definitions';
import I18n from '../../i18n';
import { useTheme } from '../../theme';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { DEFAULT_SERVER_URL } from '../../config/appConfig';
import styles from './styles';
import { getServerById } from '../../lib/database/services/Server';

const NewServerView = ({ navigation }: INewServerViewProps) => {
        const dispatch = useDispatch();
        const { colors } = useTheme();
        const { previousServer, connecting, failureMessage } = useAppSelector(state => ({
                previousServer: state.server.previousServer,
                connecting: state.server.connecting,
                failureMessage: state.server.failureMessage
        }));

        const connectToDefaultServer = useCallback(() => {
                dispatch(inviteLinksClear());
                dispatch(serverRequest(DEFAULT_SERVER_URL));
        }, [dispatch]);

        const close = useCallback(async () => {
                dispatch(inviteLinksClear());
                if (previousServer) {
                        const serverRecord = await getServerById(previousServer);
                        if (serverRecord) {
                                dispatch(selectServerRequest(previousServer, serverRecord.version));
                        }
                }
        }, [dispatch, previousServer]);

        useEffect(() => {
                navigation.setOptions({
                        headerShown: Boolean(previousServer),
                        headerTitle: previousServer ? I18n.t('Add_Server') : undefined,
                        headerLeft: () =>
                                previousServer && !connecting ? (
                                        <HeaderButton.CloseModal navigation={navigation} onPress={close} testID='new-server-view-close' />
                                ) : null
                });
        }, [close, connecting, navigation, previousServer]);

        useEffect(() => {
                connectToDefaultServer();

                return () => {
                        if (previousServer) {
                                dispatch(serverFinishAdd());
                        }
                };
        }, [connectToDefaultServer, dispatch, previousServer]);

        const retry = () => {
                connectToDefaultServer();
        };

        return (
                <FormContainer
                        style={previousServer ? { paddingBottom: 100 } : {}}
                        testID='new-server-view'
                        keyboardShouldPersistTaps='handled'>
                        <FormContainerInner accessibilityLabel={I18n.t('Add_server')}>
                                <Image
                                        style={{
                                                ...styles.onboardingImage,
                                                marginTop: previousServer ? 32 : 84
                                        }}
                                        source={require('../../static/images/logo_with_name.png')}
                                        contentFit='contain'
                                />
                                <Text
                                        style={{
                                                ...styles.title,
                                                color: colors.fontTitlesLabels,
                                                textAlign: 'center'
                                        }}>
                                        {I18n.t('Connecting')}
                                </Text>
                                <Text style={{ ...styles.description, color: colors.fontSecondaryInfo, textAlign: 'center' }}>
                                        {DEFAULT_SERVER_URL}
                                </Text>
                                {failureMessage ? (
                                        <Text style={{ ...styles.error, color: colors.fontDanger, textAlign: 'center' }}>
                                                {failureMessage}
                                        </Text>
                                ) : null}
                                <Button
                                        title={connecting ? I18n.t('Connecting') : I18n.t('Try_again')}
                                        type='primary'
                                        onPress={retry}
                                        disabled={connecting}
                                        loading={connecting}
                                        style={styles.connectButton}
                                        testID='new-server-view-button'
                                />
                        </FormContainerInner>
                </FormContainer>
        );
};

export default NewServerView;
