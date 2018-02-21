// ==UserScript==
// @name        OC Moderation +
// @author      Sakuto
// @namespace   http://ramelot-loic.be
// @description Make the moderation easiest
// @include     *openclassrooms.com/*
// @version     0.1
// @grant       GM_xmlhttpRequest
// @grant       GM_getValue
// @grant       GM_setValue
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js
// ==/UserScript==

const answerFileLink = "https://raw.githubusercontent.com/Sakuto/OCModerationScript/master/ocreply.json";

const answerFileIndex = "answers";
const answerFileLastFetchIndex = "answersLastFetch";
const threadLockingIndex = "threadtolock";

const delayBetweenConfigurationFetch = 86400000;

const $submitFormButtton = $("input[name=submit_comment]");

// Main function
$(function () {    
    $("#myFollowedThreads").after("<li><a href=\"#\" id=\"updateReply\">Mettre à jour les réponses</a></li>");

    // Mise à jour de la configuration
    getConfigurationFile(false).then(() => {
        for(var message of getMessageBySection())
            addButton(message);
    });

    // Si on a un sujet a fermer
    if(GM_getValue(threadLockingIndex) !== '' && GM_getValue(threadLockingIndex) != undefined) {
        promiseRequest("GET", GM_getValue(threadLockingIndex))
            .then(() => GM_setValue(threadLockingIndex, ''));
    }
});

$("#newComment").on('click', ".oc-moderation", function() {
    let action = GM_getValue(answerFileIndex).answers.filter(a => a.id == $(this).attr('id'));

    performAction(action[0]);
});

// Gestion de la mise à jour manuelle
$("#secondMenu").on('click', '#updateReply', () => {
    getConfigurationFile(true).then(() => alert('Update done'));
});

/**
 * Récupère la section actuellement visité
 * 
 * @returns string Section actuellement visité
 */
function getCurrentSection() {
    return $('span[itemprop="title"]').last().text();
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

/**
 * Récupère la liste des messages de modération pour la
 * section actuelle
 * 
 * @returns Liste d'objet de réponses
 */
function getMessageBySection() {
    return GM_getValue(answerFileIndex).answers.filter(a => a.section.indexOf(getCurrentSection().trim()) > -1);
}

/**
 * Ajoute un bouton à côté du bouton d'envoi du formulaire
 * contenant le titre et référencant une action en particulier
 * 
 * @param {any} answerObject
 */

/**
 * l0lock le noob du js ajoute un hr
 * pas taper ! pas taper !!
 */

var sheet = document.createElement('style');
sheet.innerHTML = "input[name=submit_comment] {display: block; box-shadow: 0 0 20px 0px #808080;}";
document.body.appendChild(sheet);

function addButton(answerObject) {
    $submitFormButtton.before('<a class="btn btn-primary oc-moderation" style=" margin: 10px 0 0 5px; border: 1px solid #380e00; box-shadow: inset 0 1px 1px 0 #a95f47; background-color: #691c02; background-image: linear-gradient(to bottom,#872403 0,#763019 49%,#691c02 50%,#421100 100%); text-shadow: 0 -1px 0 #1c181b;" id="' + answerObject.id + '">' + answerObject.title + '</a>');
}

function performAction(answerObject) {
    let moderationMessage = "";

    if(answerObject.hasHeader) moderationMessage += GM_getValue(answerFileIndex).configuration.headers;
    moderationMessage += answerObject.message;

    addMessage(moderationMessage);

    if(answerObject.shouldLock) {
        GM_setValue(threadLockingIndex, getCloseLink());
    }

    $("input[name=submit_comment]").click();
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
 * Ajoute le message dans le textarea
 * 
 * @param {any} message
 */
function addMessage(message) {
    let textareaHolder = $("#Comment_wysiwyg_message_ifr");

    if(textareaHolder.length) {
        textareaHolder[0].contentDocument.body.innerHTML = message;
    } else {
        $("#Comment_wysiwyg_message")[0].value = message;
    }
}

/**
 * Récupère le lien de fermeture du topic
 * 
 * @returns
 */
function getCloseLink() {
    var $closeElement = $(".closeAction");
    return "https://openclassrooms.com" + $closeElement.attr('href');
}
