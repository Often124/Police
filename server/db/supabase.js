const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://tdfshpcxexbokfayfsto.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_VCZFTlfAhlbcldTYK_RKMg_aJh-7vZZ';

if (!supabaseUrl || !supabaseKey) {
    console.error('⚠️ Supabase URL ou Key manquante !');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
