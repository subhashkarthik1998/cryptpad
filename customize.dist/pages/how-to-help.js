define([
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/customize/pages.js'
], function (h, Msg, Pages) {
    return function () {

	// Start compensating for apparently incomplete flexbox implementations
	window.equalizeCardHeights = function() {
		var rows = {};
		var aDiff = false;
		Array.from(document.getElementsByClassName("card-body")).forEach(function(e) {
			var c = e.getBoundingClientRect();
			var center =  "" + ((c.top + c.bottom)/2);
			var row = (rows[center] = rows[center] || {});
			row.rowHeight = row.rowHeight || c.height;
			if(row.rowHeight !== c.height) {aDiff = true;}
			row.maxHeight = row.maxHeight ? Math.max(row.maxHeight, c.height) : c.height;
			row.elements = row.elements || [];
			row.elements.push(e);
		});

		for(var rowY in rows) {
			if(rows.hasOwnProperty(rowY)) {
				var row = rows[rowY];
				var m = row.maxHeight + "px";
				row.elements.forEach(function(el){el.style.height= m;});
			}
		}
	};

	var willEqualize = false;
	var intervalHandle = null;
	function thinkOfEqualizing(timeout) {
		if(willEqualize) {return;}
		willEqualize = true;
		intervalHandle = window.setInterval(function() {
			if(document.getElementsByClassName("card-body").length===0) {
				return; // it'll repeat
			}
			window.clearInterval(intervalHandle);
			willEqualize = false; window.equalizeCardHeights();
		}, timeout);
	}

	window.addEventListener('resize', function() {
		Array.from(document.getElementsByClassName("card-body"))
			.forEach(function(e) {e.style.height='';});
		thinkOfEqualizing(200);
	});

	if(location.href.endsWith('contact.html') || location.href.endsWith('how-to-help.html')) {
		thinkOfEqualizing(100);
	}
	// End compensating for apparently incomplete flexbox implementations


		return h('div#cp-main', [
			Pages.infopageTopbar(),
			h('div.container-fluid.cp-contdet', [
				h('row.col-5.col-sm-5',
					h('h1.text-center', "How to help CryptPad" )
				)
			]),
			h('div.container.cp-container', [
				h('div.row.cp-iconCont.align-items-center', [

					h('div.col-8.col-sm-4.col-md-4.col-lg-4',
						h('span.card',
							h('div.card-body',
								[
									h('p.fa.fa-comments.sign'),
									Pages.setHTML(h('p'), 'Spread the word: Blog, ' +
										'Tweet (<a href="https://twitter.com/hashtag/cryptpad">#cryptpad</a>), ' +
										'or recommend it to friends.<br>' +
										'Share the link to a pad and explain how simple it can be to collaborate with privacy.')
								]
							)
						)
					),

					h('div.col-8.col-sm-4.col-md-4.col-lg-4',
						h('span.card',
							h('div.card-body',
								[
									h('p.fa.fa-bullhorn.sign'),
									Pages.setHTML(h('p'), 'Announce that you like it! <br>E.g. on <a href="https://alternativeto.net/software/cryptpad/">AlternativeTo</a>:\n' +
										'\n' +
										'    like CryptPad  <img src="/customize/images/alternativeto-like-before.png" style="height:2.5ex">' +
										'    or mark it as a <em>good alternative</em> ' +
										'     to <a href="https://alternativeto.net/software/google-docs---word-processor/#item-cryptpad">Google-Docs</a>, ' +
										'     to <a href="https://alternativeto.net/software/etherpad-lite/#item-cryptpad">Etherpad</a>, ' +
										'     or to <a href="https://alternativeto.net/software/onlyoffice/#item-cryptpad">OnlyOffice</a>.')
								]
							)
						)
					),
					h('div.col-8.col-sm-4.col-md-4.col-lg-4',
						h('span.card',
							h('div.card-body',
								[
									h('p.fa.fa-stack-exchange.sign'),
									Pages.setHTML(h('p'), '' +
										'Tell us: a place we\'re listed in, a scenario where you fail or succeed with cryptpad, a wished feature or adaptation:' +
										'  the <a href="https://cryptpad.fr/code/#/2/code/edit/5lQHp86+DeDOYFTuccPqLEaE/">feedback pad</a> is there for you.')
								]
							)
						)
					),
					h('div.col-8.col-sm-4.col-md-4.col-lg-4',
						h('span.card',
							h('div.card-body',
								[
									h('p.fa.fa-envelope-open.sign'),
									Pages.setHTML(h('p'), '' +
										'Support the development with ' +
										'<a href="https://opencollective.com/cryptpad/contribute">a donation at OpenCollective</a> ' +
										'  (or <a href="https://cryptpad.fr/contact.html">ask</a> for further methods)')
								]
							)
						)
					),
					h('div.col-8.col-sm-4.col-md-4.col-lg-4',
						h('span.card',
							h('div.card-body',
								[
									h('p.fa.fa-puzzle-piece.sign'),
									Pages.setHTML(h('p'), '' +
										'Order a feature you wish and let it flow in the open-source CryptPad codebase ' +
										'<a href="https://cryptpad.fr/contact.html">by contacting us</a>.')
								]
							)
						)
					),

					h('div.col-8.col-sm-4.col-md-4.col-lg-4',
						h('span.card',
							h('div.card-body',
								[
									Pages.setHTML(h('p'), '<img src="/customize/images/dandelion.jpeg" style="width:100%">')
								]
							)
						)
					),

				]),
			]),
			Pages.infopageFooter(),
		]);
	};


    return Pages;
});
