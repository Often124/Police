const fs = require('fs');
const path = require('path');
const supabase = require('./supabase');

const CHARACTERS_FILE = path.join(__dirname, '../../Characters.csv');
const VEHICLES_FILE = path.join(__dirname, '../../Vehicles.csv');

// Robust CSV Parser handling multi-line fields
function parseCSV(content) {
    const rows = [];
    let currentRow = [];
    let curVal = '';
    let insideQuotes = false;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = content[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                curVal += '"';
                i++;
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (char === ',' && !insideQuotes) {
            currentRow.push(curVal);
            curVal = '';
        } else if ((char === '\r' || char === '\n') && !insideQuotes) {
            // Handle CRLF or LF
            if (char === '\r' && nextChar === '\n') i++;

            currentRow.push(curVal);
            if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== '')) {
                rows.push(currentRow);
            }
            currentRow = [];
            curVal = '';
        } else {
            curVal += char;
        }
    }
    if (currentRow.length > 0) {
        currentRow.push(curVal);
        rows.push(currentRow);
    }
    return rows;
}

const BATCH_SIZE = 50; // Smaller batch size to avoid payload limits

async function seedSIV() {
    console.log('Starting SIV Import...');

    const validCitizenIds = new Set();

    // 1. Import Citizens
    try {
        console.log('Reading Characters.csv...');
        const charsContent = fs.readFileSync(CHARACTERS_FILE, 'utf-8');
        const dataRows = parseCSV(charsContent);

        // Skip header
        const dataLines = dataRows.slice(1);

        console.log(`Found ${dataLines.length} characters to process.`);

        const citizens = [];

        for (const cols of dataLines) {
            if (cols.length < 10) continue;

            // Indices: Id:0, Firstname:2, Lastname:3, Birthday:9, Height:13, SexId:14, PhoneNumber:29
            // Fix ID length - some might be too long for index if not hashed, but let's try truncating or cleaning
            let id = cols[0];
            const firstname = cols[2];
            const lastname = cols[3];
            const birthdate = cols[9];
            const height = cols[13];
            const sexId = cols[14];
            const phoneNumber = cols[29] || ''; // Handle potential missing phone

            if (id.length > 50) {
                // Warn or skip if suspicious
                // console.warn('Truncating long ID:', id.substring(0, 20) + '...');
                id = id.substring(0, 50);
                // Or just proceed, the error was about index row size, meaning the ID is HUGE.
                // Inspecting one failure: 'IDFRASTANLEY...' might be the AccountId or something merged?
                // Let's clean it up if it looks weird.
            }

            citizens.push({
                id: id,
                firstname: firstname,
                lastname: lastname,
                birthdate: birthdate,
                height: height,
                gender: sexId === '1' ? 'F' : 'M',
                phone_number: phoneNumber
            });
        }

        console.log(`Prepared ${citizens.length} citizens for insert.`);

        // Populate validCitizenIds with all prepared citizen IDs initially
        citizens.forEach(c => validCitizenIds.add(c.id));

        // Chunk inserts
        for (let i = 0; i < citizens.length; i += BATCH_SIZE) {
            const batch = citizens.slice(i, i + BATCH_SIZE);
            const { error } = await supabase.from('citizens').upsert(batch);
            if (error) {
                console.error(`Error inserting citizens batch ${i}:`, error.message);
                // Try individual insert to isolate bad row if batch fails
                if (error.code === '54000') { // Index error
                    console.log('Retrying individually due to index error...');
                    for (const cit of batch) {
                        const { error: singleErr } = await supabase.from('citizens').upsert(cit);
                        if (singleErr) {
                            console.error(`Failed ID ${cit.id.substring(0, 10)}...`);
                            validCitizenIds.delete(cit.id); // Remove from valid list if insert failed
                        }
                    }
                }
            } else {
                console.log(`Inserted citizens ${i} to ${i + batch.length}`);
            }
        }

    } catch (err) {
        console.error('Error processing Characters.csv:', err);
    }

    // 2. Import Vehicles
    try {
        console.log('Reading Vehicles.csv...');
        const vehiclesContent = fs.readFileSync(VEHICLES_FILE, 'utf-8');
        const vDataRows = parseCSV(vehiclesContent);

        // Skip header
        const vDataLines = vDataRows.slice(1);

        console.log(`Found ${vDataLines.length} vehicles to process.`);

        const vehicles = [];

        for (const cols of vDataLines) {
            if (cols.length < 4) continue;

            // Indices: ModelId:1, Plate:2, Permissions:3, Color:7
            const modelId = cols[1];
            const plate = cols[2];
            const permissions = cols[3];
            const color = cols[7] || 'Unknown'; // Default color if missing

            let ownerId = null;
            try {
                // Determine if it's JSON or not.
                if (permissions.startsWith('{') || permissions.startsWith('"')) {
                    // It might be double quoted from CSV parser if inner quotes
                    let jsonStr = permissions;
                    // Fix double double quotes "" -> " if logical
                    // But our parser should have handled it.
                    // If permissions field has weird structure, try to regex the owner ID.
                    const match = permissions.match(/""characterId"":\s*(\d+)/) || permissions.match(/"characterId":\s*(\d+)/);
                    if (match) {
                        ownerId = match[1];
                    } else {
                        // Try standard parse
                        const permObj = JSON.parse(permissions);
                        if (permObj.owner && permObj.owner.characterId) {
                            ownerId = permObj.owner.characterId.toString();
                        }
                    }
                }
            } catch (e) {
                // console.warn(`Failed to parse permissions for plate ${plate}:`, e.message);
                // Fallback regex scan
                const match = permissions.match(/characterId["']?:\s*(\d+)/);
                if (match) ownerId = match[1];
            }

            if (ownerId) {
                // Check against valid citizens
                if (validCitizenIds.has(ownerId)) {
                    vehicles.push({
                        plate: plate,
                        model: modelId,
                        color: color,
                        owner: ownerId
                    });
                } else {
                    // console.warn(`Skipping vehicle ${plate}: Owner ${ownerId} not found.`);
                }
            }
        }

        console.log(`Prepared ${vehicles.length} vehicles for insert.`);

        // Chunk inserts
        for (let i = 0; i < vehicles.length; i += BATCH_SIZE) {
            const batch = vehicles.slice(i, i + BATCH_SIZE);
            const { error } = await supabase.from('vehicles').upsert(batch);
            if (error) console.error('Error inserting vehicles batch:', error.message);
            else console.log(`Inserted vehicles ${i} to ${i + batch.length}`);
        }

    } catch (err) {
        console.error('Error processing Vehicles.csv:', err);
    }

    console.log('Done.');
}

seedSIV();
