/* CorpoBello motion: the live homepage's scroll and entrance effects, rebuilt without Elementor or jQuery.
   Measured on corpobello-pr.com on 27 Oct 2026 (Elementor 4.3.4 + Pro 3.34.4 motion effects, Lenis 1.3.26):
   - hero circles: translateY at speeds 5 / 4 / 3 / 2 over 51-100 % of the scroll range, desktop and tablet
   - Servicios cards: fade in as the card grid comes into view, desktop and tablet
   - ¿Cómo agendar? photo: drifts left over 13 % of its width while the section passes, every width
   - hero photo on phones: a 200 % wide layer drifting right as the page scrolls
   - ¿Cómo agendar? step circles: zoomIn on entry after 0.5 / 1 / 2 / 3 s, 1.25 s ease
   - Lenis smooth wheel scrolling with the plugin's settings (its defaults: lerp 0.1, wheel only, touch native)
   Elementor's maths, reproduced: progress p = (viewport height - parent top) / (viewport height + parent
   content height) x 100, measured on the effect's parent element; element effects use clamp(p, start, end).
   Every value eases to its target over 1 s with Elementor's own curve (theme.css, html.cb-motion-ease).
   Under prefers-reduced-motion nothing here runs. Without JS nothing is hidden: the only hidden state
   (.cb-zoom-wait) is put on each step circle by this script, after it has an IntersectionObserver. */
( function () {
	var mm = window.matchMedia;
	if ( ! mm || ! window.requestAnimationFrame || mm( '(prefers-reduced-motion: reduce)' ).matches ) {
		return;
	}
	var root = document.documentElement;
	var wide = mm( '(min-width: 782px)' ); // desktop + tablet effects; our phone layout starts below 782 px
	var narrow = mm( '(max-width: 781px)' );
	var every = { matches: true };
	var q = function ( sel, ctx ) {
		return ( ctx || document ).querySelector( sel );
	};
	var clamp = function ( v, lo, hi ) {
		return v < lo ? lo : ( v > hi ? hi : v );
	};
	// padding + border of a dimensions element, cached (Elementor uses jQuery height(), the content box)
	var edge = function ( el ) {
		var cs = getComputedStyle( el );
		return parseFloat( cs.paddingTop ) + parseFloat( cs.paddingBottom ) + parseFloat( cs.borderTopWidth ) + parseFloat( cs.borderBottomWidth );
	};
	// lift: how far above el the live page's measured wrapper starts (its padding), in px
	var progress = function ( el, pad, vh, lift ) {
		var r = el.getBoundingClientRect();
		return ( vh - r.top + ( lift || 0 ) ) / ( vh + r.height - pad ) * 100;
	};
	var fx = [];
	var measure = function () {
		fx.forEach( function ( f ) {
			if ( f.dims ) {
				f.pad = edge( f.dims );
			}
		} );
	};

	/* 1. Hero circles: translateY = -(clamp(p, 51, 100) - 50) x speed, so -5/-4/-3/-2 px at the top of the
	   page and -250/-200/-150/-100 px once the hero has scrolled away. */
	var badges = q( '.cb-hero--home .cb-badges' );
	var circles = badges ? [].slice.call( badges.querySelectorAll( '.cb-badge' ) ) : [];
	if ( circles.length ) {
		var speeds = [ 5, 4, 3, 2 ];
		fx.push( {
			on: wide,
			dims: badges,
			read: function ( vh ) {
				// live measures a wrapper whose 10 px top padding sits above the circles
				return clamp( progress( badges, this.pad, vh, 10 ), 51, 100 );
			},
			write: function ( p ) {
				circles.forEach( function ( c, i ) {
					c.style.transform = 'translateY(' + ( -( p - 50 ) * ( speeds[ i ] || 2 ) ).toFixed( 2 ) + 'px)';
				} );
			},
			off: function () {
				circles.forEach( function ( c ) {
					c.style.transform = '';
				} );
			},
		} );
	}

	/* 2. Servicios cards fade in. Live: Elementor opacity "out-in", level 10, over 20-34 % of the section's
	   range, which keeps the cards invisible until their top is 264 px into the screen. Same fade length here
	   (14 % of viewport + section), started as the grid enters, so a card in the reading area is never
	   half transparent at rest. */
	var grid = q( '.cb-services .cb-svc-grid' );
	if ( grid ) {
		fx.push( {
			on: wide,
			read: function ( vh ) {
				var r = grid.getBoundingClientRect();
				return clamp( ( vh - r.top ) / ( 0.14 * ( vh + r.height + 145 ) ), 0, 1 );
			},
			write: function ( v ) {
				grid.style.opacity = v.toFixed( 3 );
			},
			off: function () {
				grid.style.opacity = '';
			},
		} );
	}

	/* 3. ¿Cómo agendar? photo: Elementor's background layer is 113 % wide and moves -13 % of the column
	   (-11.504 % of its own width) as p goes 0 -> 100. theme.css already draws it 113 % wide at rest. */
	var howto = q( '.cb-howto-home' );
	var howImg = q( '.cb-howto-home__img img' );
	if ( howto && howImg ) {
		fx.push( {
			on: every,
			dims: howto,
			read: function ( vh ) {
				return clamp( progress( howto, this.pad, vh ), 0, 100 );
			},
			write: function ( p ) {
				howImg.style.transform = 'translateX(' + ( -11.504 * p / 100 ).toFixed( 3 ) + '%)';
			},
			off: function () {
				howImg.style.transform = '';
			},
		} );
	}

	/* 4. Hero photo on phones: a 200 % wide layer, direction "negative", moved by -(100 - p) % of the screen
	   width (-50 % x (1 - p/100) of its own width), p over the whole page content as Elementor measures it.
	   theme.css draws it at -43 %, the value at the top of the page, so nothing jumps when this starts. */
	var hero = q( '.cb-hero--home' );
	var heroImg = hero && q( '.wp-block-cover__image-background', hero );
	var page = hero && hero.parentNode;
	if ( heroImg && page ) {
		fx.push( {
			on: narrow,
			dims: page,
			read: function ( vh ) {
				return clamp( progress( page, this.pad, vh ), 0, 100 );
			},
			write: function ( p ) {
				heroImg.style.transform = 'translateX(' + ( -50 * ( 1 - p / 100 ) ).toFixed( 3 ) + '%)';
			},
			off: function () {
				heroImg.style.transform = '';
			},
		} );
	}

	var ticking = false;
	var frame = function () {
		var vh = window.innerHeight;
		ticking = false;
		// all reads first, then all writes: transforms and opacity never change layout, so nothing thrashes
		var vals = fx.map( function ( f ) {
			return f.on.matches ? f.read( vh ) : null;
		} );
		fx.forEach( function ( f, i ) {
			if ( null === vals[ i ] ) {
				if ( f.live ) {
					f.off();
					f.live = false;
				}
				return;
			}
			f.write( vals[ i ] );
			f.live = true;
		} );
	};
	var request = function () {
		if ( ! ticking ) {
			ticking = true;
			window.requestAnimationFrame( frame );
		}
	};
	if ( fx.length ) {
		measure();
		frame();
		// commit the starting values before the 1 s ease is switched on, so nothing slides into place on load
		document.body.getBoundingClientRect();
		root.classList.add( 'cb-motion-ease' );
		window.addEventListener( 'scroll', request, { passive: true } );
		window.addEventListener( 'resize', function () {
			measure();
			request();
		} );
		// late fonts and images change section heights after first paint
		window.addEventListener( 'load', function () {
			measure();
			request();
		} );
	}

	/* 5. ¿Cómo agendar? step circles: Elementor zoomIn, each circle on its own entry into view, after its
	   own delay, once. */
	var steps = [].slice.call( document.querySelectorAll( '.cb-circles4 .cb-circle' ) );
	var delays = [ 500, 1000, 2000, 3000 ];
	if ( steps.length && 'IntersectionObserver' in window ) {
		var io = new IntersectionObserver( function ( entries ) {
			entries.forEach( function ( e ) {
				if ( ! e.isIntersecting ) {
					return;
				}
				var el = e.target;
				io.unobserve( el );
				window.setTimeout( function () {
					el.classList.remove( 'cb-zoom-wait' );
					el.classList.add( 'cb-zoom-in' );
				}, delays[ steps.indexOf( el ) ] || 0 );
			} );
		}, { rootMargin: '0px 0px -10% 0px' } );
		steps.forEach( function ( el ) {
			el.classList.add( 'cb-zoom-wait' );
			io.observe( el );
		} );
	}

	/* 6. Smooth wheel scrolling, as the live plugin sets it up: Lenis defaults, no anchor handling (anchors
	   keep the native smooth scroll from html { scroll-behavior: smooth }, as on the live page). cb.js stops
	   it while the phone menu is open. */
	if ( window.Lenis ) {
		window.cbLenis = new window.Lenis( { smoothWheel: true, autoRaf: true } );
		// a same-page anchor clicked while Lenis is still easing a wheel scroll: stop the easing so the
		// native smooth scroll to the anchor is not cancelled frame by frame
		document.addEventListener( 'click', function ( e ) {
			var a = e.target.closest && e.target.closest( 'a[href*="#"]' );
			if ( a && a.hash && a.pathname === location.pathname && window.cbLenis ) {
				window.cbLenis.stop();
				window.cbLenis.start();
			}
		}, true );
	}

	/* Reduced motion switched on while the page is open: everything stops and stays visible. */
	var rm = mm( '(prefers-reduced-motion: reduce)' );
	var still = function () {
		if ( ! rm.matches ) {
			return;
		}
		window.removeEventListener( 'scroll', request );
		fx.forEach( function ( f ) {
			f.on = { matches: false };
			f.off();
		} );
		root.classList.remove( 'cb-motion-ease' );
		steps.forEach( function ( el ) {
			el.classList.remove( 'cb-zoom-wait' );
		} );
		if ( window.cbLenis ) {
			window.cbLenis.destroy();
			window.cbLenis = null;
		}
	};
	if ( rm.addEventListener ) {
		rm.addEventListener( 'change', still );
	}
} )();
