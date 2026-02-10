const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const supabase = require('../server/db/supabase');

const importCitizens = async () => {
    console.log('Importing citizens from Characters.csv...');
    const csvPath = path.join(__dirname, '../Characters.csv');

    if (!fs.existsSync(csvPath)) {
        console.error('Characters.csv not found!');
        return;
    }

    const fileContent = fs.readFileSync(csvPath, 'utf8');
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
        relax_column_count: true
    });

    let count = 0;
    for (const record of records) {
        // Map CSV fields to table columns
        const citizen = {
            id: record.Id,
            firstname: record.Firstname,
            lastname: record.Lastname,
            birthdate: record.Birthday,
            gender: record.SexId === '0' ? 'Hommme' : 'Femme', // Assumption based on common conventions, can be adjusted
            phone_number: record.PhoneNumber,
            height: record.Height,
            nationality: 'Française' // Defaulting as it's likely not in CSV or implied
        };

        const { error } = await supabase
            .from('citizens')
            .upsert(citizen);

        if (error) {
            console.error(`Error importing citizen ${citizen.id}:`, error.message);
        } else {
            count++;
        }
    }
    console.log(`Successfully imported ${count} citizens.`);
};

const importVehicles = async () => {
    console.log('Importing vehicles from Vehicles.csv...');
    const csvPath = path.join(__dirname, '../Vehicles.csv');

    if (!fs.existsSync(csvPath)) {
        console.error('Vehicles.csv not found!');
        return;
    }

    const fileContent = fs.readFileSync(csvPath, 'utf8');
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
        relax_column_count: true
    });

    let count = 0;
    for (const record of records) {
        let ownerId = null;
        try {
            // Permissions field is a JSON string: "{\"owner\":{\"groupId\":0,\"characterId\":1},...}"
            if (record.Permissions) {
                const perms = JSON.parse(record.Permissions);
                if (perms.owner && perms.owner.characterId) {
                    ownerId = String(perms.owner.characterId);
                }
            }
        } catch (e) {
            console.warn(`Failed to parse permissions for vehicle ${record.Plate}:`, e.message);
        }

        if (!ownerId) {
            // If no owner found, maybe skip or insert without owner? 
            // SIV usually requires an owner. Let's try to link it if possible.
            // record.Permissions might be empty or valid JSON
        }

        const vehicle = {
            plate: record.Plate,
            owner: ownerId,
            model: `Model ${record.ModelId}`, // Fallback structure
            vehicle_hash: parseInt(record.ModelId) || 0,
            color: record.Color,
            state: record.IsStowed === '1' ? 'Garage' : 'Sorti'
        };

        const { error } = await supabase
            .from('vehicles')
            .upsert(vehicle);

        if (error) {
            console.error(`Error importing vehicle ${vehicle.plate}:`, error.message);
        } else {
            count++;
        }
    }
    console.log(`Successfully imported ${count} vehicles.`);
};

const run = async () => {
    await importCitizens();
    await importVehicles();
    process.exit();
};

run();
