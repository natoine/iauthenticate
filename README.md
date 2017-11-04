# iauthenticate
un projet pour faire du passport js

Configurer l'envoi de mails, éditer le fichier config/mailer.js et mettre les bonnes informations


Comme le projet inclus des fichiers avec des infos sensibles ( app id et secret, mdp mail ...) petit rappel de commandes git utiles :
* pour ne plus suivre les évolutions d'un fichier ( ne pas risquer de pousser son fichier de config/auth.js par exemple )
git update-index --skip-worktree config/auth.js

* pour lister les fichiers que l'on ne suit plus :
git ls-files -v . | grep ^S

* pour se remettre à suivre un fichier ( pas exemple le config/auth.js parce que le repo distant l'a update)
git update-index --no-skip-worktree config/auth.js