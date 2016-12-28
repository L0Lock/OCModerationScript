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
    getConfigurationFile().then(() => {
        for(message of getMessageBySection())
            addButton(message);
    });

    // Si on a un sujet a fermer
    if(GM_getValue('threadToClose') != '') {
        promiseRequest("GET", GM_getValue('threadToClose'))
            .then(() => GM_setValue('threadToClose', ''));
    }
});
  
$("#newComment").on('click', ".oc-moderation", function() {
    let action = GM_getValue(answerFileIndex).answers.filter(a => a.id == $(this).attr('id'));

    performAction(action[0]);
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
function getConfigurationFile() {
    if(GM_getValue(answerFileLastFetchIndex) === undefined || GM_getValue(answerFileLastFetchIndex) + delayBetweenConfigurationFetch > Date.now()) {
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
function addButton(answerObject) {
    $submitFormButtton.before('<a class="btn btn-primary oc-moderation" style="float: right; margin: 10px 0 0 5px;" id="' + answerObject.id + '">' + answerObject.title + '</a>');
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
    })
}

/**
 * Ajoute le message dans le textarea
 * 
 * @param {any} message
 */
function addMessage(message) {
    let textareaHolder = $("iframe");

    if(textareaHolder.length) {
        textareaHolder.contentDocument.body.innerHTML = message;
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