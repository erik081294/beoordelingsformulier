import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('evaluationForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            evaluator_name: document.getElementById('evaluatorName').value,
            team_name: document.getElementById('teamSelect').value,
            concept_score: parseInt(document.querySelector('input[name="concept"]:checked').value),
            target_score: parseInt(document.querySelector('input[name="target"]:checked').value),
            gameplay_score: parseInt(document.querySelector('input[name="gameplay"]:checked').value),
            unique_score: parseInt(document.querySelector('input[name="unique"]:checked').value),
            technical_score: parseInt(document.querySelector('input[name="technical"]:checked').value),
            challenge_score: parseInt(document.querySelector('input[name="challenge"]:checked').value),
            rewards_score: parseInt(document.querySelector('input[name="rewards"]:checked').value),
            comment: document.getElementById('comment').value,
            created_at: new Date().toISOString()
        };

        try {
            const { data, error } = await supabase
                .from('evaluations')
                .insert([formData]);

            if (error) throw error;
            
            alert('Beoordeling succesvol verstuurd!');
            form.reset();
        } catch (error) {
            console.error('Error:', error);
            alert('Er is een fout opgetreden bij het versturen van de beoordeling.');
        }
    });
}); 