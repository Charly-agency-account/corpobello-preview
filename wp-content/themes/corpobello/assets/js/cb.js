/* CorpoBello: carousel arrows, the treatments category filter, the offers' last day, the price lists under the
   service cards, the booking calendar dialog and the phone menu. Plain JS, deferred, no dependencies. */
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

	/* Booking calendar in a dialog over the page (the client's yes, 3 Nov 2026). The "Agenda tu cita" buttons keep
	   their real link (data-cb-book, functions.php), so without JS, or with a middle click or cmd-click, GoHighLevel
	   opens in a new tab as before; a plain click opens the same calendar here. Nothing from GoHighLevel loads
	   before that first click: the dialog, the frame and the message listener are all made on it. */
	if ( document.querySelector( 'a[data-cb-book]' ) && window.HTMLDialogElement && window.URL ) {
		var dlg, frame, opener, src, bookOrigin;
		var lockScroll = function ( on ) {
			var root = document.documentElement;
			// keep the page from shifting sideways when its scrollbar disappears under the dialog
			root.style.setProperty( '--cb-sbw', on ? ( window.innerWidth - root.clientWidth ) + 'px' : '0px' );
			root.classList.toggle( 'cb-book-open', on );
			// smooth wheel scrolling (motion.js) must not move the page behind the dialog
			if ( window.cbLenis ) {
				if ( on ) {
					window.cbLenis.stop();
				} else {
					window.cbLenis.start();
				}
			}
		};
		var build = function () {
			dlg = document.createElement( 'dialog' );
			dlg.className = 'cb-book';
			dlg.setAttribute( 'aria-labelledby', 'cb-book-title' );
			dlg.setAttribute( 'aria-modal', 'true' );
			dlg.innerHTML =
				'<div class="cb-book__bar"><h2 class="cb-book__title" id="cb-book-title">Agenda tu cita</h2>' +
				'<button type="button" class="cb-book__close" autofocus><span>Cerrar</span><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M18.3 5.7 16.9 4.3 12 9.2 7.1 4.3 5.7 5.7 10.6 12l-4.9 4.9 1.4 1.4 4.9-4.9 4.9 4.9 1.4-1.4-4.9-4.9z"/></svg></button></div>' +
				'<div class="cb-book__body"><div class="cb-book__wait" role="status"><span class="cb-book__spin" aria-hidden="true"></span>' +
				'<span>Cargando el calendario…</span><a class="cb-book__alt" target="_blank" rel="noopener">¿No carga? Ábrelo en otra pestaña</a></div></div>';
			frame = document.createElement( 'iframe' );
			frame.className = 'cb-book__frame';
			frame.title = 'Calendario para agendar tu cita en CorpoBello';
			frame.addEventListener( 'load', function () {
				dlg.classList.add( 'is-ready' );
			} );
			dlg.querySelector( '.cb-book__body' ).appendChild( frame );
			dlg.querySelector( '.cb-book__close' ).addEventListener( 'click', function () {
				dlg.close();
			} );
			// a click on the dimmed backdrop (the dialog box itself has no padding, so only the backdrop hits it)
			dlg.addEventListener( 'click', function ( e ) {
				if ( e.target === dlg ) {
					dlg.close();
				}
			} );
			// Esc fires cancel and then close; the frame stays loaded, so reopening keeps where the guest was
			dlg.addEventListener( 'close', function () {
				lockScroll( false );
				if ( opener ) {
					opener.focus( { preventScroll: true } );
				}
			} );
			document.body.appendChild( dlg );
			/* GoHighLevel's booking widget, once a booking is confirmed, posts
			   ["msgsndr-booking-complete", { fingerprint, calendarId }] to the parent window with target "*"
			   (read in its own bundle, 3 Nov 2026). Only that frame, from the calendar's own origin, counts, and
			   only on the live site (window.cbTrack, set by functions.php when corpobello_tracking is on). */
			window.addEventListener( 'message', function ( e ) {
				var d = e.data;
				if ( ! window.cbTrack || e.source !== frame.contentWindow || e.origin !== bookOrigin || ! Array.isArray( d ) || 'msgsndr-booking-complete' !== d[0] ) {
					return;
				}
				if ( 'function' === typeof window.fbq ) {
					window.fbq( 'track', 'Schedule' );
				}
				( window.dataLayer = window.dataLayer || [] ).push( { event: 'corpobello_booking_complete' } );
			} );
		};
		var openBooking = function ( link ) {
			if ( ! dlg ) {
				build();
			}
			if ( src !== link.href ) {
				src = link.href;
				bookOrigin = new URL( src ).origin;
				dlg.classList.remove( 'is-ready' );
				dlg.querySelector( '.cb-book__alt' ).href = src;
				frame.src = src;
			}
			opener = link;
			lockScroll( true );
			dlg.showModal();
		};
		document.querySelectorAll( 'a[data-cb-book]' ).forEach( function ( a ) {
			a.setAttribute( 'aria-haspopup', 'dialog' );
		} );
		document.addEventListener( 'click', function ( e ) {
			var link = e.target.closest && e.target.closest( 'a[data-cb-book]' );
			// a new tab or window (middle click, cmd/ctrl/shift-click) goes to GoHighLevel as a normal link
			if ( ! link || e.defaultPrevented || 0 !== e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey ) {
				return;
			}
			e.preventDefault();
			openBooking( link );
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
			document.querySelectorAll( '.wp-site-blocks > :not(.cb-header-wrap), .cb-wa' ).forEach( function ( el ) {
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
