import {
	__experimentalNavigatorButton as NavigatorButton,
	__experimentalHStack as HStack,
	__experimentalItem as Item,
	FlexItem,
} from '@wordpress/components';
import { isRTL } from '@wordpress/i18n';
import { Icon, chevronLeft, chevronRight } from '@wordpress/icons';
import classnames from 'classnames';
import './style.scss';

interface Props {
	path: string;
	className?: string;
	icon?: JSX.Element;
	children: JSX.Element;
	onClick?: () => void;
}

const GenericButton = ( { icon, children, ...props }: Props ) => {
	const forwardIcon = isRTL() ? chevronLeft : chevronRight;

	if ( icon ) {
		return (
			<Item { ...props }>
				<HStack justify="space-between">
					<HStack justify="flex-start">
						<Icon icon={ icon } size={ 24 } />
						<FlexItem>{ children }</FlexItem>
					</HStack>
					<Icon icon={ forwardIcon } size={ 24 } />
				</HStack>
			</Item>
		);
	}

	return (
		<Item { ...props }>
			<HStack justify="space-between">
				<FlexItem>{ children }</FlexItem>
				<Icon icon={ forwardIcon } size={ 24 } />
			</HStack>
		</Item>
	);
};

export const NavigationButtonAsItem = ( { className, ...props }: Props ) => {
	return (
		<NavigatorButton
			as={ GenericButton }
			className={ classnames( 'navigator-button', className ) }
			{ ...props }
		/>
	);
};
