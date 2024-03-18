import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Col, Grid, Row } from 'react-native-easy-grid';
import range from 'lodash/range';
import { View } from 'react-native';
import * as Animatable from 'react-native-animatable';
import * as Haptics from 'expo-haptics';

import styles from './styles';
import Button from './Button';
import Dots from './Dots';
import { TYPE } from '../constants';
import { PASSCODE_LENGTH } from '../../../lib/constants';
import { useTheme } from '../../../theme';
import LockIcon from './LockIcon';
import Title from './Title';
import Subtitle from './Subtitle';
import { useDimensions } from '../../../dimensions';

interface IPasscodeBase {
	type: string;
	previousPasscode?: string;
	title: string;
	subtitle?: string | null;
	showBiometry?: boolean;
	onEndProcess: Function;
	onError?: Function;
	onBiometryPress?(): void;
}

export interface IBase {
	clearPasscode: () => void;
	wrongPasscode: () => void;
	animate: (animation: Animatable.Animation, duration?: number) => void;
}

const Base = forwardRef<IBase, IPasscodeBase>(
	({ type, onEndProcess, previousPasscode, title, subtitle, onError, showBiometry, onBiometryPress }, ref) => {
		const { colors } = useTheme();
		const { height } = useDimensions();

		// 206 is the height of the header calculating the margins, icon size height, title font size and subtitle height.
		// 56 is a fixed number to decrease the height of button numbers.
		const dinamicHeight = (height - 206 - 56) / 4;
		const heightButtonRow = { height: dinamicHeight > 102 ? 102 : dinamicHeight };

		const rootRef = useRef<Animatable.View & View>(null);
		const dotsRef = useRef<Animatable.View & View>(null);
		const [passcode, setPasscode] = useState('');

		const clearPasscode = () => setPasscode('');

		const wrongPasscode = () => {
			clearPasscode();
			dotsRef?.current?.shake?.(500);
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
		};

		const animate = (animation: Animatable.Animation, duration = 500) => {
			rootRef?.current?.[animation]?.(duration);
		};

		const onPressNumber = (text: string) =>
			setPasscode(p => {
				const currentPasscode = p + text;
				if (currentPasscode?.length === PASSCODE_LENGTH) {
					switch (type) {
						case TYPE.CHOOSE:
							onEndProcess(currentPasscode);
							break;
						case TYPE.CONFIRM:
							if (currentPasscode !== previousPasscode) {
								onError?.();
							} else {
								onEndProcess(currentPasscode);
							}
							break;
						case TYPE.ENTER:
							onEndProcess(currentPasscode);
							break;
						default:
							break;
					}
				}
				return currentPasscode;
			});

		const onPressDelete = () =>
			setPasscode(p => {
				if (p?.length > 0) {
					const newPasscode = p.slice(0, -1);
					return newPasscode;
				}
				return '';
			});

		useImperativeHandle(ref, () => ({
			wrongPasscode,
			animate,
			clearPasscode
		}));

		return (
			<Animatable.View ref={rootRef} style={styles.container}>
				<Grid style={[styles.grid, { backgroundColor: colors.surfaceNeutral }]}>
					<LockIcon />
					<Title text={title} />
					{subtitle ? <Subtitle text={subtitle} /> : null}
					<Row style={styles.row}>
						<Animatable.View ref={dotsRef}>
							<Dots passcode={passcode} length={PASSCODE_LENGTH} />
						</Animatable.View>
					</Row>
					<Row style={[styles.row, heightButtonRow]}>
						{range(1, 4).map(i => (
							<Col key={i} style={[styles.colButton, heightButtonRow]}>
								<Button style={heightButtonRow} text={i.toString()} onPress={onPressNumber} />
							</Col>
						))}
					</Row>
					<Row style={[styles.row, heightButtonRow]}>
						{range(4, 7).map(i => (
							<Col key={i} style={[styles.colButton, heightButtonRow]}>
								<Button style={heightButtonRow} text={i.toString()} onPress={onPressNumber} />
							</Col>
						))}
					</Row>
					<Row style={[styles.row, heightButtonRow]}>
						{range(7, 10).map(i => (
							<Col key={i} style={[styles.colButton, heightButtonRow]}>
								<Button style={heightButtonRow} text={i.toString()} onPress={onPressNumber} />
							</Col>
						))}
					</Row>
					<Row style={[styles.row, heightButtonRow]}>
						{showBiometry ? (
							<Col style={[styles.colButton, heightButtonRow]}>
								<Button style={heightButtonRow} icon='fingerprint' onPress={onBiometryPress} />
							</Col>
						) : (
							<Col style={[styles.colButton, heightButtonRow]} />
						)}
						<Col style={[styles.colButton, heightButtonRow]}>
							<Button style={heightButtonRow} text='0' onPress={onPressNumber} />
						</Col>
						<Col style={[styles.colButton, heightButtonRow]}>
							<Button style={heightButtonRow} icon='backspace' onPress={onPressDelete} />
						</Col>
					</Row>
				</Grid>
			</Animatable.View>
		);
	}
);

export default Base;
