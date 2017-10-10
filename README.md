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

Dans l'onglet à gauche

Choisisr "Ajouter un produit" -> "Facebook Login"
Ajouter l'adresse du callback : http://localhost:8080/auth/facebook/callback
Enregistrer les modifications
Vérifier si le callback a bien été ajouté.
Retourner dans "Ajouter un produit" et tout en bas de la page dans "Mes Produits" 
Dans "Paramètres", vérifier si pour el champ "URI de redirection OAuth valides" contient bien l'adresse du callback
Sinon ajouter la puis enregistrer

Demandes de Marion à Ponnaka : tout est ok pour moi de ce qui est explicté jusqte au-dessus mais cela ne marche toujours pas et cela fait crasher le serveur quand je clique sur facebook...
Peut-on préciser les points suivants concernant les paramètres de mon produit
Connexion OAuth cliente : oui ou non ? (oui par défaut chez moi)
Connexion OAuth web : oui ou non ? (oui par défaut chez moi)
Connexion OAuth de navigateur intégrée : oui ou non ? (non par défaut chez moi)
Forcer la ré-authentification OAuth web : oui ou non ? (non par défaut chez moi)
Utiliser le mode strict pour les URL de redirection ;: oui ou non ? (oui par défaut chez moi)
