// ==UserScript==
// @name			OC Moderation Script
// @author			Sakuto, -L0Lock-, benzouye
// @namespace   		https://github.com/L0Lock/OCModerationScript
// @description 		Facilite la modération sur OpenClassrooms
// @updateURL   		https://raw.githubusercontent.com/L0Lock/OCModerationScript/master/oc.js
// @downloadURL 		https://raw.githubusercontent.com/L0Lock/OCModerationScript/master/oc.js
// @include			*openclassrooms.com/forum/*
// @version			1.4.0
// @grant			GM_xmlhttpRequest
// @grant			GM_getValue
// @grant			GM_setValue
// @require			https://code.jquery.com/jquery-3.3.1.min.js
// @require			https://code.jquery.com/ui/1.12.1/jquery-ui.min.js
// ==/UserScript==

// URL et chemins
const baseUri = "https://openclassrooms.com";
const mpUrl = baseUri+"/mp/nouveau/";
const profilUrl = baseUri+"/membres/";
const answerFileLink = "https://raw.githubusercontent.com/L0Lock/OCModerationScript/master/ocreply.json";

console.log( "Script de modération pour les forums de OpenClassrooms" );
console.log( "Version "+GM_info.script.version );
console.log( "Modérateur : " + $(".avatarPopout__itemPremium>.popOutList__link").attr("href").replace( profilUrl, "" ) );

// Liste des forums hiérarchisée
const forums = {
	"Site Web" : [
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

// Format d'affichage
const formats = {
	"vertical": [ 265, 339.6 ],
	"horizontal":[ 530, 117.2 ]
};
if( GM_getValue( "modFormat" ) === undefined )
	GM_setValue( "modFormat", "horizontal" );

// Fermeture du sujet si demandée
if( GM_getValue( "threadToLock" ) != '' && GM_getValue( "threadToLock" ) !== undefined ) {
	promiseRequest("GET", GM_getValue( "threadToLock" ) )
		.then( () => GM_setValue( "threadToLock", '' ) );
}

// Lien MAJ réponses
$(".nav-tabs--searchField").css( {"width": "40%"} );
$("#myFollowedThreads").after('<li><a href="#" id="oc-mod-update">Mettre à jour les réponses</a></li>');

// Suppression des pubs
$(".adviceBanner").remove();

// Initialisation variables
var nbMessages = 0;
var configuration = [];
var messages = [];
var modExpand = false;
var posX = GM_getValue( "modPosX" ) !== undefined ? GM_getValue( "modPosX" )+"px" : "10px";
var posY = GM_getValue( "modPosY" ) !== undefined ? GM_getValue( "modPosY" )+"px" : "175px";

// Récupération du fichier JSON des messages si dans post
if ( $("input[name=submit_comment]").length )
	getConfigurationFile( false ).then( init() );
else
	console.log( "Aucune action de modération possible ici" );

/**
 * Traite les messages possibles
 * Affiche les éléments graphique de modération
 *
 */
function init() {
	configuration = GM_getValue("answers").configuration;
	messages = GM_getValue("answers").answers;
	let messagesSection = getMessageBySection( messages, $('span[itemprop="title"]').last().text() );
	nbMessages = messagesSection.length;

	// Copie du fil d'ariane en bas du sujet
	$(".breadcrumb").clone().insertAfter($("section.comments"));

	// Eléments et styles
	if( messagesSection.length ) {
		console.log( nbMessages + " messages de modération disponibles pour cette section" );
		$("#mainContentWithHeader").append( '<div id="oc-mod-panel"><h2 class="oc-mod-title">Outils de modération <span id="oc-mod-version">'+GM_info.script.version+'</span><span id="oc-mod-drag" class="oc-mod-icon">&#x2756;</span><span id="oc-mod-caret" class="oc-mod-icon">&#x25bc;</span></h2><div id="oc-mod-content"><div id="oc-mod-reponses" class="oc-mod-column"><h3 class="oc-mod-subtitle">Messages possibles</h3></div><div id="oc-mod-options" class="oc-mod-column"><h3 class="oc-mod-subtitle">Options</h3></div><div id="oc-mod-formats" class="oc-mod-column"><h3 class="oc-mod-subtitle">Affichage</h3></div><div id="oc-mod-valid"></div></div></div>' );
		$("#oc-mod-content").hide();
		$("#oc-mod-panel").css({
			"z-index": "1000",
			"position": "fixed",
			"top": posY,
			"left": posX,
			"background": "#ececec",
			"padding": "10px",
			"border": "1px solid #4f8a03",
			"border-radius": "5px"
		});
		$("#oc-mod-caret").css( {"cursor":"pointer"} );
		$("#oc-mod-drag").css( {"cursor":"move"} );
		$(".oc-mod-icon").css( {"margin-left":"5px","float":"right","color":"#4f8a03"} );
		$("#oc-mod-panel").draggable({
			handle: "#oc-mod-drag",
			stop: function() {
				GM_setValue("modPosX", $(this).position().left );
				GM_setValue("modPosY", $(this).position().top );
			}
		});
		$(".oc-mod-column").css( {"float":"left","min-width":"250px","margin-bottom":"10px"} );
		$("#oc-mod-valid").css( {"float":"right"} );
		$(".oc-mod-title").css( {"font-size":"1.2em","color":"#4f8a03","font-weight":"bold","line-height":"1em","margin-bottom":"10px"} );
		$("#oc-mod-version").css( {"font-size":"0.5em"} );
		$(".oc-mod-subtitle").css( {"font-size":"1.1em","color":"#000","font-weight":"bold","line-height":"1em"} );
		$("#oc-mod-options").append( '<input name="hasHeader" type="checkbox" value="1" /> Ajouter entête de réponse<br />' );
		$("#oc-mod-options").append( '<input name="postMessage" type="checkbox" checked="checked" value="1" /> Poster le message directement <br />' );
		$("#oc-mod-options").append( '<input name="shouldLock" type="checkbox" value="1" /> 🔒 Fermer le sujet<br />' );
		$("#oc-mod-options").append( '<input name="dismissAlerts" type="checkbox" value="1" /> 🔔 Retirer les alertes<br />' );
		$("#oc-mod-options").append( '<input name="resolveTopic" type="checkbox" value="1" /> ✔ Passer à résolu<br />' );
		$("#oc-mod-options").append( '<input name="followTopic" type="checkbox" value="1" /> ⚑ Suivre le sujet<br />' );
		$("#oc-mod-formats").append( '<input name="modFormat" type="radio" '+(GM_getValue( "modFormat" ) == "vertical" ? 'checked="checked"' : "")+' value="vertical" /> Vertical <input name="modFormat" type="radio" '+(GM_getValue( "modFormat" ) == "horizontal" ? 'checked="checked"' : "")+' value="horizontal" /> Horizontal<br />' );
		$("#oc-mod-valid").append( '<button id="oc-mod-validation" class="btn btn-danger">Modérer</button>' );
		$("#oc-mod-validation").css({
			"position":"absolute",
			"bottom":"20px",
			"right":"20px",
			"margin":"10px 0 0 5px",
			"border":"1px solid #380e00",
			"box-shadow":"inset 0 1px 1px 0 #a95f47",
			"background-color":"#691c02",
			"background-image":"linear-gradient(to bottom,#872403 0,#763019 49%,#691c02 50%,#421100 100%)",
			"text-shadow":"0 -1px 0 #1c181b",
			"text-decoration":"none"
		});

		// Ajout des messages possibles
		for( let message of messagesSection ) {
			$("#oc-mod-reponses").append( '<input class="oc-mod-checkboxes" type="checkbox" value="'+message.id+'" /> '+message.title+'<br />' );
		}
		$("#oc-mod-reponses").append( '<input id="oc-mod-move" type="checkbox" value="1" /> Déplacer<br /><span id="oc-mod-select-span"></span>' );
	} else {
		console.log( "Aucun message de modération disponible ici" );
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
		$("#oc-mod-panel").height(formats[GM_getValue("modFormat")][1]+(nbMessages*17)+30);
	} else {
		$("#oc-mod-select-span").html("");
		$("#oc-mod-panel").height(formats[GM_getValue("modFormat")][1]+(nbMessages*17));
	}

});

// Gestion de la mise à jour manuelle
$("#oc-mod-update").click( () => {
	getConfigurationFile( true ).then( () => alert('Mise à jour des réponses effectuée !') );
});

// Changement de format
$("input[name=modFormat]").click( () => {
	GM_setValue("modFormat", $("input[name=modFormat]:checked").val() );
	$("#oc-mod-panel").width(formats[GM_getValue("modFormat")][0]);
	$("#oc-mod-panel").height(formats[GM_getValue("modFormat")][1]+(nbMessages*17));
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
		$("#oc-mod-panel").width(formats[GM_getValue("modFormat")][0]);
		$("#oc-mod-panel").height(formats[GM_getValue("modFormat")][1]+(nbMessages*17));
		$("#oc-mod-content").show();
		$("#oc-mod-caret").html("&#x25b2;");
	}
});

// Validation modération
$("#oc-mod-validation").click( () => {
	let moderationMessage = '';

	if( $("input[name=hasHeader]").prop('checked') )
		moderationMessage += configuration.headers;

	if( $("#oc-mod-move").prop("checked") ) {
		let moveLink = baseUri + $("#deplacerActionModal>form").attr('action');
		let postData = 'CategoriesList[category]='+$("#oc-mod-forum-select").val();
		moderationMessage += configuration.deplacer.replace('$$', $( "#oc-mod-forum-select option:selected" ).text() );
		promiseRequest("POST", moveLink, postData )
			.then(() => console.log("Déplacement " + moveLink + " --- " + postData ) );
	}

	$(".oc-mod-checkboxes").each( function(e) {
		if( $(this).prop('checked') ) {
			moderationMessage += '<h1 style="text-align: center;">'+messages.filter( a => a.id == $(this).val() )[0].title+'</h1>';
			moderationMessage += messages.filter( a => a.id == $(this).val() )[0].message;
		}
	});

	if( moderationMessage.length ) {

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

		// Gestion fermeture du sujet
		if( $("input[name=shouldLock]").prop('checked') ) {
			GM_setValue( "threadToLock", baseUri + $(".closeAction").attr('href') );
			moderationMessage += configuration.fermer.replace( '$$', $(".avatarPopout__itemPremium>.popOutList__link").attr("href").replace( profilUrl, mpUrl ) );
		} else {
			GM_setValue( "threadToLock", '' );
		}

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
