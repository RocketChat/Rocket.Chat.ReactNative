import React from 'react';
import { Text, Button } from 'react-native';
import { appStyles } from '../theme/style';
import { SafeAreaView }  from 'react-navigation';

const TimelinePage = ({ navigation }) => (
    <SafeAreaView>
        <Text style={[appStyles.text]}>Dit is een timeline pagina.</Text>
        <Button title='Ga terug'  onPress={() => navigation.navigate('LoginPage')} />
    </SafeAreaView>
);

export default TimelinePage;