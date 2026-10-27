/* CorpoBello: carousel arrows, the treatments category filter, the offers' last day, the price lists under the
   service cards and the phone menu. Plain JS, deferred, no dependencies. */
( function () {
	var arrow = function ( dir ) {
		return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="' + ( dir < 0 ? 'M15.4 5.4 14 4l-8 8 8 8 1.4-1.4L8.8 12z' : 'M8.6 5.4 10 4l8 8-8 8-1.4-1.4 6.6-6.6z' ) + '"/></svg>';
	};

	document.querySelectorAll( '.cb-carousel' ).forEach( function ( track ) {
		var wrap = document.createElement( 'div' );
		wrap.className = 'cb-carousel-wrap';
		track.parentNode.insertBefore( wrap, track );
		wrap.appendChild( track );
		// sideways trackpad swipes scroll the carousel, never the page (Lenis, motion.js)
		track.setAttribute( 'data-lenis-prevent-horizontal', '' );
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

	/* Offers of the month: the server already leaves out expired ones; this covers a cached page or the
	   static preview. Each offer is shown through its last day, Puerto Rico time (UTC-4, no DST). */
	var offers = document.querySelector( '[data-cb-offers]' );
	if ( offers ) {
		var now = Date.now();
		offers.querySelectorAll( '[data-hasta]' ).forEach( function ( card ) {
			var end = Date.parse( card.getAttribute( 'data-hasta' ) + 'T23:59:59-04:00' );
			if ( ! isNaN( end ) && now > end ) {
				card.parentNode.removeChild( card );
			}
		} );
		if ( ! offers.querySelector( '[data-hasta]' ) ) {
			offers.parentNode.removeChild( offers );
			document.body.classList.add( 'cb-no-offers' );
		}
	}

	/* Price lists: each service card's "Ver Más" opens its category's list under the card grid, one at a
	   time. Deep links (/#morpheus8, /#faciales, the 301 targets of the old treatment URLs) open the right
	   list and scroll to the line. html.cb-js (set in <head>) hides the closed lists, so no JS = all open. */
	var menu = document.querySelector( '.cb-menu' );
	if ( menu ) {
		document.documentElement.classList.add( 'cb-js' );
		window.cbReady = true;
		var touched = false;
		var cats = [].slice.call( menu.querySelectorAll( '.cb-menu__cat' ) );
		var triggers = [].slice.call( document.querySelectorAll( '[data-cb-cat]' ) );
		var reduce = window.matchMedia && window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
		// a wheel scroll keeps Lenis (motion.js) animating for ~0.8 s and it would cancel our scroll: stop it first
		var calm = function () {
			if ( window.cbLenis ) {
				window.cbLenis.stop();
				window.cbLenis.start();
			}
		};
		var openCat = function ( id ) {
			cats.forEach( function ( c ) { c.classList.toggle( 'is-open', c.id === id ); } );
			triggers.forEach( function ( t ) { t.setAttribute( 'aria-expanded', t.getAttribute( 'data-cb-cat' ) === id ? 'true' : 'false' ); } );
		};
		var current = function () {
			var o = menu.querySelector( '.cb-menu__cat.is-open' );
			return o ? o.id : null;
		};
		cats.forEach( function ( c ) {
			c.setAttribute( 'tabindex', '-1' );
			c.setAttribute( 'role', 'region' );
			if ( document.getElementById( c.id + '-h' ) ) {
				c.setAttribute( 'aria-labelledby', c.id + '-h' );
			}
		} );
		triggers.forEach( function ( t ) {
			t.addEventListener( 'click', function () {
				var id = t.getAttribute( 'data-cb-cat' );
				var cat = document.getElementById( id );
				touched = true;
				if ( ! cat ) {
					return;
				}
				if ( current() === id ) {
					openCat( null );
					clearHash();
					return;
				}
				openCat( id );
				if ( history.replaceState ) {
					history.replaceState( null, '', '#' + id );
				}
				calm();
				cat.scrollIntoView( { behavior: reduce ? 'auto' : 'smooth', block: 'start' } );
				cat.focus( { preventScroll: true } );
			} );
		} );
		var clearHash = function () {
			if ( history.replaceState ) {
				history.replaceState( null, '', location.pathname + location.search );
			}
		};
		menu.addEventListener( 'click', function ( e ) {
			if ( ! e.target.closest( '[data-cb-close]' ) ) {
				return;
			}
			var id = current();
			touched = true;
			openCat( null );
			clearHash();
			var back = id && document.querySelector( '[data-cb-cat="' + id + '"]' );
			if ( back ) {
				back.focus( { preventScroll: true } );
				calm();
				back.scrollIntoView( { behavior: reduce ? 'auto' : 'smooth', block: 'center' } );
			}
		} );
		var fromHash = function () {
			var id = '';
			try {
				id = decodeURIComponent( location.hash.slice( 1 ) );
			} catch ( err ) {
				return;
			}
			var el = id && document.getElementById( id );
			var cat = el && ( el.classList.contains( 'cb-menu__cat' ) ? el : el.closest( '.cb-menu__cat' ) );
			if ( ! cat ) {
				return;
			}
			openCat( cat.id );
			menu.querySelectorAll( '.cb-mi.is-target' ).forEach( function ( m ) { m.classList.remove( 'is-target' ); } );
			if ( el !== cat ) {
				el.classList.add( 'is-target' );
			}
			calm();
			el.scrollIntoView( { block: el === cat ? 'start' : 'center', behavior: 'instant' } );
		};
		fromHash();
		var y0 = window.scrollY;
		window.addEventListener( 'hashchange', fromHash );
		window.addEventListener( 'load', function () {
			// late images can shift the target; re-aim only if the visitor has not moved or clicked since
			if ( location.hash && ! touched && Math.abs( window.scrollY - y0 ) < 2 ) {
				fromHash();
			}
		} );
	}

	/* Phone menu: the header links fold into a button under 782 px. */
	var head = document.querySelector( '.cb-header' );
	var burger = head && head.querySelector( '.cb-burger' );
	if ( burger ) {
		var setMenu = function ( on ) {
			head.classList.toggle( 'is-open', on );
			burger.setAttribute( 'aria-expanded', on ? 'true' : 'false' );
			burger.setAttribute( 'aria-label', on ? 'Cerrar menú' : 'Menú' );
			document.documentElement.classList.toggle( 'cb-menu-open', on );
			// smooth wheel scrolling (motion.js) must not move the page behind the open menu
			if ( window.cbLenis ) {
				if ( on ) {
					window.cbLenis.stop();
				} else {
					window.cbLenis.start();
				}
			}
			// keep Tab inside the open menu: everything else on the page is inert while it is open
			document.querySelectorAll( '.wp-site-blocks > :not(.cb-header-wrap), .cb-wa-fab' ).forEach( function ( el ) {
				if ( on ) {
					el.setAttribute( 'inert', '' );
				} else {
					el.removeAttribute( 'inert' );
				}
			} );
		};
		if ( window.matchMedia ) {
			var wide = window.matchMedia( '(min-width: 782px)' );
			var onWide = function () { if ( wide.matches ) { setMenu( false ); } };
			if ( wide.addEventListener ) {
				wide.addEventListener( 'change', onWide );
			}
		}
		burger.addEventListener( 'click', function () { setMenu( ! head.classList.contains( 'is-open' ) ); } );
		head.querySelectorAll( '.cb-nav a' ).forEach( function ( a ) { a.addEventListener( 'click', function () { setMenu( false ); } ); } );
		document.addEventListener( 'keydown', function ( e ) {
			if ( 'Escape' === e.key && head.classList.contains( 'is-open' ) ) {
				setMenu( false );
				burger.focus();
			}
		} );
	}
} )();
