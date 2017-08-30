# iauthenticate
un projet pour faire du passport js

Pour authentification avec Google :
Il faut aller sur leur API cloud 
https://cloud.google.com/

console > créer un nouveau projet
le nommer

Sélectionner votre projet
Choisir API et services
identifiants > créer des identifiants > ID client Oauth
Si vous ne l'avez pas déjà fait, il vous est demandé de remplir les informations de l'écran d'authorisation OAuth

URL de la page d'acceuil tant que dev local http://127.0.0.1:8080 

Sélectionnez comme type d'application : application Web
Origines javascript autorisé : http://127.0.0.1:8080
URI de redirection autorisée : http://127.0.0.1:8080/auth/google/callback