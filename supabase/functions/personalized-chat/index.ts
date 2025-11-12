import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationId, assistanceType, userId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user interests to personalize responses
    const { data: interests } = await supabase
      .from('user_interests')
      .select('topic, search_count')
      .eq('user_id', userId)
      .order('search_count', { ascending: false })
      .limit(5);

    // Fetch previous messages in this conversation
    const { data: previousMessages } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(10);

    // Build context based on assistance type and user interests
    let systemPrompt = '';
    
    switch (assistanceType) {
      case 'academic':
        systemPrompt = `You are a personalized academic assistant. Help the user with their studies, explain concepts clearly, and provide structured learning paths. Use visual aids and examples when helpful.`;
        break;
      case 'opportunities':
        systemPrompt = `You are a career and opportunity advisor. Based on the user's interests in ${interests?.map(i => i.topic).join(', ')}, suggest relevant hackathons, ideathons, internships, and job opportunities. Provide specific, actionable recommendations with links when possible.`;
        break;
      case 'general':
      default:
        systemPrompt = `You are a helpful and friendly learning assistant. Provide clear, concise, and personalized responses based on the user's learning journey.`;
    }

    if (interests && interests.length > 0) {
      systemPrompt += `\n\nUser's main interests: ${interests.map(i => i.topic).join(', ')}.`;
    }

    systemPrompt += `\n\nWhen helpful, suggest relevant images or diagrams to explain concepts. Keep responses concise and focused.`;

    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(previousMessages || []).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    console.log('Calling Lovable AI with assistance type:', assistanceType);

    // Call Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API Error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add more credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI response received successfully');

    // Save user message
    await supabase.from('chat_messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: message,
    });

    // Save AI response
    await supabase.from('chat_messages').insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: aiResponse,
    });

    return new Response(
      JSON.stringify({ response: aiResponse }),
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
