import { supabaseConfig } from './config.js';
import { createClient } from '@supabase/supabase-js';

// Initialiseer Supabase client
const supabase = createClient(supabaseConfig.url, supabaseConfig.key);

// Luister naar form submit
document.getElementById('evaluationForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Verzamel alle data
    const formData = {
        evaluator_name: document.getElementById('evaluatorName').value,
        team_name: document.getElementById('teamSelect').value,
        concept_score: parseInt(document.querySelector('input[name="concept"]:checked').value),
        target_score: parseInt(document.querySelector('input[name="target"]:checked').value),
        gameplay_score: parseInt(document.querySelector('input[name="gameplay"]:checked').value),
        unique_score: parseInt(document.querySelector('input[name="unique"]:checked').value),
        technical_score: parseInt(document.querySelector('input[name="technical"]:checked').value),
        challenge_score: parseInt(document.querySelector('input[name="challenge"]:checked').value),
        rewards_score: parseInt(document.querySelector('input[name="rewards"]:checked').value)
    };

    try {
        // Verstuur data naar Supabase
        const { data, error } = await supabase
            .from('evaluations')
            .insert([formData]);

        if (error) throw error;

        alert('Beoordeling succesvol opgeslagen!');
        document.getElementById('evaluationForm').reset();
    } catch (error) {
        alert('Er is een fout opgetreden: ' + error.message);
    }
}); 