/* CorpoBello: carousel arrows and the treatments category filter. Plain JS, deferred, no dependencies. */
( function () {
	var arrow = function ( dir ) {
		return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="' + ( dir < 0 ? 'M15.4 5.4 14 4l-8 8 8 8 1.4-1.4L8.8 12z' : 'M8.6 5.4 10 4l8 8-8 8-1.4-1.4 6.6-6.6z' ) + '"/></svg>';
	};

	document.querySelectorAll( '.cb-carousel' ).forEach( function ( track ) {
		var wrap = document.createElement( 'div' );
		wrap.className = 'cb-carousel-wrap';
		track.parentNode.insertBefore( wrap, track );
		wrap.appendChild( track );
		var prev = document.createElement( 'button' );
		var next = document.createElement( 'button' );
		prev.className = 'cb-car-btn cb-car-btn--prev';
		next.className = 'cb-car-btn cb-car-btn--next';
		prev.type = next.type = 'button';
		prev.setAttribute( 'aria-label', 'Oferta anterior' );
		next.setAttribute( 'aria-label', 'Oferta siguiente' );
		prev.innerHTML = arrow( -1 );
		next.innerHTML = arrow( 1 );
		wrap.appendChild( prev );
		wrap.appendChild( next );
		var step = function () {
			var slide = track.querySelector( '.cb-slide' );
			return slide ? slide.getBoundingClientRect().width + 20 : track.clientWidth * 0.8;
		};
		var sync = function () {
			prev.disabled = track.scrollLeft < 8;
			next.disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 8;
		};
		prev.addEventListener( 'click', function () { track.scrollBy( { left: -step(), behavior: 'smooth' } ); } );
		next.addEventListener( 'click', function () { track.scrollBy( { left: step(), behavior: 'smooth' } ); } );
		track.addEventListener( 'scroll', sync, { passive: true } );
		window.addEventListener( 'resize', sync );
		sync();
	} );

	document.querySelectorAll( '.cb-filter' ).forEach( function ( bar ) {
		var panel = bar.closest( '.cb-panel' ) || document;
		var items = panel.querySelectorAll( '.cb-grid .wp-block-post-template > li' );
		bar.addEventListener( 'click', function ( e ) {
			var link = e.target.closest( 'a' );
			if ( ! link ) {
				return;
			}
			e.preventDefault();
			var slug = link.getAttribute( 'href' ).replace( '#', '' );
			bar.querySelectorAll( '.cb-chip' ).forEach( function ( c ) { c.classList.remove( 'is-active' ); } );
			link.closest( '.cb-chip' ).classList.add( 'is-active' );
			items.forEach( function ( li ) {
				li.hidden = slug !== 'todo' && ! li.classList.contains( 'tax-servicio-' + slug );
			} );
		} );
	} );
} )();
