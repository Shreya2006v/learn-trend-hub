import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, interestArea, skillLevel } = await req.json();
    console.log('Generating mind map for:', { topic, interestArea, skillLevel });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an expert learning path designer. Create a comprehensive, structured learning mind map for the given topic.
The mind map should include:
1. Core Concepts (3-5 fundamental concepts)
2. Prerequisites (2-4 things to know before starting)
3. Skills to Learn (4-6 specific skills)
4. Learning Resources (3-5 recommended sources like books, courses, websites)
5. Project Ideas (3-5 hands-on projects)
6. Career Paths (2-4 potential career directions)

Adapt the complexity and focus based on:
- Interest Area: ${interestArea || 'general'}
- Skill Level: ${skillLevel || 'beginner'}

Return the data as a JSON object with this structure:
{
  "nodes": [
    { "id": "root", "label": "Topic Name", "category": "root" },
    { "id": "core-1", "label": "Concept name", "category": "core", "description": "Brief description" },
    ...
  ],
  "edges": [
    { "from": "root", "to": "core-1" },
    ...
  ]
}

Categories: root, core, prerequisite, skill, resource, project, career`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Create a learning mind map for: ${topic}` }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add more credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const mindMapData = JSON.parse(content);

    console.log('Mind map generated successfully');

    return new Response(
      JSON.stringify({ mindMap: mindMapData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-mind-map function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate mind map' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});