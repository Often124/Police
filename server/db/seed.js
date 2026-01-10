const { initDatabase, dbHelpers, saveDatabase } = require('./database');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function seed() {
    console.log('🔄 Initialisation de la base de données...');

    await initDatabase();
    const db = dbHelpers;

    // Créer l'utilisateur admin par défaut
    const existingAdmin = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');

    if (!existingAdmin) {
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        db.prepare(`
      INSERT INTO users (username, password, nom, prenom, matricule, grade, role)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('admin', hashedPassword, 'Système', 'Admin', 'PN-001', 'Commissaire', 'admin');
        console.log('✅ Utilisateur admin créé (login: admin / password: admin123)');
    } else {
        console.log('ℹ️ Utilisateur admin existe déjà');
    }

    // Importer les amendes depuis le CSV
    const csvPath = path.join(__dirname, '../../Amendes Police Nationale Nova-RP - Amendes.csv');

    if (!fs.existsSync(csvPath)) {
        console.log('⚠️ Fichier CSV non trouvé:', csvPath);
        return;
    }

    // Vérifier si des amendes existent déjà
    const count = db.prepare('SELECT COUNT(*) as count FROM amendes').get();
    if (count && count.count > 0) {
        console.log(`ℹ️ ${count.count} amendes existent déjà dans la base`);
        saveDatabase();
        console.log('🎉 Base de données initialisée avec succès!');
        return;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');

    let importedCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const columns = line.split(',');

        // Skip les lignes vides ou les en-têtes
        if (!columns[1] || columns[1].trim() === '' || columns[1].includes('Infraction')) {
            continue;
        }

        const infraction = columns[1]?.trim();
        const montant = columns[3]?.trim() || 'Non défini';
        const recidive = columns[4]?.trim() || 'Non applicable';
        const retraitPoints = columns[6]?.trim() || 'Aucun';
        const prison = columns[8]?.trim() || 'Aucune';
        const immobilisation = columns[10]?.trim() || 'Non';
        const fourriere = columns[11]?.trim() || 'Non';

        // Déterminer la catégorie basée sur le type d'infraction
        let categorie = 'Autres infractions';
        const inf = infraction.toLowerCase();

        if (inf.includes('vol') || inf.includes('homicide') || inf.includes('agression') ||
            inf.includes('otage') || inf.includes('arme') || inf.includes('pistolet') ||
            inf.includes('tazer') || inf.includes('assassinat') || inf.includes('séquestration') ||
            inf.includes('coup')) {
            categorie = 'Crimes et délits';
        } else if (inf.includes('cannabis') || inf.includes('drogue') || inf.includes('graine') ||
            inf.includes('feuille')) {
            categorie = 'Stupéfiants';
        } else if (inf.includes('vitesse') || inf.includes('permis') || inf.includes('feu') ||
            inf.includes('stop') || inf.includes('stationnement') || inf.includes('véhicule') ||
            inf.includes('conduite') || inf.includes('klaxon') || inf.includes('phare') ||
            inf.includes('clignotant') || inf.includes('dépassement') || inf.includes('circulation')) {
            categorie = 'Infractions routières';
        } else if (inf.includes('manifestation') || inf.includes('outrage') || inf.includes('rebellion') ||
            inf.includes('menace') || inf.includes('canular')) {
            categorie = 'Troubles à l\'ordre public';
        }

        if (infraction && infraction.length > 2) {
            try {
                db.prepare(`
          INSERT INTO amendes (infraction, montant, recidive, retrait_points, prison, immobilisation, fourriere, categorie)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
                    infraction,
                    montant.replace('///', 'Non défini'),
                    recidive.replace('///', 'Non applicable'),
                    retraitPoints.replace('///', 'Aucun'),
                    prison.replace('///', 'Aucune'),
                    immobilisation.replace('///', 'Non'),
                    fourriere.replace('///', 'Non'),
                    categorie
                );
                importedCount++;
            } catch (err) {
                // Ignorer les erreurs
            }
        }
    }

    saveDatabase();
    console.log(`✅ ${importedCount} amendes importées depuis le CSV`);
    console.log('🎉 Base de données initialisée avec succès!');
}

seed().catch(console.error);
