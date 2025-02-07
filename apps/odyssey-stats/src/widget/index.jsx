import '../load-config';
import config from '@automattic/calypso-config';
import '@automattic/calypso-polyfills';
import { render } from 'react-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import setLocale from '../lib/set-locale';
import MiniChart from './mini-chart';

import 'calypso/assets/stylesheets/style.scss';
import './index.scss';

/**
 * Loads and runs the main chunk for Stats Widget.
 */
export function init() {
	const currentSiteId = config( 'blog_id' );
	const localeSlug = config( 'i18n_locale_slug' ) || config( 'i18n_default_locale_slug' ) || 'en';
	const queryClient = new QueryClient();

	// Ensure locale files are loaded before rendering.
	setLocale( localeSlug ).then( () =>
		render(
			<QueryClientProvider client={ queryClient }>
				<div id="stats-widget-content" className="stats-widget-content">
					<MiniChart
						siteId={ currentSiteId }
						gmtOffset={ config( 'gmt_offset' ) }
						odysseyStatsBaseUrl={ config( 'odyssey_stats_base_url' ) }
					/>
				</div>
			</QueryClientProvider>,
			document.getElementById( 'dashboard_stats' )
		)
	);
}
