const supabase = require('./supabase');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function seed() {
    console.log('🔄 Initialisation de la base de données Supabase...');

    // 1. Créer l'utilisateur admin
    const { data: existingAdmin, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('username', 'admin')
        .single();

    if (!existingAdmin) {
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        const { error: insertError } = await supabase
            .from('users')
            .insert([{
                username: 'admin',
                password: hashedPassword,
                nom: 'Système',
                prenom: 'Admin',
                matricule: 'PN-001',
                grade: 'Commissaire',
                role: 'admin'
            }]);

        if (insertError) {
            console.error('❌ Erreur création admin:', insertError.message);
        } else {
            console.log('✅ Utilisateur admin créé (login: admin / password: admin123)');
        }
    } else {
        console.log('ℹ️ Utilisateur admin existe déjà');
    }

    // 2. Importer les amendes
    const csvPath = path.join(__dirname, '../../Amendes Police Nationale Nova-RP - Amendes.csv');

    if (!fs.existsSync(csvPath)) {
        console.log('⚠️ Fichier CSV non trouvé:', csvPath);
        return;
    }

    // Vérifier si des amendes existent déjà
    const { count, error: countError } = await supabase
        .from('amendes')
        .select('*', { count: 'exact', head: true });

    if (count > 0) {
        console.log(`ℹ️ ${count} amendes existent déjà dans la base`);
        return;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');

    let importedCount = 0;
    const amendesToInsert = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const columns = line.split(',');

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

        let categorie = 'Autres infractions';
        const inf = infraction.toLowerCase();

        // Logique de catégorie simplifiée
        if (inf.includes('vol') || inf.includes('homicide') || inf.includes('agression') || inf.includes('otage')) categorie = 'Crimes et délits';
        else if (inf.includes('cannabis') || inf.includes('drogue')) categorie = 'Stupéfiants';
        else if (inf.includes('vitesse') || inf.includes('permis') || inf.includes('feu')) categorie = 'Infractions routières';
        else if (inf.includes('manifestation') || inf.includes('outrage')) categorie = 'Troubles à l\'ordre public';

        if (infraction && infraction.length > 2) {
            amendesToInsert.push({
                infraction,
                montant: montant.replace('///', 'Non défini'),
                recidive: recidive.replace('///', 'Non applicable'),
                retrait_points: retraitPoints.replace('///', 'Aucun'),
                prison: prison.replace('///', 'Aucune'),
                immobilisation: immobilisation.replace('///', 'Non'),
                fourriere: fourriere.replace('///', 'Non'),
                categorie
            });
            importedCount++;
        }
    }

    if (amendesToInsert.length > 0) {
        const { error: batchError } = await supabase.from('amendes').insert(amendesToInsert);
        if (batchError) {
            console.error('❌ Erreur import amendes:', batchError.message);
        } else {
            console.log(`✅ ${importedCount} amendes importées depuis le CSV`);
        }
    }

    console.log('🎉 Initialisation Supabase terminée!');
}

seed().catch(console.error);
