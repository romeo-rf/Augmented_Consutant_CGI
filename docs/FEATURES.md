# Spécifications Fonctionnelles — Consultant Augmenté CGI

## Périmètre
POC centré sur la **préparation de RDV de prospection** pour les consultants CGI.

---

## F1 — Chat intelligent (collecte de contexte)

### Description
Le consultant décrit son prochain RDV en langage naturel. L'IA analyse son message, extrait les informations utiles, et pose des questions ciblées pour compléter le contexte.

### Champs extraits
| Champ | Exemple | Obligatoire |
|---|---|---|
| Nom de l'entreprise | "Bouygues Telecom" | Oui |
| Secteur | "Télécommunications" | Oui (auto-détecté si possible) |
| Nom de l'interlocuteur | "Jean Dupont" | Non |
| Poste de l'interlocuteur | "DSI" | Non |
| Type de RDV | "Prospection" | Oui (défaut : prospection) |
| Offre CGI visée | "Migration cloud" | Non |
| Contexte additionnel | "Ils ont un legacy SAP vieillissant" | Non |

### Comportement
1. Le consultant envoie un message libre
2. L'IA extrait ce qu'elle peut (tool `extractMeetingContext`)
3. Si des champs obligatoires manquent → l'IA pose UNE question ciblée
4. L'IA ne pose qu'une question à la fois pour ne pas surcharger
5. Quand le contexte est suffisant (entreprise + secteur + type de RDV) → déclenche la recherche

### Critères d'acceptation
- [ ] L'IA extrait correctement le nom d'entreprise et le secteur
- [ ] L'IA pose des questions pertinentes sur les champs manquants
- [ ] L'IA ne pose pas de question sur un champ déjà fourni
- [ ] La recherche se déclenche automatiquement quand le contexte minimal est atteint

### Exemple de conversation
```
Consultant : "J'ai un RDV mardi avec Carrefour pour leur parler de cybersécurité"

IA : "Parfait ! Je note un RDV de prospection avec Carrefour autour de la cybersécurité.
     Savez-vous qui sera votre interlocuteur ? (nom et poste)"

Consultant : "Le RSSI, Marc Lefebvre"

IA : "Merci ! Je lance les recherches sur Carrefour et le profil de Marc Lefebvre..."
[Recherche se déclenche automatiquement]
```

---

## F2 — Recherche web automatique (avec sources)

### Description
Une fois le contexte suffisant, l'IA lance automatiquement des recherches web via Tavily pour collecter des informations sur le client, l'interlocuteur et le secteur.

### Recherches effectuées
| Catégorie | Exemple de requête | Quand |
|---|---|---|
| Entreprise | "Carrefour chiffres clés stratégie digitale 2026" | Toujours |
| Actualités | "Carrefour actualités récentes transformation" | Toujours |
| Interlocuteur | "Marc Lefebvre RSSI Carrefour" | Si nom fourni |
| Secteur | "enjeux cybersécurité grande distribution 2026" | Toujours |
| Concurrents IT | "Carrefour prestataires IT partenaires technologiques" | Toujours |

### Comportement
1. 3 à 5 requêtes Tavily lancées en parallèle
2. Chaque résultat inclut : titre, URL source, contenu extrait
3. Les résultats sont agrégés puis transmis au LLM pour synthèse
4. Le consultant voit un message "Recherche en cours..." pendant le traitement

### Critères d'acceptation
- [ ] Les recherches se lancent automatiquement après collecte du contexte
- [ ] Chaque information affichée a une source cliquable
- [ ] Les recherches sont pertinentes par rapport au contexte
- [ ] Pas de recherche lancée avec des champs vides/null

---

## F3a — Radar Client

### Description
Fiche d'identité synthétique de l'entreprise cible.

### Contenu
- **Carte d'identité** : nom, secteur, taille (PME/ETI/Grand Groupe), CA, siège
- **Actualités récentes** : 3-5 actualités des 6 derniers mois avec date et source
- **Faits marquants** : éléments stratégiques (acquisitions, partenariats, transformation digitale)
- **Chaque élément a sa source URL**

### Critères d'acceptation
- [ ] Les infos entreprise sont correctes et sourcées
- [ ] Les actualités sont récentes (< 6 mois)
- [ ] Le consultant identifie rapidement le profil de l'entreprise
- [ ] Les sources sont cliquables et mènent vers la bonne page

---

## F3b — Profil Interlocuteur

### Description
Fiche dédiée à la personne que le consultant va rencontrer.

### Contenu
- **Identité** : nom, poste, ancienneté estimée
- **Parcours** : expériences précédentes si disponibles publiquement
- **Centres d'intérêt probables** : déduits du poste et du contexte
- **Conseils d'approche** : comment adapter son discours au profil
  - Exemple : "Un RSSI sera sensible aux arguments conformité et gestion des risques"

### Critères d'acceptation
- [ ] Le profil est basé sur des infos publiques (pas d'invention)
- [ ] Les conseils d'approche sont pertinents par rapport au poste
- [ ] Si aucune info trouvée → le dire honnêtement, ne pas inventer

---

## F3c — Mapping Enjeux → Offres CGI

### Description
Croisement intelligent entre les enjeux détectés chez le client et le catalogue d'offres CGI.

### Contenu
- **Enjeux détectés** : problématiques identifiées via la recherche web et le contexte
- **Offre CGI recommandée** : pour chaque enjeu, l'offre CGI la plus pertinente
- **Raisonnement** : pourquoi cette offre répond à cet enjeu
- **Score de pertinence** : 1 à 5 étoiles

### Critères d'acceptation
- [ ] Au moins 2-3 matchings enjeux/offres proposés
- [ ] Le raisonnement est clair et convaincant
- [ ] Les offres recommandées viennent bien du catalogue CGI
- [ ] Le consultant comprend pourquoi pitcher cette offre

---

## F3d — Trame de Questions Intelligente

### Description
Liste de questions structurées pour guider le RDV de prospection.

### Contenu
- **Questions groupées par phase** :
  1. **Ouverture** (2-3 questions) : briser la glace, comprendre le contexte global
  2. **Découverte** (4-5 questions) : explorer les besoins, douleurs, projets
  3. **Approfondissement** (3-4 questions) : creuser les sujets clés identifiés
  4. **Conclusion** (2-3 questions) : prochaines étapes, décideurs, calendrier
- **Chaque question a une intention** : "Cette question vise à comprendre leur maturité cloud"
- **Le consultant peut** : réordonner (drag & drop), supprimer, ajouter ses propres questions

### Critères d'acceptation
- [ ] 12-15 questions générées au total
- [ ] Questions adaptées au secteur et au contexte
- [ ] Chaque question a une intention claire
- [ ] Le drag & drop fonctionne pour réordonner
- [ ] On peut supprimer et ajouter des questions

---

## F3e — Alertes & Points d'Attention

### Description
Les pièges à éviter et les éléments à connaître avant le RDV.

### Contenu
- **Sujets sensibles** : plan social, bad buzz, litige récent
- **Concurrents en place** : quels prestataires IT sont déjà chez le client
- **Objections probables** : et comment y répondre
- **Opportunités** : éléments favorables détectés

### Types d'alertes
| Type | Couleur | Exemple |
|---|---|---|
| Sensible | Rouge | "Plan de licenciement annoncé en janvier" |
| Concurrent | Orange | "Accenture a un contrat cadre avec Carrefour" |
| Objection | Jaune | "Risque d'objection sur le coût — préparer un argument ROI" |
| Opportunité | Vert | "Appel d'offres cloud en cours — timing idéal" |

### Critères d'acceptation
- [ ] Les alertes sont basées sur des faits sourcés
- [ ] La sévérité est correctement assignée
- [ ] Les suggestions de réponse aux objections sont utiles
- [ ] Pas de faux positifs alarmistes

---

## F4 — Chat d'affinage

### Description
Après la génération du brief, le consultant peut continuer la conversation pour affiner ou approfondir n'importe quelle section.

### Comportement
- Le consultant pose une question ou donne une instruction
- L'IA détermine quelle(s) section(s) sont concernées
- Si nécessaire, l'IA lance de nouvelles recherches ciblées
- Les sections concernées sont mises à jour en temps réel

### Exemples
```
"Creuse les enjeux cybersécurité dans le retail"
→ Nouvelle recherche Tavily ciblée → MAJ F3a (Radar) + F3e (Alertes)

"Ajoute des questions sur leur budget IT"
→ MAJ F3d (Questions) avec 2-3 nouvelles questions

"Reformule les conseils d'approche pour un profil plus technique"
→ MAJ F3b (Profil) avec un ton adapté

"Quels sont les derniers contrats de Capgemini avec Carrefour ?"
→ Recherche ciblée → réponse dans le chat + MAJ F3e si pertinent
```

### Critères d'acceptation
- [ ] Le chat reste fonctionnel après la génération du brief
- [ ] Les sections se mettent à jour visuellement
- [ ] L'IA sait cibler la bonne section
- [ ] Les nouvelles recherches sont pertinentes

---

## F5 — Catalogue CGI (données simulées)

### Description
Base locale d'offres CGI utilisée pour le matching (F3c).

### Structure d'une offre
```json
{
  "id": "cloud-migration",
  "name": "Migration Cloud & Modernisation",
  "description": "Accompagnement de bout en bout dans la migration vers le cloud...",
  "targetSectors": ["banque", "assurance", "retail", "industrie"],
  "keywords": ["cloud", "migration", "AWS", "Azure", "modernisation", "legacy"],
  "valueProposition": "Réduction de 30% des coûts d'infrastructure..."
}
```

### Offres à simuler (15-20)
- Transformation digitale
- Cybersécurité & conformité
- Migration cloud
- Data & IA
- ERP / SAP
- Conseil en management
- Développement applicatif
- Intégration de systèmes
- DevOps & automatisation
- Expérience client digital
- IoT & industrie 4.0
- Blockchain & traçabilité
- RH & conduite du changement
- Infrastructure & réseaux
- GreenIT & sobriété numérique

---

## Parcours utilisateur complet

```
1. Consultant ouvre l'app
2. Voit un message d'accueil + suggestions de prompts
3. Tape : "J'ai un RDV avec le DSI de Carrefour pour du cyber"
4. L'IA extrait : Carrefour, DSI, cybersécurité
5. L'IA demande : "Connaissez-vous le nom de votre interlocuteur ?"
6. Consultant : "Marc Lefebvre"
7. L'IA lance les recherches (indicateur visuel)
8. Le brief se remplit section par section dans le panneau droit
9. Le consultant explore les onglets (Radar, Profil, Offres, Questions, Alertes)
10. Il tape : "Ajoute des questions sur le budget"
11. L'onglet Questions se met à jour
12. Il réordonne les questions par drag & drop
13. Il est prêt pour son RDV
```
