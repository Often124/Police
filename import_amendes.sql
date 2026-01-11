-- SCRIPT D'IMPORTATION DES AMENDES
-- Exécutez ce script dans l'éditeur SQL de Supabase pour importer toutes les amendes du CSV

-- D'abord, videz la table amendes existante (optionnel)
-- DELETE FROM amendes;

-- Ensuite, insérez toutes les amendes :

INSERT INTO amendes (infraction, montant, recidive, retrait_points, prison, immobilisation, fourriere, categorie) VALUES
-- INFRACTIONS ROUTIÈRES
('Klaxon abusif', '35€', 'Non applicable', 'Aucun', 'Aucune', 'Non', 'Non', 'Infractions routières'),
('Délit de fuite', '2 500€', '15 000€ + 15 minutes', '6', '12 minutes', 'Non', 'Non', 'Infractions routières'),
('Refus de se soumettre', '1 500€', '6 000€ + 3 minutes', 'Aucun', '7 minutes', 'Non', 'Non', 'Infractions routières'),
('Refus d''obtempérer', '3 500€', '12 000€ + 6 minutes', '6', '2 minutes', '48h', 'Non', 'Infractions routières'),
('Conduite sans permis', '6 500€', '16 000€ + 19 minutes', 'Aucun', '5 minutes', '2h', 'Non', 'Infractions routières'),
('Entrave ou gêne à la circulation', '135€', '3 000€ + 8 minutes', '3', 'Aucune', '24h', 'Non', 'Infractions routières'),
('Arrêt ou stationnement dangereux', '135€', '750€ + 6 points', '2', 'Aucune', 'Non', 'Non', 'Infractions routières'),
('Arrêt ou stationnement gênant sur voie de bus', '135€', '750€ + 6 points', 'Aucun', 'Aucune', 'Non', 'Non', 'Infractions routières'),
('Excès de vitesse de 1 à 19 km/h (≤50 km/h)', '135€', '750€', '1', 'Aucune', 'Non', 'Non', 'Infractions routières'),
('Excès de vitesse de 20 à 29 km/h (≤50 km/h)', '135€', '750€', '2', 'Aucune', 'Non', 'Non', 'Infractions routières'),
('Excès de vitesse de 30 à 39 km/h (≤50 km/h)', '135€', '750€', '3', 'Aucune', 'Non', 'Non', 'Infractions routières'),
('Excès de vitesse de 40 à 49 km/h (≤50 km/h)', '135€', '750€', '6', 'Aucune', '24h', 'Non', 'Infractions routières'),
('Excès de vitesse supérieur ou égal à 50 km/h', '500€', '2 000€', 'Suppression du permis', '10 minutes', '24h', 'Non', 'Infractions routières'),
('Vitesse excessive constatée à l''oeil nu', '135€', 'Non applicable', 'Aucun', 'Aucune', 'Non', 'Non', 'Infractions routières'),
('Conduite sans phares', '90€', '135€ + 4 points', '1', 'Aucune', 'Non', 'Non', 'Infractions routières'),
('Non respect de la priorité', '135€', '750€ + 3 points', '2', 'Aucune', 'Non', 'Non', 'Infractions routières'),
('Non-respect du stop', '135€', '750€ + 4 points', '3', 'Aucune', 'Non', 'Non', 'Infractions routières'),
('Circulation en sens interdit', '135€', '750€ + 4 points', '2', 'Aucune', 'Non', 'Non', 'Infractions routières'),
('Marche arrière ou demi-tour non autorisé', '135€', '750€ + 5 points', '3', 'Aucune', 'Non', 'Non', 'Infractions routières'),
('Non respect des distances de sécurité', '135€', '750€ + 5 points', '4', 'Aucune', 'Non', 'Non', 'Infractions routières'),
('Dépassements dangereux', '135€', '750€ + 5 points', '4', 'Aucune', 'Non', 'Non', 'Infractions routières'),
('Accélération par conducteur sur le point d''être dépassé', '135€', '750€ + 4 points', '2', 'Aucune', 'Non', 'Non', 'Infractions routières'),
('Changement de direction sans avertir (sans clignotant)', '35€', '135€ + 4 points', '2', 'Aucune', 'Non', 'Non', 'Infractions routières'),
('Arrêt ou stationnement gênant ou abusif', '35€', '135€', 'Aucun', 'Aucune', 'Non', 'Non', 'Infractions routières'),
('Vol de véhicule', '1 500€', '50 000€', 'Aucun', '15 minutes', 'Non', 'Non', 'Infractions routières'),
('Stationnement gênant', '135€', 'Non applicable', 'Aucun', 'Aucune', 'Non', 'Non', 'Infractions routières'),
('Conduite dangereuse', '90€', '135€', '2', 'Aucune', 'Non', 'Non', 'Infractions routières'),
('Non port du masque', '135€', 'Non applicable', 'Aucun', 'Aucune', 'Non', 'Non', 'Infractions routières'),
('Déchets déposés par terre', '135€', 'Non applicable', 'Aucun', 'Aucune', 'Non', 'Non', 'Infractions routières'),
('Conduite sans plaque d''immatriculation', '135€', 'Non applicable', 'Aucun', 'Aucune', '24h', 'Non', 'Infractions routières'),
('Non respect du feu tricolore', '135€', 'Non applicable', '2', 'Aucune', 'Non', 'Non', 'Infractions routières'),
('Conduite lors de la suspension de permis', '3 500€', 'Non applicable', 'Aucun', '3 minutes', '24h', 'Non', 'Infractions routières'),
('Utilisation du téléphone au volant', '135€', 'Non applicable', '2', 'Aucune', 'Non', 'Non', 'Infractions routières'),

-- CRIMES ET DÉLITS
('Vol par pickpockets', '1 500€', '15 000€ + 45 minutes', 'Aucun', '15 minutes', 'Non', 'Non', 'Crimes et délits'),
('Entreprise non déclarée', '4 000€', 'Non applicable', 'Aucun', '3 minutes', 'Non', 'Non', 'Crimes et délits'),
('Canular téléphonique aux forces de l''ordre', '900€', '3 000€ + 18 minutes', 'Aucun', '2 minutes', 'Non', 'Non', 'Crimes et délits'),
('Intrusion dans propriété privée', '725€', '2 550€ + 5 minutes', 'Aucun', 'Aucune', 'Non', 'Non', 'Crimes et délits'),
('Outrage à rebellion', '35 500€', '80 000€', 'Aucun', '10 minutes', 'Non', 'Non', 'Crimes et délits'),
('Menace envers agent', '1 800€', '4 500€ + 12 minutes', 'Aucun', '6 minutes', 'Non', 'Non', 'Crimes et délits'),
('Mise en danger d''autrui', '2 000€', '4 000€ + 14 minutes', 'Aucun', '7 minutes', 'Non', 'Non', 'Crimes et délits'),
('Usurpation d''identité', '1 800€', '3 700€ + 18 minutes', 'Aucun', '8 minutes', 'Non', 'Non', 'Crimes et délits'),
('Vol', '2 450€', '5 250€ + 16 minutes', 'Aucun', '7 minutes', 'Non', 'Non', 'Crimes et délits'),
('Harcèlement', '1 700€', '7 550€ + 14 minutes', 'Aucun', '10 minutes', 'Non', 'Non', 'Crimes et délits'),
('Escroquerie', '4 750€', '22 500€ + 25 minutes', 'Aucun', '8 minutes', 'Non', 'Non', 'Crimes et délits'),
('Tentative de corruption', '6 000€', '28 000€ + 25 minutes', 'Aucun', '6 minutes', 'Non', 'Non', 'Crimes et délits'),
('Usurpation de fonctions', '4 500€', '18 000€ + 28 minutes', 'Aucun', '9 minutes', 'Non', 'Non', 'Crimes et délits'),
('Séquestration', '7 000€', '17 000€ + 12 minutes', 'Aucun', '6 minutes', 'Non', 'Non', 'Crimes et délits'),
('Coups et blessures volontaires', '2 500€', '28 000€ + 45 minutes', 'Aucun', '15 minutes', 'Non', 'Non', 'Crimes et délits'),
('Agression', '9 000€', '13 000€ + 20 minutes', 'Aucun', '15 minutes', 'Non', 'Non', 'Crimes et délits'),
('Tentative de prise d''otage', '8 000€ /otage', '25 000€ /otage', 'Aucun', '4 minutes', 'Non', 'Non', 'Crimes et délits'),
('Prise d''otage', '5 000€ /otage', '25 000€ /otage', 'Aucun', '35 minutes', 'Non', 'Non', 'Crimes et délits'),
('Homicide volontaire', '10 000€ /pers', '50 000€ /pers', 'Aucun', '10 minutes /pers', 'Non', 'Non', 'Crimes et délits'),
('Assassinat suite à un contrat', '13 000€', '66 000€ + 120 minutes', 'Aucun', '20 minutes', 'Non', 'Non', 'Crimes et délits'),
('Menace de mort', '1 000€', '48 000€', 'Aucun', '17 minutes', 'Non', 'Non', 'Crimes et délits'),
('Diffamation publique', '2 500€', '60 000€', 'Aucun', '30 minutes', 'Non', 'Non', 'Crimes et délits'),
('Détention de gilet de police', '1 500€', 'Non applicable', 'Aucun', '2 minutes', 'Non', 'Non', 'Crimes et délits'),
('Prise d''un quartier', '7 500€', '200 000€ + 120 minutes', 'Aucun', '18 minutes', 'Non', 'Non', 'Crimes et délits'),
('Entrave à la justice', '2 500€', '9 000€ + 20 minutes', 'Suppression du permis', '8 minutes', 'Non', 'Non', 'Crimes et délits'),
('Manifestation illégale', '2 500€', 'Non applicable', 'Aucun', '6 minutes', 'Non', 'Non', 'Crimes et délits'),
('Manifestation < 10 membres', '1 000€ /pers', '6 000€ /pers', 'Aucun', 'Aucune', 'Non', 'Non', 'Crimes et délits'),
('Manifestation > 10 membres', '2 000€ /pers', '14 000€ /pers', 'Aucun', 'Aucune', 'Non', 'Non', 'Crimes et délits'),

-- ARMES
('Possession d''un pistolet', '40 000€', '120 000€ + 100 minutes', 'Aucun', '10 minutes', 'Non', 'Non', 'Armes'),
('Détention d''un tazer', '37 000€', '74 000€ + 80 minutes', 'Aucun', '10 minutes', 'Non', 'Non', 'Armes'),
('Tir à l''arme létale', '1 000€ /tir', '250 000€ + 45 minutes', 'Aucun', '13 minutes', 'Non', 'Non', 'Armes'),

-- STUPÉFIANTS
('Possession de graine de cannabis', '200€ /graine', '20 minutes', 'Aucun', '15 minutes', 'Non', 'Non', 'Stupéfiants'),
('Possession de feuille de cannabis', '35€ /feuille', '35 minutes', 'Aucun', '25 minutes', 'Non', 'Non', 'Stupéfiants');
