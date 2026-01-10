const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

let db = null;

// Chemin vers la base de données
const dataDir = path.join(__dirname, '../../data');
const dbPath = path.join(dataDir, 'intranet.db');

// Créer le dossier data s'il n'existe pas
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialiser la base de données
async function initDatabase() {
    if (db) return db;

    const SQL = await initSqlJs();

    // Charger la base existante ou en créer une nouvelle
    if (fs.existsSync(dbPath)) {
        const buffer = fs.readFileSync(dbPath);
        db = new SQL.Database(buffer);
    } else {
        db = new SQL.Database();
    }

    // Créer les tables
    db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      matricule TEXT UNIQUE NOT NULL,
      grade TEXT DEFAULT 'Gardien de la Paix',
      role TEXT DEFAULT 'agent',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS amendes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      infraction TEXT NOT NULL,
      montant TEXT,
      recidive TEXT,
      retrait_points TEXT,
      prison TEXT,
      immobilisation TEXT,
      fourriere TEXT,
      categorie TEXT DEFAULT 'Autre'
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS rapports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id INTEGER NOT NULL,
      citoyen_nom TEXT NOT NULL,
      citoyen_prenom TEXT NOT NULL,
      amende_id INTEGER,
      montant_applique TEXT,
      description TEXT,
      lieu TEXT,
      est_recidive INTEGER DEFAULT 0,
      date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
      statut TEXT DEFAULT 'En cours'
    )
  `);

    // Sauvegarder
    saveDatabase();

    return db;
}

// Sauvegarder la base sur disque
function saveDatabase() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
    }
}

// Wrapper pour les requêtes
function getDb() {
    return db;
}

// Helpers pour simuler l'API de better-sqlite3
const dbHelpers = {
    prepare: (sql) => ({
        run: (...params) => {
            db.run(sql, params);
            saveDatabase();
            return { lastInsertRowid: db.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0] };
        },
        get: (...params) => {
            const result = db.exec(sql, params);
            if (result.length === 0 || result[0].values.length === 0) return undefined;
            const columns = result[0].columns;
            const values = result[0].values[0];
            const obj = {};
            columns.forEach((col, i) => obj[col] = values[i]);
            return obj;
        },
        all: (...params) => {
            const result = db.exec(sql, params);
            if (result.length === 0) return [];
            const columns = result[0].columns;
            return result[0].values.map(row => {
                const obj = {};
                columns.forEach((col, i) => obj[col] = row[i]);
                return obj;
            });
        }
    }),
    exec: (sql) => {
        db.run(sql);
        saveDatabase();
    }
};

module.exports = { initDatabase, getDb, saveDatabase, dbHelpers };
