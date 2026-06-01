import { Linking } from 'react-native';

import Service from './Service';
import Button from '../Button';
import { type IServiceList, type IItemService } from './interfaces';
import I18n from '../../i18n';

const ServiceList = ({
	services,
	CAS_enabled,
	CAS_login_url,
	Gitlab_URL,
	server,
	collapsed,
	showLoginOnWebButton
}: IServiceList & { showLoginOnWebButton: boolean }) => (
	<>
		{showLoginOnWebButton && (
			<Button
				title={I18n.t('Login_on_web')}
				onPress={() => {
					Linking.openURL(`${server}/home?loginClient=mobile`);
				}}
			/>
		)}
		{Object.values(services).map((service: IItemService, index: number) => {
			if (index > 2 && collapsed) return null;

			return (
				<Service
					key={service._id}
					CAS_enabled={CAS_enabled}
					CAS_login_url={CAS_login_url}
					Gitlab_URL={Gitlab_URL}
					server={server}
					service={service}
				/>
			);
		})}
	</>
);

export default ServiceList;
