	// ==UserScript==
	// @name	    OC Moderation Script
	// @author	    Sakuto, -L0Lock-, benzouye
	// @namespace   http://ramelot-loic.be
	// @description Make the moderation easiest
	// @updateURL   https://raw.githubusercontent.com/L0Lock/OCModerationScript/master/oc.js
	// @downloadURL https://raw.githubusercontent.com/L0Lock/OCModerationScript/master/oc.js
	// @include	    *openclassrooms.com/*
	// @version	    1.1
	// @grant	    GM_xmlhttpRequest
	// @grant	    GM_getValue
	// @grant	    GM_setValue
	// @require	    http://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js
	// ==/UserScript==

	// URL et chemins
	const baseUri = "https://openclassrooms.com";
	const answerFileLink = "https://raw.githubusercontent.com/L0Lock/OCModerationScript/master/ocreply.json";

	// Liste des forums hiérarchisée
	const forums = {
		"Site web" : [
			"HTML / CSS",
			"Javascript",
			"PHP"
		],
		"Entreprise" : [
			"Discussions entreprise",
			"Communication et marketing",
			"Entrepreneuriat"
		],
		"Programmation" : [
			"Langage C",
			"Langage C++",
			"Langages.NET",
			"Langage Java",
			"Langage Python",
			"Base de données",
			"Mobile",
			"Autres langages (VBA, Ruby,...)",
			"Discussions développement"
		],
		"Système d'exploitation" : [
			"Windows",
			"Linux & FreeBSD",
			"Mac OS X"
		],
		"Design" : [
			"Graphisme 3D",
			"Graphisme 2D",
			"Design Thinking"
		],
		"Matériel et logiciel" : [
			"Discussions Hardware",
			"Disscussions Software",
			"Choix du matériel & configuration",
			"Problèmes techniques",
			"Vos réseaux"
		],
		"Jeux vidéos" : [
			"Discussions jeux vidéo",
			"Mapping & Modding"
		],
		"Sciences" : [
			"Mathématiques",
			"Physique",
			"Chimie",
			"Biologie et Géologie",
			"Électronique",
			"Autres sciences"
		],
		"Communauté des Zéros" : [
			"Discussions générales",
			"Let's talk!",
			"Vos études",
			"Recrutement pour vos projets",
			"Présentation de vos projets",
			"Rédaction de cours",
			"Fonctionnement du site",
			"Forum des Premiums Plus",
			"JSdZ et évènements",
			"Do It Yourself"
		],
		"Admin" : [
			"Forum du staff"
		]
	};

	// Fermeture du sujet si demandée
	if( GM_getValue( "threadToLock" ) != '' && GM_getValue( "threadToLock" ) !== undefined ) {
		promiseRequest("GET", GM_getValue( "threadToLock" ) )
			.then(() => GM_setValue( "threadToLock", '' ) );
	}

	// Lien MAJ réponses avec gif loading
	$(".nav-tabs--searchField").css( {"width": "40%"} );
	$("#myFollowedThreads").after('<li><a href="#" id="oc-mod-update">Mettre à jour les réponses</a></li>');

	// Initialisation variables
	var configuration = [];
	var messages = [];

	// Récupération des messages possibles
	getConfigurationFile( false ).then( init() );

	/**
	 * Traite les messages possibles
	 * Affiche les éléments graphique de modération
	 *
	 */
	function init() {
		configuration = GM_getValue("answers").configuration;
		messages = GM_getValue("answers").answers;
		let messagesSection = getMessageBySection( messages, $('span[itemprop="title"]').last().text() );

		// Eléments et styles
		if( messagesSection.length ) {
			$("input[name=submit_comment]").before( '<div id="oc-mod-panel"><h2 id="oc-mod-panel-title">Outils de modération</h2><div id="oc-mod-reponses"><h3 id="oc-mod-reponses-title">Messages possibles</h3></div><div id="oc-mod-options"><h3 id="oc-mod-options-title">Options</h3></div><div id="oc-mod-valid"></div></div>' );
			$("#oc-mod-panel").css( {"float":"left","width":"75%","padding":"10px","border":"1px solid #4f8a03","border-radius":"5px"} );
			$("#oc-mod-reponses").css( {"float":"left","width":"50%"} );
			$("#oc-mod-options").css( {"float":"left","width":"50%"} );
			$("#oc-mod-valid").css( {"float":"left","width":"100%","text-align":"center"} );
			$("#oc-mod-panel-title").css( {"color":"#4f8a03","font-weight":"bold","line-height":"1em","margin-bottom":"10px"} );
			$("#oc-mod-reponses-title").css( {"color":"#000","font-weight":"bold","line-height":"1em"} );
			$("#oc-mod-options-title").css( {"color":"#000","font-weight":"bold","line-height":"1em"} );
			$("#oc-mod-options").append( '<input name="hasHeader" type="checkbox" value="1" /> Ajouter entête de réponse<br />' );
			$("#oc-mod-options").append( '<input name="shouldLock" type="checkbox" value="1" /> Fermer le sujet 🔒<br />' );
			$("#oc-mod-options").append( '<input name="postMessage" type="checkbox" checked="checked" value="1" /> Poster le message directement<br />' );
			$("#oc-mod-options").append( '<input name="dismissAlerts" type="checkbox" value="1" /> Retirer les alertes<br />' );
			$("#oc-mod-options").append( '<input name="resolveTopic" type="checkbox" value="1" /> Mettre "Résolu"<br />' );
			$("#oc-mod-valid").append( '<a id="oc-mod-validation" class="btn btn-primary">Modérer</a>' );
			$("#oc-mod-validation").css( {"margin":"10px 0 0 5px","border":"1px solid #380e00","box-shadow":"inset 0 1px 1px 0 #a95f47","background-color":"#691c02","background-image":"linear-gradient(to bottom,#872403 0,#763019 49%,#691c02 50%,#421100 100%)","text-shadow":"0 -1px 0 #1c181b","text-decoration":"none"} );

			// Ajout des messages possibles
			for( let message of messagesSection ) {
				$("#oc-mod-reponses").append( '<input class="oc-mod-checkboxes" type="checkbox" value="'+message.id+'" /> '+message.title+'<br />' );
			}
		}
	}

	// Gestion de la mise à jour manuelle
	$("#oc-mod-update").click( () => {
		getConfigurationFile( true ).then( () => alert('Mise à jour des réponses effectuée !') );
	});

	// Validation modération
	$("#oc-mod-validation").click( () => {
		let moderationMessage = '';

		if( $("input[name=hasHeader]").prop('checked') )
			moderationMessage += configuration.headers;

		$(".oc-mod-checkboxes").each( function(e) {
			if( $(this).prop('checked') ) {
				let message = messages.filter( a => a.id == $(this).val() )[0].message;
				moderationMessage += message;
			}
		});

		if( moderationMessage.length ) {

			// Retirer les alertes
			if( $("input[name=dismissAlerts]").prop('checked') ) {
				$(".span12>a").each( function(e) {
					var alertLink = baseUri + $(this).attr('href');
					promiseRequest("GET", alertLink )
						.then(() => console.log("Retrait alerte " + alertLink ) );
				});
			}

			// Retirer les alertes
			if( $("input[name=resolveTopic]").prop('checked') ) {
				var resolveLink = baseUri + $(".removeResolveAction").attr('href');
				promiseRequest("GET", alertLink )
					.then(() => console.log("Résolution " + alertLink ) );
			}

			// Gestion fermeture du sujet
			if( $("input[name=shouldLock]").prop('checked') )
				GM_setValue( "threadToLock", baseUri + $(".closeAction").attr('href') );
			else
				GM_setValue( "threadToLock", '' );

			// Ajout du message dans l'éditeur
			var textareaHolder = $("#Comment_wysiwyg_message_ifr");
			if(textareaHolder.length)
				textareaHolder[0].contentDocument.body.innerHTML = moderationMessage;
			else
				$("#Comment_wysiwyg_message")[0].value = moderationMessage;

			// Validation du formulaire si demandée
			if( $("input[name=postMessage]").prop('checked') )
				$("input[name=submit_comment]").click();
		} else {
			alert( 'Aucun message à poster !' );
		}
	});

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
	function promiseRequest(method, url) {
		return new Promise((resolve, reject) => {
			let xhr = GM_xmlhttpRequest({
				method: method,
				url: url,
				onload: resolve,
				onerror: reject
			});
		});
	}

	/**
	 * Récupère la liste des messages de modération
	 * pour la section courante ou son parent ou "all"
	 * en excluant les sections précisées
	 *
	 * @returns Liste d'objet de réponses
	 */
	function getMessageBySection( messages, section ) {
		var forum = false;
		var retour = [];

		for( var titre in forums ) {
			if( $.inArray( section, forums[titre] ) > -1 )
				forum = titre;
		}

		for( var i = 0; i < messages.length; i++) {
			var sections = messages[i].section;
			var excludes = messages[i].exclude;

			if( $.inArray( section, excludes ) > -1 || $.inArray( forum, excludes ) > -1 || $.inArray( "all", excludes ) > -1 )
				break;

			if( $.inArray( section, sections ) > - 1 || $.inArray( forum, sections ) > -1 || $.inArray( "all", sections ) > -1 )
				retour.push( messages[i] );
		}

		return retour;
	}
