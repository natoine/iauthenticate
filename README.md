# iauthenticate
un projet pour faire du passport js

Pour la partie Facebook :
Connectez-vous sur votre compte développeur facebook
https://developers.facebook.com/

Mes app > ajouter une app
Renseigner le nom de l'app, le mail de contact.
Dans Paramètres > général cliquer sur ajouter une plateforme, choisir Web et vous aurez un champ texte : URL du site
Renseigner avec : http://localhost:8080/auth/facebook/callback

Enregistrer les modifications.

A gauche, dans Produits cliquez sur Facebook Login.
Paramètres.
Dans "URI de redirection OAuth valides" mettre http://localhost:8080/auth/facebook/callback


