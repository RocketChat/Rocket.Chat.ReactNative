import React from 'react';
import { Text, ToastAndroid, View } from 'react-native';

import styles from '../styles';
import moment from 'moment';
import { useTheme } from '../../../theme';

interface ITimestampProps {
	value: { timestamp: string; format: "t" | "T" | "d" | "D" | "f" | "F" | "R"; }
}

const Timestamp = ({ value }: ITimestampProps): React.ReactElement => {
    const { colors } = useTheme();
    
    const formatDate = React.useMemo(()=>{
        const timestamp = parseInt(value.timestamp) * 1000;

        if(value.format === "t"){
            return moment(timestamp).format('hh:mm A');
        }

        if(value.format === "T"){
            return moment(timestamp).format('hh:mm:ss A');
        }

        if(value.format === "d"){
            return moment(timestamp).format('MM/DD/YYYY');
        }

        if(value.format === "D"){
            return moment(timestamp).format('dddd, MMM DD, YYYY');
        }

        if(value.format === "f"){
            return moment(timestamp).format('dddd, MMM DD, YYYY hh:mm A');
        }

        if(value.format === "F"){
            return moment(timestamp).format('dddd, MMM DD, YYYY hh:mm:ss A');
        }

        if(value.format === "R"){
            return moment(timestamp).fromNow();
        }

        return "Invalid Date";
    }, [value]);

    return (
            <Text style={{ backgroundColor: colors.surfaceSelected, color: colors.fontDefault, lineHeight: styles.text.fontSize + 7}} onPress={()=>{
                ToastAndroid.show(formatDate, ToastAndroid.SHORT);
            }}>
                {` ${formatDate} `}
            </Text>
    )
}

export default Timestamp;
