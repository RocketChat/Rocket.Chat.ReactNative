import React from 'react';
import { Text, Button } from 'react-native';
import { appStyles } from '../theme/style';
import { SafeAreaView }  from 'react-navigation';
import SecurityManager from '../security/security-manager';

const TimelinePage = ({ navigation }) => {
    const logout = () => {
        SecurityManager.logout();
    }
    
    return <SafeAreaView>
        <Text style={[appStyles.text]}>Dit is een timeline pagina.</Text>
        <Button title='Loguit (tijdelijk)'  onPress={() => logout()} />
    </SafeAreaView>
};

export default TimelinePage;