<p align="center">
  <a href="https://journione.ai/"><img src="assets/journione-lockup.svg" alt="JourniOne" width="360"></a>
</p>

# JourniOne · Travel Journal Creator

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [Español](README.es.md) · [한국어](README.ko.md) · **[Français](README.fr.md)** · [العربية](README.ar.md)

**Transformez les lieux qui vous font rêver en un voyage que vous pouvez vraiment faire.**

[Site officiel](https://journione.ai/) · [Installation](INSTALL.md) · [Exemples](EXAMPLES.md) · [Questions fréquentes](FAQ.md)

Partez d'une idée de voyage. JourniOne vous aide à organiser chaque journée, à trouver des hôtels adaptés à votre parcours et à votre budget, puis à réunir le tout dans un **Travel Journal : un guide de voyage interactif**, élégant, à explorer et à partager comme un carnet que l'on feuillette. Passez moins de temps à rassembler des conseils, découvrez mieux votre destination et profitez davantage de votre budget.

![Couvertures de guides pour Tokyo, Pékin, la Gold Coast, les Maldives et d'autres destinations](assets/readme/journione-travel-journal-covers.png)

## D'une idée à un itinéraire que l'on peut suivre

Dites à JourniOne où vous souhaitez aller, ce que vous aimez et avec qui vous partez, ou transmettez-lui un itinéraire, des photos et des notes. Il organise les journées selon vos envies et votre rythme, vérifie les lieux et transports essentiels, et équilibre visites, repas, déplacements et repos.

![Fonctions de préparation : sources, hôtels, vols et contenu de voyage à explorer](assets/readme/journione-planning-features.png)

Une fois confirmé, votre programme devient un guide visuel dont vous pouvez explorer les détails comme dans un carnet de voyage. La **vue Journal** présente les images, les textes et les journées ; la **vue Map** montre les lieux et les parcours. Ouvrez un lieu pour en savoir plus. Découvrez la destination avant le départ, puis consultez la suite du programme pendant le voyage.

![Vue Map d'un voyage dans l'ouest du Sichuan, à côté de l'itinéraire quotidien](assets/readme/journione-map-itinerary.png)

*Repérez les lieux sur la carte et consultez en parallèle les activités et les transports de chaque journée.*

Vous pouvez préparer le parcours avant de fixer les dates ou de réserver hôtels et vols. Ajustez-le à tout moment, puis dites : « Crée le guide à partir de cette version. »

## Comparez les tarifs et réservez l'hébergement adapté

Grâce au **service TourMind de recherche et de réservation d'hôtels**, JourniOne consulte des tarifs agrégés provenant de plus de 100 canaux hôteliers dans le monde, dont Ctrip, Fliggy, Meituan, Tongcheng, Qunar, Agoda, Expedia et Booking.com. Il compare les prix en temps réel des canaux accessibles en tenant compte de votre itinéraire, de vos préférences et de votre budget.

La comparaison porte aussi sur le type de chambre, les repas, les taxes, l'annulation et la disponibilité. Les recommandations expliquent pourquoi l'hôtel vous convient, le montant total et les points à vérifier avant de réserver. Les canaux couverts, les prix et les stocks dépendent des résultats de chaque recherche.

Après avoir choisi un hôtel, vous pouvez poursuivre la réservation via un canal compatible. Vérifiez la chambre, le montant et les conditions, puis effectuez l'authentification et le paiement nécessaires ; le statut final dépend de la confirmation de réservation. La plateforme et le fournisseur concernés assurent la prestation selon les engagements convenus. Les modifications, annulations et demandes après-vente suivent les conditions de la chambre et de la commande choisies.

Si vous avez besoin de vols, JourniOne peut également les rechercher via **Kiwi.com** et relier horaires d'arrivée et de départ, transferts aéroport et hébergements au même itinéraire. Hôtels et vols sont recherchés uniquement selon vos besoins. Générer un guide ou retenir provisoirement une option ne passe aucune commande.

![Panneau Bookings présentant hôtels, vols et coûts à côté du guide du Sichuan](assets/readme/journione-hotel-flight-bookings.png)

*Hôtels et vols restent associés au même guide. Les prix et statuts de la capture servent uniquement à présenter l'interface.*

## Partagez vos idées de voyage

Envoyez le guide, les cartes d'itinéraire ou un lien à vos amis, ou publiez-les sur les réseaux sociaux. Chacun peut apprécier votre idée, comprendre le programme de chaque jour et situer les lieux : de quoi préparer le voyage ensemble ou en inspirer un autre.

![Guide illustré de l'ouest du Sichuan avec aperçu de la destination et temps forts](assets/readme/journione-journal-overview.png)

*Un guide visuel à explorer aide vos amis à comprendre le parcours et ses points forts.*

Les liens de voyage sont consultables sans connexion. Connectez-vous pour enregistrer votre propre carnet, continuer à le modifier et le partager depuis la page. Les parcours quotidiens Google Maps montrent les lieux dans l'ordre. Consultez la page pour le rendu réel des images et des cartes.

Avant de partager, retirez les informations personnelles, photos et contenus de documents que vous ne souhaitez pas rendre publics. Toute personne disposant du lien public peut éventuellement accéder à son contenu. Consultez [Confidentialité et partage](PRIVACY.md).

## Commencer

1. Importez [JourniOne-Planning-Skills](https://github.com/JourniOne-ai/JourniOne-Planning-Skills) depuis le gestionnaire de Skills de votre client, ou utilisez un paquet en suivant le [guide d'installation](INSTALL.md). Le nom affiché est **Travel Journal Creator**.
2. L'agent d'installation vérifie et prépare les dépendances obligatoires : **le Skill hôtelier TourMind** et **Kiwi MCP**. Il réutilise les capacités existantes et ne vous sollicite que si une autorisation, une action manuelle ou un rechargement est nécessaire. L'initialisation n'est terminée que lorsque le client peut détecter les deux.
3. Exprimez simplement votre besoin de voyage, sans saisir le nom du Skill. Découvrez les idées et les journées, ajustez-les, puis confirmez la création du guide. Recherchez et réservez les services selon vos besoins.

Créer un guide ne nécessite ni token JourniOne ni service MCP JourniOne local. La connexion par défaut utilise [journione.ai](https://journione.ai/). Les scripts fournis nécessitent Node.js 22 ou ultérieur ; le client doit prendre en charge la recherche web, la lecture de fichiers, les requêtes HTTPS et le MCP distant. L'authentification pour réserver un hôtel ou payer suit les règles du canal concerné. Voir les [dépendances](DEPENDENCIES.md).

## Essayez de dire

> Je veux passer quatre jours à Tokyo. J'aime le jazz et les balades dans les quartiers, mais pas un concert tous les soirs. Propose d'abord deux façons de voyager ; je fixerai les dates plus tard.

> Allège cet itinéraire à Kyoto, conserve les activités déjà réservées et cherche des hôtels bien desservis, avec annulation gratuite, adaptés au parcours.

> Compare le prix total et les conditions d'annulation des chambres actuellement disponibles dans ces hôtels. Recommande celle qui me convient le mieux, sans réserver pour l'instant.

> Crée le guide à partir de cette version. Je veux l'envoyer à mes amis pour regarder ensemble le programme de chaque jour.

D'autres situations figurent dans les [exemples](EXAMPLES.md).

## Version et aide

Version du paquet : **1.0.1**. La [liste de vérification du lancement](RELEASE-CHECKLIST.md) présente la préparation du paquet et les contrôles en ligne historiques. Les vérifications datées décrivent la situation à ce moment-là, et non l'état actuel du service. Les résultats de création, de recherche et de réservation dépendent des réponses des services concernés.

[Questions fréquentes](FAQ.md) · [Historique des versions](CHANGELOG.md) · [Dépendances](DEPENDENCIES.md) · [Instructions pour l'agent](SKILL.md)
