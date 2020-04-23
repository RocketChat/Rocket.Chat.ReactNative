import React from 'react';
import { View } from 'react-native';
import { Col, Row, Grid } from 'react-native-easy-grid';
import _ from 'lodash';

import styles from './styles';
import ButtonNumber from './ButtonNumber';
import PasscodeDots from './PasscodeDots';
import Title from './Title';
import Subtitle from './Subtitle';

const Passcode = ({ theme }) => {
	return (
		<View
			style={[
				styles.container,
				// this.props.styleContainer
			]}
		>
			<View
				style={[
					styles.container,
					// this.props.styleContainer
				]}
			>
				<View
					style={[
						styles.viewTitle,
						// { opacity: opacity }
					]}
				>
					<Title theme={theme} />
					<Subtitle theme={theme} />
				</View>
				<View style={styles.flexCirclePassword}>
					<PasscodeDots password='123' theme={theme} />
				</View>
				<Grid style={styles.grid}>
					<Row
						style={[
							styles.row
						]}
					>
						{_.range(1, 4).map(i => (
							<Col
								key={i}
								style={[
									styles.colButtonCircle
								]}
							>
								<ButtonNumber text={i} />
							</Col>
						))}
					</Row>
					<Row
						style={[
							styles.row
						]}
					>
						{_.range(4, 7).map(i => (
							<Col
								key={i}
								style={[
									styles.colButtonCircle
								]}
							>
								<ButtonNumber text={i} />
							</Col>
						))}
					</Row>
					<Row
						style={[
							styles.row
						]}
					>
						{_.range(7, 10).map(i => (
							<Col
								key={i}
								style={[
									styles.colButtonCircle
								]}
							>
								<ButtonNumber text={i} />
							</Col>
						))}
					</Row>
					<Row
						style={[
							styles.row
						]}
					>
						<Col
							style={[
								styles.colButtonCircle
							]}
						/>
						<Col
							style={[
								styles.colButtonCircle
							]}
						>
							<ButtonNumber text='0' />
						</Col>
						<Col
							style={[
								styles.colButtonCircle
							]}
						>
							<ButtonNumber text='X' />
						</Col>
					</Row>
				</Grid>
			</View>
		</View>
	);
};

export default Passcode;
