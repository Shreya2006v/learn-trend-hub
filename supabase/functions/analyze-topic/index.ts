import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic } = await req.json();
    
    if (!topic || typeof topic !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Topic is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are a technology skills analyzer with expertise in assessing topic relevance in modern technology. Your task is to analyze technology topics and provide structured, actionable insights.

CRITICAL: First assess if the topic is currently relevant or outdated in modern technology.

When analyzing a topic, provide exactly 7 sections:
1. Relevance Assessment - Determine if topic is current, declining, or outdated. If outdated, list replacement technologies.
2. Topic Overview - Brief introduction and context
3. Modern Applications - Where and how it's used today (or was used if outdated)
4. Importance & Impact - Why it matters (or historical significance if outdated)
5. Skills & Tools to Learn - Specific technologies, languages, and frameworks (or modern alternatives if outdated)
6. Project Ideas - Concrete projects from beginner to advanced
7. Skill Gap Analysis - What learners need to acquire to excel

Be specific, practical, and honest about relevance. Focus on actionable advice and real-world applications.`;

    const userPrompt = `Analyze the following technology topic: "${topic}"

FIRST: Assess relevance in 2025 - Is this topic current, declining, or outdated? If outdated, what modern technologies replaced it?

Provide a comprehensive analysis covering:
- Relevance Assessment (current status, adoption rate, if outdated list 3-5 replacement technologies with brief explanations)
- Topic Overview (3-4 points)
- Modern Applications (4-5 points, or historical uses if outdated)
- Importance & Impact (3-4 points)
- Skills & Tools to Learn (4-5 points with specific tools/languages, or modern alternatives)
- Project Ideas (4-5 concrete project suggestions)
- Skill Gap Analysis (4-5 points about what to learn)

Make it practical, specific, and actionable. Be honest about relevance.`;

    console.log("Calling AI Gateway for topic:", topic);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_analysis",
              description: "Provide structured analysis of a technology topic",
              parameters: {
                type: "object",
                properties: {
                  relevance: {
                    type: "object",
                    properties: {
                      status: {
                        type: "string",
                        enum: ["current", "declining", "outdated"],
                        description: "Current relevance status of the topic"
                      },
                      explanation: {
                        type: "string",
                        description: "Brief explanation of the relevance status"
                      },
                      replacementTechnologies: {
                        type: "array",
                        items: { type: "string" },
                        description: "Modern technologies that replaced this (if outdated/declining), each with brief explanation"
                      }
                    },
                    required: ["status", "explanation"],
                    description: "Relevance assessment in modern technology landscape"
                  },
                  overview: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-4 overview points about the topic"
                  },
                  modernApplications: {
                    type: "array",
                    items: { type: "string" },
                    description: "4-5 points about modern applications"
                  },
                  importance: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-4 points about importance and impact"
                  },
                  skillsTools: {
                    type: "array",
                    items: { type: "string" },
                    description: "4-5 specific skills and tools to learn"
                  },
                  projectIdeas: {
                    type: "array",
                    items: { type: "string" },
                    description: "4-5 concrete project ideas"
                  },
                  skillGap: {
                    type: "array",
                    items: { type: "string" },
                    description: "4-5 points about skill gap analysis"
                  }
                },
                required: ["relevance", "overview", "modernApplications", "importance", "skillsTools", "projectIdeas", "skillGap"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "provide_analysis" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add more credits to continue." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to analyze topic. Please try again." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log("AI Gateway response received");

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || !toolCall.function?.arguments) {
      console.error("No tool call found in response");
      return new Response(
        JSON.stringify({ error: "Invalid response from AI service" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    console.log("Analysis extracted successfully");

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in analyze-topic function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
