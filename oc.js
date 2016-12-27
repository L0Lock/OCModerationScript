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

const ansewrFileLink = "https://share.ramelot-loic.be/ocreply.json";
const answerFileIndex = "answers";
const answerFileLastFetchIndex = "answersLastFetch";
const delayBetweenConfigurationFetch = 86400000;

const $submitFormButtton = $("input[name=submit_comment]");
  
// Main function
$(function () {  
    GM_setValue(answerFileIndex, {"configuration":{"headers":"<em>Le message qui suit est une réponse automatique activée par un membre de l'équipe.</em> <em>Les réponses automatiques leur permettent d'éviter d'avoir à répéter de nombreuses fois la même chose ce qui leur fait gagner du temps et leur permet de s'occuper des sujets qui méritent plus d'attention plus facilement.</em><br /><em>Nous sommes néanmoins ouverts et si vous avez une question ou une remarque, n'hésitez pas à contacter la personne en question par Message Privé.</em><br /><br /><center>"},"answers":[{"id":1,"section":["Recrutements pour vos projets"],"title":"Mauvais format","message":"<h1>Mauvais format de recrutement</h1> <br></center><br /><br />Bonjour,<br /><br />Afin de maintenir le forum <em>Recrutements</em> dans un état lisible, nous demandons à chaque personne initiant un nouveau sujet de respecter un certain format de message, donc certaines règles. Ces règles sont listées dans le <a href=\"http://www.siteduzero.com/forum/sujet/regles-obligatoires-a-respecter-sur-ce-forum-1\">post-it de ce forum</a>et doivent impérativement être respectées. Tout sujet ne les respectant pas sera irrémédiablement fermé, comme c'est le cas ici.<center><strong><a href=\"http://www.siteduzero.com/forum/sujet/regles-obligatoires-a-respecter-sur-ce-forum-1\">LE FORMAT D'ANNONCE DE RECRUTEMENT DONNÉ EST À RESPECTER IMPÉRATIVEMENT</a></strong></center>Tu es autorisé à créer à nouveau un sujet à condition que celui-ci respecte les règles et suive le format demandé.<br /><br />Merci de ta compréhension.","hasHeader":true,"shouldLock":true},{"id":2,"section":["Recrutements pour vos projets"],"title":"Mauvais titre","message":"<h1>Mauvais format de titre</h1> </center> <br><p><br /><br />Bonjour,<br /><br />Afin de maintenir le forum <em>Recrutements</em> dans un état lisible, nous demandons à chaque personne initiant un nouveau sujet de respecter un certain format de titre. Chaque titre de sujet présent dans cette catégorie doit se composer de manière à respecter le format [Type de Projet] Nom du projet. Attention, \"Recrutement\" n'est pas un type correct, nous nous doutons que vous recrutez pour votre projet si vous postez un message ici. </p> <br><p>Quelques exemples de titres correct : </p> <br><ul> <br><li>[Application] Tinder</li><br><li>[MOBA] Heres Of The Storm</li> <br><li>[Site Web]OpenClassRooms</li> <br></ul> <br><p>Merci de ta compréhension.</p>","hasHeader":true,"shouldLock":false}]});

   // getConfigurationFile().then(() => console.log(GM_getValue(answerFileIndex)));

   for(message of getMessageBySection())
       addButton(message);

});
  
  
function addMessage(message) {
    var $iFrame = $("iframe");
    var $textArea = ($iFrame.length) ? $iFrame[0].contentDocument.body : $("#Comment_wysiwyg_message");
  
    $textArea.innerHTML = message;
}
  
function getCloseLink() {
    var $closeElement = $(".closeAction");
    return "https://openclassrooms.com" + $closeElement.attr('href');
}



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
    if(GM_getValue(answerFileLastFetchIndex) === undefined || GM_getValue(answerFileLastFetchIndex) + delayBetweenConfigurationFetch < Date.now()) {
        return fetch(replyFile, { mode: 'no-cors' }).then(answer => {
            GM_setValue(answerFileIndex, answer);
        });
    }

    return new Promise(() => wait(0));
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
    $submitFormButtton.before('<a class="btn btn-primary" style="float: right; margin: 10px 0 0 5px;" id="' + answerObject.id + '">' + answerObject.title + '</a>');
}

function performAction(answerObject) {

}