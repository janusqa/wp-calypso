import { Button } from '@automattic/components';
import { Icon, chevronDown, chevronRight } from '@wordpress/icons';
import moment from 'moment';
import { Fragment, useState } from 'react';
import { useLocalizedMoment } from 'calypso/components/localized-moment';
import { SiteLogsData } from 'calypso/data/hosting/use-site-logs-query';
import SiteLogsExpandedContent from './site-logs-expanded-content';
import './style.scss';

interface Props {
	columns: string[];
	log: SiteLogsData[ 'logs' ][ 0 ];
	siteGmtOffset: number;
}

export default function SiteLogsTableRow( { columns, log, siteGmtOffset }: Props ) {
	const [ isExpanded, setIsExpanded ] = useState( false );
	return (
		<Fragment>
			<tr>
				<td>
					<Button borderless onClick={ () => setIsExpanded( ! isExpanded ) } compact>
						<Icon icon={ isExpanded ? chevronDown : chevronRight } />
					</Button>
				</td>
				{ columns.map( ( column ) => (
					<td key={ column }>{ renderCell( column, log[ column ], moment, siteGmtOffset ) }</td>
				) ) }
			</tr>

			{ isExpanded && (
				<tr className="site-logs-table__table-row-expanded">
					<td colSpan={ Object.keys( log ).length + 1 }>
						<SiteLogsExpandedContent log={ log } />
					</td>
				</tr>
			) }
		</Fragment>
	);
}

function renderCell(
	column: string,
	value: unknown,
	moment: ReturnType< typeof useLocalizedMoment >,
	siteGmtOffset: number
) {
	if ( value === null || value === undefined || value === '' ) {
		return <span className="site-logs-table__empty-cell" />;
	}

	if ( ( column === 'date' || column === 'timestamp' ) && typeof value === 'string' ) {
		return moment( value )
			.utcOffset( siteGmtOffset * 60 )
			.format( 'll @ HH:mm:ss.SSS Z' );
	}

	switch ( typeof value ) {
		case 'boolean':
			return value.toString();

		case 'number':
		case 'string':
			return value;

		default:
			JSON.stringify( value );
	}
}
