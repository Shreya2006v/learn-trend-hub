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
    const { message, conversationId, assistanceType, userInterests } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get conversation history
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20);

    const conversationHistory = messages || [];

    // Build system prompt based on assistance type and user interests
    let systemPrompt = `You are a personalized learning assistant. `;
    
    if (userInterests && userInterests.length > 0) {
      systemPrompt += `The user has shown interest in: ${userInterests.join(', ')}. `;
    }

    switch (assistanceType) {
      case 'academic':
        systemPrompt += `Focus on providing academic assistance, explaining concepts clearly, and suggesting study resources. Keep responses concise and educational.`;
        break;
      case 'opportunities':
        systemPrompt += `Focus on suggesting real-world opportunities like hackathons, ideathons, internships, and job opportunities related to their interests. Provide specific, actionable recommendations with details about how to apply or participate. Include relevant deadlines when possible.`;
        break;
      case 'projects':
        systemPrompt += `Focus on suggesting practical project ideas that align with their interests. Provide step-by-step guidance and technical recommendations.`;
        break;
      default:
        systemPrompt += `Provide helpful, personalized assistance. Keep responses clear, concise, and actionable.`;
    }

    // Call Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: message }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add more credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI request failed: ${errorText}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    // Save messages to database
    const { error: insertError } = await supabase
      .from('chat_messages')
      .insert([
        { conversation_id: conversationId, role: 'user', content: message },
        { conversation_id: conversationId, role: 'assistant', content: assistantMessage }
      ]);

    if (insertError) {
      console.error('Error saving messages:', insertError);
    }

    return new Response(
      JSON.stringify({ response: assistantMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in personalized-chat function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
