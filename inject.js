/* global findAndReplaceDOMText */

var HIGHLIGHT_CLASS = '__highlight__';
var HIGHLIGHT_CURRENT_CLASS = '__highlight_current__';
var lastHighlighted;

function hightlight( text ) {
	const $container = document.querySelector( '.blob-wrapper' );
	const $wrap = document.createElement( 'span' );
	$wrap.classList.add( HIGHLIGHT_CLASS );
	return findAndReplaceDOMText( $container, {
		find: text,
		wrap: $wrap,
	} );
}

function cancelHighLight() {
	if ( lastHighlighted && lastHighlighted.revert ) {
		lastHighlighted.revert();
	}
}

function injectCss( cssContent ) {
	var stylesheet = document.createElement( 'style' );
	stylesheet.type = 'text/css';
	stylesheet.textContent = cssContent;
	document.head.appendChild( stylesheet );
}

function centerOffset( elm ) {
	var rect = elm.getBoundingClientRect();

	return {
		top: rect.top + document.body.scrollTop + ( elm.offsetHeight / 2 ),
		left: rect.left + document.body.scrollLeft + ( elm.offsetWidth / 2 ),
	};
}

function findNearestHighlightNode( top, left ) {
	var elms,
		distances,
		minDistance;

	elms = [].slice.call( document.querySelectorAll( '.' + HIGHLIGHT_CLASS ) );
	distances = [];

	elms.forEach( function ( v ) {
		var o = centerOffset( v ) || {};
		var t = o.top || -10000;
		var l = o.left || -10000;
		var d = Math.pow( top - t, 2 ) + Math.pow( left - l, 2 );
		distances.push( d );
	} );

	minDistance = Math.min.apply( Math, distances );

	return elms[ distances.indexOf( minDistance ) ];
}

document.addEventListener( 'mouseup', function ( e ) {
	var words,
		current;

	words = window.getSelection().toString().trim();

	if ( e.button === 2 || words === '' ) {
		return;
	}

	cancelHighLight();

	lastHighlighted = hightlight( words );

	current = findNearestHighlightNode( e.pageY, e.pageX );

	injectCss( '.' + HIGHLIGHT_CLASS + '{background-color: #FF0;} .' + HIGHLIGHT_CURRENT_CLASS + '::selection{background-color: #FF9632;}' );

	// set selection
	if ( current ) {
		current.classList.add( HIGHLIGHT_CURRENT_CLASS );

		var range = document.createRange();
		range.selectNodeContents( current );

		var selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange( range );

		// current.offsetHeight = current.offsetHeight;
	}
}, false );

document.addEventListener( 'keydown', function onKeyDown( e ) {
	// ESC
	if ( e.keyCode === 27 ) {
		cancelHighLight();
	}
}, false );
