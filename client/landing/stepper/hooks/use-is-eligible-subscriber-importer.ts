import { useSelector } from 'react-redux';
import isEligibleForSubscriberImporter from 'calypso/state/selectors/is-eligible-for-subscriber-importer';

export function useIsEligibleSubscriberImporter() {
	return useSelector( ( state ) => isEligibleForSubscriberImporter( state ) );
}
