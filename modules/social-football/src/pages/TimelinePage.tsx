import React from 'react';
import { Text, Button, View } from 'react-native';
import { appStyles } from '../theme/style';
import SecurityManager from '../security/security-manager';
import { useQuery } from '@apollo/react-hooks';
import { GET_ME } from '../api/queries/authentication.queries';
import {HeaderLogo} from "../components/header/HeaderLogo";
import {HeaderCreateThreadButton} from "../components/header/HeaderCreateThreadButton";

const TimelinePage = ( {navigation} ) => {
    const { loading, error, data } = useQuery(GET_ME);

    const logout = () => {
        SecurityManager.logout();
    };

    return <View>
        <Text style={[appStyles.text]}>Dit is een timeline pagina. Welkom {data?.me}</Text>
        <Button title='Loguit (tijdelijk)'  onPress={() => logout()} />
    </View>
};

TimelinePage.navigationOptions = ({ navigation }) => {
    return {
        headerTitle: <HeaderLogo />,
        headerRight:  <HeaderCreateThreadButton navigation={navigation} />
    };
};


export default TimelinePage;
