export const getExercises = async (prompt, numExercises, duration) => {
    const apiKey = import.meta.env.GEMINI;
    if(!apiKey) {
        throw new Error("Missing GEMINI API key. Setup your .env file or Cloudflare secrets.");
    }

    const payload = {
        contents: [
            {
                role: "user",
                parts: [
                    {
                        text: `You are a fitness expert AI. The user wants a workout for: "${prompt}". Generate ${numExercises} exercises, each taking ${duration} seconds.
                        Return ONLY a JSON array of objects. Each object must have a "name" string property with the exercise name (e.g. "Jumping Jacks"), and a "duration" number property with the value of ${duration}. Do not wrap in markdown \`\`\`json or add other text.`
                    }
                ]
            }
        ],
        generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json"
        }
    };
    
    // Gemini Flash Latest endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
    
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if(!res.ok){
       const errorData = await res.json().catch(()=>({}));
       throw new Error(`AI Request failed with status ${res.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await res.json();
    try {
        let text = data.candidates[0].content.parts[0].text;
        text = text.trim();
        if (text.startsWith('\`\`\`json')){
           text = text.slice(7, -3);
        } else if (text.startsWith('\`\`\`')) {
           text = text.slice(3, -3);
        }
        
        return JSON.parse(text);
    } catch(e) {
        throw new Error("Failed to parse Gemini response: " + e.message);
    }
}
