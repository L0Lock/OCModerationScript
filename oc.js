// ==UserScript==
// @name			OC Moderation Script
// @author			Sakuto, -L0Lock-, benzouye, Lamecarlate
// @namespace   		https://github.com/L0Lock/OCModerationScript
// @description 		Facilite la modération sur OpenClassrooms
// @updateURL   		https://raw.githubusercontent.com/L0Lock/OCModerationScript/master/oc.js
// @downloadURL 		https://raw.githubusercontent.com/L0Lock/OCModerationScript/master/oc.js
// @include			*openclassrooms.com/forum/*
// @include			*openclassrooms.com/*mp/*
// @include			*openclassrooms.com/interventions/*
// @include			*openclassrooms.com/sujets/*
// @version			2.9.1
// @noframes
// @grant			GM_xmlhttpRequest
// @grant			GM_getValue
// @grant			GM_setValue
// @require			https://code.jquery.com/jquery-3.3.1.min.js
// @require			https://code.jquery.com/ui/1.12.1/jquery-ui.min.js
// @require			https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.0/clipboard.min.js
// ==/UserScript==

(function ($, document, undefined) {
	"use strict;"

	// URL et chemins
	const baseUri = "https://openclassrooms.com";
	const mpUrl = "/mp/nouveau/";
	const profilUrl = "/membres/";
	const messageUrl = "/forum/sujet/";
	const deleteUrl = "/fr/message/supprimer/";
	const moderateUrl = "/fr/message/moderer/";
	const answerFileLink = "https://raw.githubusercontent.com/L0Lock/OCModerationScript/master/ocreply.json";

	// Variables de gestion
	const formats = { "vertical": 265, "horizontal": 500 };
	const hr = '<hr class="mod-oc-hr" />';
	var forums;
	var code = "plain"
	var section = $('span[itemprop="title"]').last().text();
	var nbMessages = 0;
	var configuration = [];
	var messages = [];
	var modExpand = false;
	var posX = GM_getValue( "modPosX" ) !== undefined ? GM_getValue( "modPosX" )+"px" : "10px";
	var posY = GM_getValue( "modPosY" ) !== undefined ? GM_getValue( "modPosY" )+"px" : "175px";

	// Mémorisation pages visitées
	GM_setValue( "lastPage", GM_getValue("currentPage") );
	GM_setValue( "currentPage", window.location.pathname );
	if( GM_getValue( "mpClick" ) === undefined ) GM_setValue( "mpClick" , false );
	if( GM_getValue( "mpDelete" ) === undefined ) GM_setValue( "mpDelete" , false );
	if( GM_getValue( "modFormat" ) === undefined ) GM_setValue( "modFormat", "horizontal" );

	// Fermeture du sujet si demandée
	if( GM_getValue( "threadToLock" ) != '' && GM_getValue( "threadToLock" ) !== undefined ) {
		promiseRequest("GET", GM_getValue( "threadToLock" ) )
			.then( () => {
			GM_setValue( "threadToLock", '' );
		});
	}

	// Suppression message si demandée
	if( GM_getValue( "postToDelete" ) != '' && GM_getValue( "postToDelete" ) !== undefined ) {
		let deleteLink = baseUri + deleteUrl + GM_getValue( "postToDelete" );
		let postData = '';
		promiseRequest("POST", deleteLink, postData )
			.then(() => {
			GM_setValue( "postToDelete", '' );
		});
	}

	// Ajout lien MP + suppression
	$(".author>a").each( function(e) {
		if( $(".avatarPopout__itemPremium>.popOutList__link").attr("href").replace( baseUri, '') != $(this).attr("href") ) {
			$(this).parent().parent().parent().append('<a title="Ecrire un MP au membre" data-delete="1" href="'+$(this).attr("href").replace( profilUrl, mpUrl )+'" class="oc-mod-tooltip oc-mod-mp button--primary" target="_blank"><i class="icon-letter"></i></a>');
			$(this).parent().parent().parent().append('<a title="Modérer le message" data-moderate="1" href="#" class="oc-mod-tooltip oc-mod-mp button--warning"><i class="icon-eye"></i></a>');
			$(this).parent().parent().parent().append('<a title="Supprimer le message et écrire un MP au membre" data-delete="1" href="'+$(this).attr("href").replace( profilUrl, mpUrl )+'" class="oc-mod-tooltip oc-mod-mp button--danger"><i class="icon-cross"></i></a>');
		}
	});

	// Traitement MP
	if( $("input#ThreadMessage_title").length && GM_getValue( "mpClick" ) ) {
		GM_setValue( "mpClick" , false );
		getConfigurationFile( false ).then( () => {
			let mp = GM_getValue("answers").mp;
			let mpMessage = '';

			if( GM_getValue("mpDelete") ) {
				GM_setValue( "mpDelete" , false );
				mpMessage = mp.message;
			} else {
				mpMessage = mp.softmp;
			}

			let messageMp = mpMessage.replace( '$$', GM_getValue("lastPage") ) + GM_getValue( "mpContent" );
			$("input#ThreadMessage_title").val( mp.title );
			$("input#ThreadMessage_subtitle").val( GM_getValue("lastPage").replace( messageUrl, "" ) );
			let textareaHolder = $("#ThreadMessage_comments_0_wysiwyg_message_ifr");

			if(textareaHolder.length) {
				textareaHolder[0].contentDocument.body.innerHTML = message;
			} else {
				$("#ThreadMessage_comments_0_wysiwyg_message")[0].value = messageMp;
			}
		});
	}

	// Traitement sujet
	if( $("input[name=submit_comment]").length )
		getConfigurationFile( false ).then( initPost() );

	function initPost() {
		configuration = GM_getValue("answers").configuration;
		forums = GM_getValue("answers").sections;

		messages = GM_getValue("answers").answers;
		messages = messages.sort( comparaison );
		let messagesSection = getElementsBySection( messages, section );
		nbMessages = messagesSection.all.length + messagesSection.specific.length;

		let liens = GM_getValue("answers").links;
		liens = liens.sort( comparaison );
		let liensSection = getElementsBySection( liens, section );
		let nbLiens = liensSection.all.length + liensSection.specific.length;

		if( nbMessages > 0 ) {
			// Lien mise à jour message
			$("#mainContentWithHeader").append(
				'<div id="oc-mod-panel">'+
				'<h2 class="oc-mod-title">'+
				'Outils de modération '+
				'<span class="oc-mod-version">'+GM_info.script.version+'</span>'+
				'<span id="oc-mod-drag" class="oc-mod-icon">&#x2756;</span>'+
				'<span id="oc-mod-caret" class="oc-mod-icon">&#x25bc;</span>'+
				'</h2>'+
				'<div id="oc-mod-content">'+
				'<div id="oc-mod-reponses" class="oc-mod-column">'+
				'<h3 class="oc-mod-subtitle">'+
				'Messages possibles '+
				'<span class="oc-mod-version"><a href="#" id="oc-mod-update" class="oc-mod-tooltip" title="Mettre à jour les messages">'+GM_getValue("answers").version+' <i class="oc-mod-refresh icon-refresh"></i></a></span>'+
				'</h3>'+
				'</div>'+
				'<div id="oc-mod-formats" class="oc-mod-column">'+
				'<h3 class="oc-mod-subtitle">Affichage</h3>'+
				'</div>'+
				'<div id="oc-mod-options" class="oc-mod-column">'+
				'<h3 class="oc-mod-subtitle">Options</h3>'+
				'</div>'+
				'<div id="oc-mod-valid"></div>'+
				'</div>'+
				'</div>'
			);
			$("#oc-mod-content").hide();

			$("#oc-mod-panel").draggable({
				handle: "#oc-mod-drag",
				stop: function() {
					GM_setValue("modPosX", $(this).position().left );
					GM_setValue("modPosY", $(this).position().top );
				}
			});

			$("#oc-mod-options").append( '<div class="oc-mod-tooltip" title="Ajoute un entête de message pour préciser le caractère automatique de la modération"><label class="mod-oc-label"><input name="hasHeader" type="checkbox" value="1" /> Ajouter entête de réponse</label></div>' );
			$("#oc-mod-options").append( '<div class="oc-mod-tooltip" title="Si décochée, vous permet de modifier le contenu du message avant de le publier"><label class="mod-oc-label"><input name="postMessage" type="checkbox" checked="checked" value="1" /> Poster le message directement</label></div>' );
			$("#oc-mod-options").append( '<div class="oc-mod-tooltip" title="Si cochée, le sujet sera fermé et une phrase le précisera dans le message"><label class="mod-oc-label"><input name="shouldLock" type="checkbox" value="1" /> 🔒 Fermer le sujet</label></div>' );
			$("#oc-mod-options").append( '<div class="oc-mod-tooltip" title="Si cochée, toutes les alertes du sujet seront retirées"><label class="mod-oc-label"><input name="dismissAlerts" type="checkbox" value="1" /> 🔔 Retirer les alertes</label></div>' );
			$("#oc-mod-options").append( '<div class="oc-mod-tooltip" title="Si cochée, le sujet sera passé à \'Résolu\'"><label class="mod-oc-label"><input name="resolveTopic" type="checkbox" value="1" /> ✔ Passer à résolu</label></div>' );
			$("#oc-mod-options").append( '<div class="oc-mod-tooltip" title="Si cochée, le sujet sera ajouté à votre liste de sujets suivis"><label class="mod-oc-label"><input name="followTopic" type="checkbox" value="1" /> ⚑ Suivre le sujet</label></div>' );
			$("#oc-mod-formats").append( '<span class="oc-mod-tooltip" title="Permet de définir un affichage vertical de la boîte à outils"><input name="modFormat" type="radio" '+(GM_getValue( "modFormat" ) == "vertical" ? 'checked="checked"' : "")+' value="vertical" /> Vertical</span>&nbsp;<span class="oc-mod-tooltip" title="Permet de définir un affichage horizontal de la boîte à outils"><input name="modFormat" type="radio" '+(GM_getValue( "modFormat" ) == "horizontal" ? 'checked="checked"' : "")+' value="horizontal" /> Horizontal</span>' );
			$("#oc-mod-valid").append( '<button id="oc-mod-validation" title="Valider les actions de modération" class="oc-mod-tooltip button--warning">Modérer</button>' );

			// Ajout menu liens
			if( nbLiens > 0 ) {
				$("#oc-mod-options").before( '<div id="oc-mod-links" class="oc-mod-column"><h3 class="oc-mod-subtitle">Liens utiles</h3></div>' );
				let compteur = 0;
				let hrPlaced = false;
				for( let typeLien in liensSection ) {
					for( let lien of liensSection[typeLien] ) {
						let idLink = 'oc-mod-link-'+compteur;
						$("#oc-mod-links").append(
							'<div>'+
							'<input class="oc-mod-tooltip oc-mod-modolink" title="Cocher pour ajouter ce lien à la fin du message de modération" type="checkbox" value="1" /> '+
							'<a target="_blank" class="oc-mod-link oc-mod-tooltip" title="Ouvrir ce lien dans un nouvel onglet" href="'+lien.url+'">'+lien.title+'</a>&nbsp;'+
							'<i id="'+idLink+'" data-clipboard-text="'+lien.url+'" title="Copier le lien dans le presse papier" class="icon-validated_doc oc-mod-tooltip oc-mod-pointer"></i>&nbsp;'+
							'<i title="Ajouter ce lien dans le message" class="oc-mod-addlink icon-test oc-mod-tooltip oc-mod-pointer"></i>'+
							'</div>'
						);
						let clipboard = new ClipboardJS( $("#"+idLink)[0] );
						compteur++;
					}
					if( liensSection.specific.length && !hrPlaced ) {
						$("#oc-mod-links").append( hr );
						hrPlaced = true;
					}
				}
				$(".oc-mod-addlink").click( function(e) {
					let newlink = ' <a href="'+$(this).parent().find(".oc-mod-link").attr("href")+'">'+$(this).parent().find(".oc-mod-link").text()+'</a> ';
					tinyMCE.activeEditor.execCommand( 'mceInsertContent', false, newlink );
					$(window).scrollTop( $(document).height()-200 );
				});
			}

			// Ajout des messages possibles
			let hrPlaced = false;
			for( let typeMessage in messagesSection ) {
				for( let message of messagesSection[typeMessage] ) {
					$("#oc-mod-reponses").append( '<div class="oc-mod-tooltip" title="'+message.infobulle.replace('"',"")+'"><label class="mod-oc-label"><input class="oc-mod-checkboxes" type="checkbox" value="'+message.id+'" /> '+message.title+'</label></div>' );
				}
				if( messagesSection.specific.length && !hrPlaced ) {
					$("#oc-mod-reponses").append( hr );
					hrPlaced = true;
				}
			}

			// Déplacement
			$("#oc-mod-reponses").append(
				'<div class="oc-mod-tooltip" title="Si cochée, laisse apparaître la liste des forums possibles pour déplacer le sujet">'+
				'<label class="mod-oc-label"><input id="oc-mod-move" type="checkbox" value="1" /> Déplacer</label><br /><span id="oc-mod-select-span"></span>'+
				'</div>'
			);
		}
	}

	// Gestion déplacement sujet
	$("#oc-mod-move").click( function(e) {
		if( $(this).prop("checked") ) {
			$("#oc-mod-select-span").append( '<select id="oc-mod-forum-select"></select>' );
			$("#CategoriesList_category>option").each( function(e) {
				if( $(this).val() != "" )
					$("#oc-mod-forum-select").append('<option value="'+$(this).val()+'">'+$(this).html()+'</option>');
			});
		} else {
			$("#oc-mod-select-span").html("");
		}
	});

	// Gestion de la mise à jour manuelle
	$("#oc-mod-update").click( () => {
		getConfigurationFile( true ).then( () => location.reload(true) );
	});

	// Gestion des MP
	$(".oc-mod-mp").click( function(e) {
		GM_setValue( "mpDelete" , false );
		
		if( $(this).data('moderate') ) {
			let masquer = GM_getValue("answers").masquer;
			let moderateLink = baseUri + moderateUrl + $(this).parent().parent().find(".span10.comment").attr("id").replace( 'message-', '' );
			let postData = 'moderation[moderate]='+masquer.idMasquer+'&moderation[otherReason]='+masquer.message+'&moderation[_token]='+$('#moderation__token').val();
			console.log( moderateLink, postData );
			promiseRequest("POST", moderateLink, postData )
				.then(() => {
					console.log( "Envoi masquage OK" );
				}
			);
		} else {
			if( $(this).data('delete') ) {
				if( confirm( "Voulez-vous vraiment supprimer ce message ?" ) ) {
					GM_setValue( "postToDelete", $(this).parent().parent().find(".span10.comment").attr("id").replace( 'message-', '' ) );
					GM_setValue( "mpDelete" , true );
				} else {
					e.preventDefault();
				}
			}
			GM_setValue( "mpContent", $(this).parent().parent().find(".message.markdown-body").html() );
			GM_setValue( "mpClick" , true );
		}
	});

	// Changement de format
	$("input[name=modFormat]").click( () => {
		GM_setValue("modFormat", $("input[name=modFormat]:checked").val() );
		$("#oc-mod-panel").width(formats[GM_getValue("modFormat")]);
	});

	// Ouverture / Fermeture du panneau
	$("#oc-mod-caret").click( () => {
		if( modExpand ) {
			modExpand = false;
			$("#oc-mod-panel").width("");
			$("#oc-mod-panel").height("");
			$("#oc-mod-content").hide();
			$("#oc-mod-caret").html("&#x25bc;");
		} else {
			modExpand = true;
			$("#oc-mod-panel").width(formats[GM_getValue("modFormat")]);
			$("#oc-mod-content").show();
			$("#oc-mod-caret").html("&#x25b2;");
		}
	});

	// Validation modération
	$("#oc-mod-validation").click( () => {
		let moderationMessage = '';
		let titreMessage = $('#mainSection .grid-wrapper .grid-inner h1 a').first().text();
		let sousTitreMessage = $('#mainSection .grid-wrapper .grid-inner h2.subtitle').first().text();

		if( $("input[name=hasHeader]").prop('checked') )
			moderationMessage += configuration.headers;

		if( $("#oc-mod-move").prop("checked") ) {
			let moveLink = baseUri + $("#deplacerActionModal>form").attr('action');
			let postData = 'CategoriesList[category]='+$("#oc-mod-forum-select").val();
			moderationMessage += '<h1 style="text-align: center;">Mauvais forum</h1>';
			moderationMessage += configuration.deplacer.replace('$$2', $( "#oc-mod-forum-select option:selected" ).text() );
			moderationMessage = moderationMessage.replace('$$1', section );
			promiseRequest("POST", moveLink, postData )
				.then(() => console.log("Déplacement " + moveLink + " --- " + postData ) );
		}

		$(".oc-mod-checkboxes:checked").each( function(e) {
			let leMessage = messages.filter( a => a.id == $(this).val() )[0];
			moderationMessage += '<h1 style="text-align: center;">'+leMessage.title+'</h1>';

			for( let forumObject in forums ) {
				if( section == forums[forumObject].nom ) {
					code = forums[forumObject].code;
				}
			}

			// Ajout du nom du code sur la balise code (message 10)
			if( leMessage.id == 10 ) {
				moderationMessage += leMessage.message.replace( '$$', code );
			} else {
				moderationMessage += leMessage.message;
			}

			if( leMessage.titleQuote ) {
				moderationMessage += '<p style="font-size:xx-small;">(titre originel : '+titreMessage+')</p>';
			}
		});

		if( $(".oc-mod-modolink:checked").length ) {
			moderationMessage += '<h2>Liens conseillés</h2><ul>';
			$(".oc-mod-modolink:checked").each( function(e) {
				moderationMessage += '<li><a href="'+$(this).parent().find(".oc-mod-link").attr("href")+'">'+$(this).parent().find(".oc-mod-link").text()+'</a></li>';
			});
			moderationMessage += '</ul>';
		}

		// Gestion fermeture du sujet
		if( $("input[name=shouldLock]").prop('checked') ) {
			GM_setValue( "threadToLock", baseUri + $(".closeAction").attr('href') );
			moderationMessage += configuration.fermer.replace( '$$', $(".avatarPopout__itemPremium>.popOutList__link").attr("href").replace( baseUri+profilUrl, baseUri+mpUrl ) );
		} else {
			GM_setValue( "threadToLock", '' );
		}

		if( moderationMessage.length ) {
			moderationMessage = configuration.intro + moderationMessage;

			// Retirer les alertes
			if( $("input[name=dismissAlerts]").prop('checked') ) {
				$(".span12>a").each( function(e) {
					let alertLink = baseUri + $(this).attr('href');
					promiseRequest("GET", alertLink )
						.then(() => console.log("Retrait alerte " + alertLink ) );
				});
			}

			// Résoudre le sujet
			if( $("input[name=resolveTopic]").prop('checked') ) {
				let resolveLink = baseUri + $(".removeResolveAction").attr('href');
				promiseRequest("GET", resolveLink )
					.then(() => console.log("Résolution " + resolveLink ) );
			}

			// Suivre le sujet
			if( $("input[name=followTopic]").prop('checked') ) {
				let followLink = baseUri + $("#notFollow>a").attr('href');
				promiseRequest("GET", followLink )
					.then(() => console.log("Suivi " + followLink ) );
			} else {
				let followLink = baseUri + $("#follow>a").attr('href');
				promiseRequest("GET", followLink )
					.then(() => console.log("Stop suivi " + followLink ) );
			}

			// Ajout du message dans l'éditeur
			tinyMCE.activeEditor.execCommand( 'mceInsertContent', false, moderationMessage );

			// Validation du formulaire si demandée
			if( $("input[name=postMessage]").prop('checked') ) {
				$("input[name=submit_comment]").click();
            } else {
                $("#oc-mod-caret").trigger("click");
				$(window).scrollTop( $(document).height() );
            }
		} else {
			alert( 'Aucun message à poster !' );
		}
	});

	// Style CSS
	$('.mod-oc-hr').css({ "margin":"5px 15px", "width":"200px" });
	$('.mod-oc-label').css({ "margin":"0px" });
	$("#oc-mod-panel").css({
		"z-index": "1000",
		"position": "fixed",
		"top": posY,
		"left": posX,
		"background": "#ececec",
		"padding": "10px",
		"border": "2px solid #f52",
		"border-radius": "5px"
	});
    $(".oc-mod-refresh").css({"vertical-align":"baseline"});
	$(".oc-mod-pointer").css({"cursor":"pointer"});
	$("#oc-mod-caret").css( {"cursor":"pointer"} );
	$("#oc-mod-drag").css( {"cursor":"move"} );
	$(".oc-mod-icon").css( {"margin-left":"5px","float":"right","color":"#f52"} );
	$(".oc-mod-column").css( {"float":"left","width":"250px","margin-bottom":"10px"} );
	$("#oc-mod-valid").css( {"float":"right"} );
	$(".oc-mod-title").css( {"font-size":"1.2em","color":"#f52","font-weight":"bold","line-height":"1em","margin-bottom":"10px"} );
	$(".oc-mod-version").css( {"font-size":"0.5em"} );
	$(".oc-mod-subtitle").css( {"font-size":"1.1em","color":"#000","font-weight":"bold","line-height":"1em"} );
	$(".oc-mod-subsubtitle").css( {"font-size":"1em","color":"#f52","font-weight":"bold","line-height":"1em"} );
	$("#oc-mod-validation").css({
		"position":"absolute",
		"bottom":"20px",
		"right":"20px"
	});
	$(".skills").css({"margin-bottom":"5px"});
    $(".oc-mod-mp").css({"margin":"1px","padding":"5px","text-decoration":"none" });

	/**
	 * Récupère le fichier de configuration du serveur si la dernière mise à jour
	 * date de plus de 24 heures. Retourne une promesse pour poursuivre l'execution
	 * de manière sécurisée.
	 *
	 * @returns Promise avec les valeurs
	 */
	function getConfigurationFile(forceCheck) {
		if( forceCheck || (GM_getValue("answersLastFetch") === undefined || GM_getValue("answersLastFetch") + 86400000 > Date.now())) {
			return promiseRequest("GET", answerFileLink)
				.then(response => GM_setValue("answers", JSON.parse(response.responseText)))
				.then(() => GM_setValue("answersLastFetch", Date.now()));
		}

		return new Promise((resolve, reject) => resolve());
	}

	/**
	 * Crée une XML request sous forme de promise
	 *
	 * @param {any} method GET, POST, PUT, DELETE
	 * @param {any} url URL à exploiter
	 * @returns Promise contenant la requête
	 */
	function promiseRequest(method, url, data = "" ) {
		return new Promise((resolve, reject) => {
			let xhr = GM_xmlhttpRequest({
				method: method,
				url: url,
				onload: resolve,
				onerror: reject,
				data: data,
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				}
			});
		});
	}

	/**
	 * Récupère la liste filtrée des messages de modération
	 *
	 * @returns Liste d'objet de réponses
	 */
	function getElementsBySection( messages, section ) {
		var forum = false;
		var orgaMessages = {
			"specific": [],
			"all": []
		};

		for( let forumObject in forums ) {
			if( section == forums[forumObject].nom ) {
				forum = forums[forumObject].parent;
			}
		}

		for( var message in messages ) {
			var sections = messages[message].section;
			var excludes = messages[message].exclude;

			if( $.inArray( section, excludes ) > -1 || $.inArray( forum, excludes ) > -1 || $.inArray( "all", excludes ) > -1 ) {
				continue;
			}

			if( $.inArray( section, sections ) > - 1 || $.inArray( forum, sections ) > -1 || $.inArray( "all", sections ) > -1 ) {
				if( $.inArray( "all", sections ) > -1 ) {
					orgaMessages.all.push( messages[message] );
				} else {
					orgaMessages.specific.push( messages[message] );
				}
			}
		}

		return orgaMessages;
	}

	/**
	 * Tri personnalisé selon colonne title
	*/
	function comparaison( a, b ) {
		if ( a.title < b.title ) return -1;
		if ( a.title > b.title ) return 1;
		return 0;
	}

})(window.jQuery, document);
