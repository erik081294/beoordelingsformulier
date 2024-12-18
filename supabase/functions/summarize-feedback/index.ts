// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

console.log("Hello from Functions!")

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Log request details
    console.log('Request method:', req.method)
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))

    // Parse request body
    let body
    try {
      body = await req.json()
      console.log('Request body:', body)
    } catch (e) {
      console.error('Failed to parse request body:', e)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          status: 'error' 
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          },
          status: 400
        }
      )
    }

    // Check for OpenAI API key
    const apiKey = Deno.env.get('OPENAI_APIKEY')
    console.log('API Key exists:', !!apiKey)
    if (!apiKey) {
      console.error('OPENAI_APIKEY is not configured')
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key is not configured',
          status: 'error' 
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          },
          status: 500
        }
      )
    }

    // Prepare feedback items
    const feedbackItems = body.feedbackItems
    if (!feedbackItems || !Array.isArray(feedbackItems)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid feedbackItems format',
          status: 'error' 
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          },
          status: 400
        }
      )
    }

    // Calculate average scores (on 1-5 scale)
    const averageScores = {
      concept_score: Math.round(feedbackItems.reduce((sum, item) => sum + (item.concept_score || 0), 0) / feedbackItems.length * 10) / 10,
      target_score: Math.round(feedbackItems.reduce((sum, item) => sum + (item.target_score || 0), 0) / feedbackItems.length * 10) / 10,
      gameplay_score: Math.round(feedbackItems.reduce((sum, item) => sum + (item.gameplay_score || 0), 0) / feedbackItems.length * 10) / 10,
      unique_score: Math.round(feedbackItems.reduce((sum, item) => sum + (item.unique_score || 0), 0) / feedbackItems.length * 10) / 10,
      technical_score: Math.round(feedbackItems.reduce((sum, item) => sum + (item.technical_score || 0), 0) / feedbackItems.length * 10) / 10,
      challenge_score: Math.round(feedbackItems.reduce((sum, item) => sum + (item.challenge_score || 0), 0) / feedbackItems.length * 10) / 10,
      rewards_score: Math.round(feedbackItems.reduce((sum, item) => sum + (item.rewards_score || 0), 0) / feedbackItems.length * 10) / 10
    };

    // Add score validation
    for (const [key, value] of Object.entries(averageScores)) {
      if (value < 1 || value > 5) {
        return new Response(
          JSON.stringify({ 
            error: `Invalid score for ${key}: ${value}. Scores must be between 1 and 5.`,
            status: 'error' 
          }),
          { 
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 400
          }
        )
      }
    }

    // Collect all comments
    const allComments = feedbackItems
      .map(item => item.comment)
      .filter(comment => comment && comment.trim() !== '')
      .join('\n\n---\n\n');

    const promptText = `
Gemiddelde scores (schaal 1-5):
- Spelconcept: ${averageScores.concept_score}/5
- Doelgroep: ${averageScores.target_score}/5
- Gameplay: ${averageScores.gameplay_score}/5
- Unieke twist: ${averageScores.unique_score}/5
- Technische haalbaarheid: ${averageScores.technical_score}/5
- Uitdagingen: ${averageScores.challenge_score}/5
- Beloningen: ${averageScores.rewards_score}/5

Alle feedback comments:
${allComments}`;

    console.log('Prompt being sent:', JSON.stringify(body, null, 2));

    console.log('Making OpenAI API request...')

    try {
      // Make direct API request to OpenAI
      const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "model": "gpt-4o",
          "messages": [
            {
              "role": "system",
              "content": "Je bent een vrolijke helper die gestructureerde feedback samenvat voor **één spelidee**. Gebruik ALLEEN de gegeven scores en feedback in je analyse - verzin geen extra informatie. Refereer specifiek naar de gegeven scores in je feedback.\n\n### **Conclusie**\n- **Wat moet erin:**\n  - Een samenvatting van **sterke punten** (wat maakt het idee goed en uniek?)\n  - Een samenvatting van **verbeterpunten** (wat heeft extra aandacht nodig?)\n  - Een **positieve afsluiting**, waarin je enthousiasme toont en motiverend afsluit.\n\n**Voorbeeld:**  \n\"Dit spelidee heeft een creatief en goed uitgewerkt concept met een unieke twist die spelers aantrekt. De doelgroep is duidelijk gedefinieerd en de gameplay biedt veel potentie voor plezier en uitdaging. Echter, de technische haalbaarheid lijkt ambitieus, en sommige gameplay-mechanieken vereisen verdere verfijning om soepel te werken. Met wat extra aandacht voor technische details kan dit een echt onvergetelijke ervaring worden! 🎮🚀\"\n\n### **Structuur Voor Feedback per Aspect:**\n\n- **Spelconcept:** {Feedback + Scores} \n- **Doelgroep:** {Feedback + Scores}  \n- **Gameplay:** {Feedback + Scores}  \n- **Unieke twist:** {Feedback + Scores}  \n- **Technische haalbaarheid:** {Feedback + Scores}  \n- **Uitdagingen:** {Feedback + Scores}  \n- **Beloningen:** {Feedback + Scores}  \n\nGebruik markdown, bullets en emoji's om het overzichtelijk te maken."
            },
            {
              "role": "user",
              content: `Analyseer de volgende feedback op **één spelidee** en de gegeven scores. Geef een volledige, motiverende conclusie zoals hierboven beschreven. Focus op de belangrijkste punten en trends in de scores. Geef daarna per aspect specifieke feedback. Gebruik markdown, bullets en emoji's.\n\n**Feedback:** ${promptText}`
            }
          ],
          "temperature": 0.0,
          "max_tokens": 2000
        })
      });

      console.log('OpenAI API response status:', openAiResponse.status);

      if (!openAiResponse.ok) {
        const errorData = await openAiResponse.json();
        console.error('OpenAI API error:', errorData);
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const completion = await openAiResponse.json();
      console.log('OpenAI API response:', completion);

      const summary = completion.choices[0].message?.content;
      if (!summary) {
        throw new Error('No summary generated');
      }

      return new Response(
        JSON.stringify({ 
          summary,
          status: 'success'
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          },
          status: 200
        }
      )
    } catch (error) {
      console.error("Fout bij het ophalen van OpenAI-reactie:", error);
      throw error;
    }
  } catch (error) {
    console.error('Error in function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        status: 'error',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        },
        status: 500
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/summarize-feedback' \
    --header 'Authorization: Bearer ' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
