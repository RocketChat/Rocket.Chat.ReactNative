import { StyleSheet } from 'react-native';
import styled from 'styled-components/native';
import AvatarComponent from '../../containers/Avatar';
import AvatarListComponent from './AvatarList';

export const Avatar = styled(AvatarComponent)`
	margin-bottom: 15px;
	align-self: center;
`;

export const AvatarList = styled(AvatarListComponent)`
	flex-wrap: wrap;
	flex-direction: row;
	justify-content: flex-start;
`;

export default StyleSheet.create({
	disabled: {
		opacity: 0.3
	},
	avatarButtons: {
		flexWrap: 'wrap',
		flexDirection: 'row',
		justifyContent: 'flex-start'
	},
	avatarButton: {
		backgroundColor: '#e1e5e8',
		width: 50,
		height: 50,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 15,
		marginBottom: 15,
		borderRadius: 2
	}
});
