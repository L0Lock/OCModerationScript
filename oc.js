	// ==UserScript==
	// @name	OC Moderation Script
	// @author	Sakuto, -L0Lock-, benzouye
	// @namespace   http://ramelot-loic.be
	// @description Make the moderation easiest
	// @include	*openclassrooms.com/*
	// @version	1.0.3
	// @grant	GM_xmlhttpRequest
	// @grant	GM_getValue
	// @grant	GM_setValue
	// @require	http://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js
	// ==/UserScript==
	
	const gitOwner = "benzouye";
	const answerFileLink = "https://raw.githubusercontent.com/"+gitOwner+"/OCModerationScript/master/ocreply.json";
	const loadingGif = "https://raw.githubusercontent.com/"+gitOwner+"/OCModerationScript/master/loader.gif";
	
	const baseUri = "https://openclassrooms.com";
	const answerFileIndex = "answers";
	const answerFileLastFetchIndex = "answersLastFetch";
	const threadLockingIndex = "threadtolock";
	const threadDismissAlerts = "dismissAlerts";
	const delayBetweenConfigurationFetch = 86400000;

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
	var messages = GM_getValue(answerFileIndex).answers;
	var messagesSection = getMessageBySection( messages, $('span[itemprop="title"]').last().text() );

	// Fermeture du sujet le cas échéant
	if(GM_getValue(threadLockingIndex) !== '' && GM_getValue(threadLockingIndex) != undefined) {
		promiseRequest("GET", GM_getValue(threadLockingIndex)).then(() => GM_setValue(threadLockingIndex, ''));
	}

	// Retirer les alertes le cas échéant
	if( GM_getValue(threadDismissAlerts) != undefined ) {
		if( GM_getValue(threadDismissAlerts).constructor === Array ) {
			var alertes = GM_getValue(threadDismissAlerts);
			for( var alerte in alertes ) {
				promiseRequest("GET", alerte ).then(() => GM_setValue( threadDismissAlerts, [] ) );
			}
		}
	}

	if( messagesSection.length ) {
		// Eléments et styles
		$("#myFollowedThreads").after("<li><a href=\"#\" id=\"updateReply\">Mettre à jour les réponses</a></li>");
		$(".nav-tabs--searchField").css( {"width": "40%"} );
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
		$("#oc-mod-valid").append( '<a id="oc-mod-validation" class="btn btn-primary">Modérer</a>' );
		$("#oc-mod-validation").css( {"margin":"10px 0 0 5px","border":"1px solid #380e00","box-shadow":"inset 0 1px 1px 0 #a95f47","background-color":"#691c02","background-image":"linear-gradient(to bottom,#872403 0,#763019 49%,#691c02 50%,#421100 100%)","text-shadow":"0 -1px 0 #1c181b","text-decoration":"none"} );
        $("#oc-mod-reponses").append('<img id="oc-mod-loading" src="'+loadingGif+'" />');

		// Ajout des messages possibles si config ok
		getConfigurationFile(false).then(() => {
            $("#oc-mod-loading").hide();
			for(var message of messagesSection ) {
				var cases = '<input class="oc-mod-checkboxes" type="checkbox" value="'+message.id+'" /> '+message.title+'<br />';
				$("#oc-mod-reponses").append( cases );
			}
		});
	}

	// Validation modération
	$("#oc-mod-validation").click( function(e) {
		var moderationMessage = '';

		if( $("input[name=hasHeader]").prop('checked') )
			moderationMessage += GM_getValue(answerFileIndex).configuration.headers;

		$(".oc-mod-checkboxes").each( function(e) {
			if( $(this).prop('checked') ) {
				messageObject = GM_getValue(answerFileIndex).answers.filter( a => a.id == $(this).val() );
				moderationMessage += messageObject[0].message;
			}
		});

		if( moderationMessage.length ) {

			// Fermeture du sujet
			if( $("input[name=shouldLock]").prop('checked') )
				GM_setValue( threadLockingIndex, baseUri + $(".closeAction").attr('href') );
			else
				GM_setValue( threadLockingIndex, '' );

			// Retirer les alertes
			if( $("input[name=dismissAlerts]").prop('checked') ) {
				var liensAlertes = [];
				$(".span12>a").each( function(e) {
					liensAlertes.push( baseUri + $(this).attr('href') );
				});
				GM_setValue( threadDismissAlerts, liensAlertes );
			} else {
				GM_setValue( threadDismissAlerts, [] );
			}

			addMessage(moderationMessage);

			if( $("input[name=postMessage]").prop('checked') )
				$("input[name=submit_comment]").click();

		} else {
			alert( 'Aucun message à poster !' );
		}
	});

	/**
	 * Ajoute le message dans le textarea
	 *
	 * @param {any} message
	 */
	function addMessage(message) {
		let textareaHolder = $("#Comment_wysiwyg_message_ifr");

		if(textareaHolder.length)
			textareaHolder[0].contentDocument.body.innerHTML = message;
		else
			$("#Comment_wysiwyg_message")[0].value = message;
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

	/**
	 * Récupère le fichier de configuration du serveur si la dernière mise à jour
	 * date de plus de 24 heures. Retourne une promesse pour poursuivre l'execution
	 * de manière sécurisée.
	 *
	 * @returns Promise avec les valeurs
	 */
	function getConfigurationFile(forceCheck) {
		if(forceCheck || (GM_getValue(answerFileLastFetchIndex) === undefined || GM_getValue(answerFileLastFetchIndex) + delayBetweenConfigurationFetch > Date.now())) {
			return promiseRequest("GET", answerFileLink)
				.then(response => GM_setValue(answerFileIndex, JSON.parse(response.responseText)))
				.then(() => GM_setValue(answerFileLastFetchIndex, Date.now()));
		}

		return new Promise((resolve, reject) => resolve());
	}

	// Gestion de la mise à jour manuelle
	$("#secondMenu").on('click', '#updateReply', () => {
		getConfigurationFile(true).then(() => alert('Update done'));
	});

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
