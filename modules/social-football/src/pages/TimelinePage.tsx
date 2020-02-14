import React from 'react';
import { Text, Button } from 'react-native';
import { appStyles } from '../theme/style';
import { SafeAreaView }  from 'react-navigation';
import SecurityManager from '../security/security-manager';
import { useQuery } from '@apollo/react-hooks';
import { GET_ME } from '../api/queries/authentication.queries';

const TimelinePage = ({ navigation }) => {
    const { loading, error, data } = useQuery(GET_ME);

    const logout = () => {
        SecurityManager.logout();
    }
    
    return <SafeAreaView>
        <Text style={[appStyles.text]}>Dit is een timeline pagina. Welkom {data?.me}</Text>
        <Button title='Loguit (tijdelijk)'  onPress={() => logout()} />
    </SafeAreaView>
};

export default TimelinePage;