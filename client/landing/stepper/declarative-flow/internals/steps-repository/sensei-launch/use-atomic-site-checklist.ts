import { useCallback } from '@wordpress/element';
import { useDispatch as useRootDispatch, useSelector } from 'react-redux';
import { useSite } from 'calypso/landing/stepper/hooks/use-site';
import { requestSiteChecklist } from 'calypso/state/checklist/actions';
import getSiteChecklist from 'calypso/state/selectors/get-site-checklist';

/**
 * Gets the WPcom home checklist and checks if Sensei is one if its tasks.
 */
export function useAtomicSiteChecklist() {
	const dispatch = useRootDispatch();
	const siteId = useSite()?.ID || '';
	const { siteChecklist } = useSelector( ( state ) => ( {
		siteChecklist: getSiteChecklist( state, Number( siteId ) ),
	} ) );

	const requestChecklist = useCallback(
		() => dispatch( requestSiteChecklist( siteId.toString() ) ),
		[ dispatch, siteId ]
	);

	const isSenseiIncluded = useCallback(
		() => siteChecklist?.tasks?.some( ( task ) => 'sensei_setup' === task.id ) || false,
		[ siteChecklist ]
	);

	return { requestChecklist, isSenseiIncluded };
}
