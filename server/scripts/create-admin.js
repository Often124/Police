const supabase = require('../db/supabase');
const bcrypt = require('bcryptjs');

/**
 * Crée un nouvel utilisateur administrateur dans la base de données.
 * 
 * Usage: node server/scripts/create-admin.js <username> <password> <nom> <prenom> <matricule> [grade]
 */

async function createAdmin(username, password, nom, prenom, matricule, grade = 'Commissaire') {
    if (!username || !password || !nom || !prenom || !matricule) {
        console.error('Usage: node server/scripts/create-admin.js <username> <password> <nom> <prenom> <matricule> [grade]');
        process.exit(1);
    }

    console.log(`🚀 Création du compte admin pour : ${username}...`);

    // Vérifier si l'utilisateur existe déjà
    const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();

    if (existingUser) {
        console.error(`❌ L'utilisateur "${username}" existe déjà.`);
        process.exit(1);
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const { data, error } = await supabase
        .from('users')
        .insert([{
            username,
            password: hashedPassword,
            nom,
            prenom,
            matricule,
            grade,
            role: 'admin'
        }])
        .select();

    if (error) {
        console.error('❌ Erreur lors de la création de l\'admin :', error.message);
        process.exit(1);
    } else {
        console.log('✅ Compte admin créé avec succès !');
        console.log('Détails :', JSON.stringify(data[0], null, 2));
        process.exit(0);
    }
}

// Récupération des arguments de la ligne de commande
const args = process.argv.slice(2);
createAdmin(...args);
