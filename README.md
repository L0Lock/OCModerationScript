# OC Moderation Script
## Script de modération pour les forums OpenClassrooms
Depuis n'importe-quel forum du site OpenClassrooms un lien "Mettre à jour les réponses" apparaît dans la barre de menu permettant d'actualiser la liste des messages de modérations possibles, basée sur le fichier JSON.

Dans n'importe quel sujet, une boîte à outils s'affiche par défaut en haut à droite du sujet. Cette boîte à outils :
- est déplaçable (icône "diamant)
- s'ouvre pour faire apparaître les actions possibles pour la section de forum actuelle (icône "flèche")
- dispose de deux affichages différents : "Horizontal" et "Vertical" (menu Affichage)

## Les actions possibles sur un sujet
- Ajouter un entête de message "automatique"
- Ajouter un ou plusieurs messages standards en cochant la ou les cases à cocher correspondantes
- Retirer toutes les alertes d'un sujet (case à cocher)
- Fermer le sujet (case à cocher), attention la fermeture est effective après validation et actualisation de la page
- Passer le sujet à "Résolu" (case à cocher)
- Suivre le sujet (case à cocher) pour recevoir les notifications des prochains messages sur le sujet
- Déplacer le sujet (case à cocher). Si cochée, alors une liste déroulante des forums apparaît, choisissez le forum de destination
- Poster le message directement (case à cocher). Si non cochée, vous pouvez modifier le message avant de le publier, toutes les options cochées seront quand même prise en compte
- Consulter un lien utile dans un nouvel onglet
- Copier un lien utile dans le presse papier
- Insérer un lien utile dans une réponse

Une fois vos choix fait, cliquez sur le bouton "Modérer", le tour est joué !

## Les actions possibles par MP
Sur tout message, à côté de l'avatar du membre, deux boutons permettent de :
- Contacter l'auteur d'un message par MP
- Supprimer un message et contacter l'auteur par MP
Le MP créé reprend le nom du sujet ainsi que le contenu du message cliqué.

## Ajouter un lien utile
Selon vos droits, éditer le fichier JSON du dépôt GitHub, ou faite une demande (issue) de modification.
Pour ajouter un lien, il faut simplement ajouter un élément de ce format dans le bloc "links" du fichier JSON. Attention à bien préciser un id inexistant dans la liste ...

	{
		"id": 1,
		"section": [],
		"exclude": [],
		"title": "Titre du lien",
		"url": "https:\\monurl.com\"</p>"
	},

<em>section</em> et <em>exclude</em> seront des tableaux contenant :
- "all" = toutes les sections
- le nom d'une section de forum ou de son parent

## Ajouter un message de modération
Selon vos droits, éditer le fichier JSON du dépôt GitHub, ou faite une demande (issue) de modification.
Pour ajouter un message, il faut simplement ajouter un élément de ce format dans le bloc "answers" du fichier JSON. Attention à bien préciser un id inexistant dans la liste ...

	{
		"id": 1,
		"section": [],
		"exclude": [],
		"title": "Titre affiché sur le bouton",
		"message": "<p>Mon message en \"html\"</p>",
		"infobulle": "Aide à propose du message"
	},

<em>section</em> et <em>exclude</em> seront des tableaux contenant :
- "all" = toutes les sections
- le nom d'une section de forum ou de son parent

## Liste des sections
Selon vos droits, éditer le fichier JSON du dépôt GitHub, ou faite une demande (issue) de modification.
Pour ajouter une section, il faut simplement ajouter un élément de ce format dans le bloc "sections" du fichier JSON.

	{
		"nom": "HTML / CSS",
		"parent": "Site Web",
		"links": []
	},
