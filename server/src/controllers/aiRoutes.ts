import { FastifyInstance } from 'fastify';
import Groq from 'groq-sdk';

export default async function aiRoutes(fastify: FastifyInstance) {
    fastify.post('/generate-entity', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            const { prompt, type, currentDate } = request.body;
            if (!prompt) {
                return reply.status(400).send({ success: false, message: 'Prompt is required' });
            }

            const apiKey = process.env.GROQ_API_KEY;
            if (!apiKey) {
                return reply.status(500).send({ success: false, message: 'GROQ_API_KEY is not configured on the server.' });
            }

            const groq = new Groq({ apiKey });

            const systemPrompt = `
You are an expert community builder and event planner AI.
The user wants to create a new ${type === 'event' ? 'Event' : 'Group'}. 
They will provide a rough idea. Your job is to return a valid JSON object containing the perfect details to pre-fill their creation form.
Do NOT return markdown formatting. ONLY return valid JSON.

Today's Date and Time for relative context (e.g., if user says "today at 3pm", use this date): ${currentDate}

For a GROUP, use this JSON schema:
{
  "name": "Catchy, professional name",
  "description": "A well-written, engaging description explaining the purpose of the group (at least 2 paragraphs).",
  "category": "One of: Technology, Business, Arts, Social, Sports, Education, Health, Other",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "imagePrompt": "A highly descriptive, vivid prompt to generate a 1:1 aspect ratio cover image/banner for this group. YOU MUST PROVIDE THIS.",
  "visibility": "One of: public, private, hidden. Default to public unless implied otherwise.",
  "joinElig": "One of: anyone, restricted, invite. Default to anyone.",
  "approval": boolean, // True if user asks for join approvals to be enabled
  "capacity": 100 // number, maximum participants or members allowed
}

For an EVENT, use this JSON schema:
{
  "title": "Catchy, professional event title",
  "description": "A well-written, engaging description explaining what the event is about, who should attend, and what to expect (at least 2 paragraphs).",
  "category": "One of: Conference, Meetup, Workshop, Party, Seminar, Networking, Other",
  "tags": ["tag1", "tag2", "tag3"],
  "imagePrompt": "A highly descriptive, vivid prompt to generate a 1:1 aspect ratio cover banner for this event. YOU MUST PROVIDE THIS.",
  "startDate": "YYYY-MM-DD" // Required if relative or exact date is specified, otherwise null,
  "startTime": "HH:MM" // 24-hour format string (e.g., '15:00' for 3 PM). Required if specified, otherwise null,
  "endDate": "YYYY-MM-DD",
  "endTime": "HH:MM",
  "visibility": "One of: public, unlisted, custom. Default to public.",
  "registrationStatus": "One of: OPEN, CLOSED, SCHEDULED. Default to OPEN. (If they say registration starts next week, use SCHEDULED)",
  "regStartDate": "YYYY-MM-DD" // Only if SCHEDULED,
  "regStartTime": "HH:MM", // Only if SCHEDULED
  "requireApproval": boolean, // True if they mention needing to approve attendees
  "questionnaireEnabled": boolean, // True if they mention wanting a registration form/questions
  "capacity": 100 // number, maximum participants allowed
}
`;

            const fullPrompt = `${systemPrompt}\n\nUser Request: ${prompt}`;

            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: fullPrompt }],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.5,
                response_format: { type: 'json_object' }
            });
            const responseText = chatCompletion.choices[0]?.message?.content || "{}";

            // Clean up potential markdown formatting in the response
            let cleanedText = responseText.trim();
            if (cleanedText.startsWith('\`\`\`json')) {
                cleanedText = cleanedText.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
            } else if (cleanedText.startsWith('\`\`\`')) {
                cleanedText = cleanedText.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
            }

            let parsedJson;
            try {
                parsedJson = JSON.parse(cleanedText);
            } catch (e) {
                console.error("Failed to parse JSON from AI:", cleanedText);
                return reply.status(500).send({ success: false, message: 'AI returned invalid format. Please try again.' });
            }

            return { success: true, data: parsedJson };
        } catch (e: any) {
            console.error("AI Generation error:", e);
            return reply.status(500).send({ success: false, message: e.message || 'Failed to generate AI response' });
        }
    });

    fastify.post('/global-assistant', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            const { prompt, currentDate } = request.body;
            if (!prompt) return reply.status(400).send({ success: false, message: 'Prompt is required' });

            const apiKey = process.env.GROQ_API_KEY;
            if (!apiKey) return reply.status(500).send({ success: false, message: 'GROQ_API_KEY is not configured on the server.' });

            const groq = new Groq({ apiKey });

            const systemPrompt = `
You are the Samaagum Global AI Assistant.
The user will give you a command or ask a question.
First, classify their intent into one of three categories:
1) "create_event": User wants to create an event.
2) "create_group": User wants to create a group/community.
3) "general_question": User is asking a question about the platform (e.g. "How do I create a ticket?").

Today's Date and Time: ${currentDate}

Return ONLY a valid JSON object. Do not include markdown.

If "general_question", return:
{
  "intent": "general_question",
  "answer": "Your helpful answer in markdown format."
}

If "create_event" or "create_group", return:
{
  "intent": "create_event" or "create_group",
  "data": {
    "name": "Group name (if group)",
    "title": "Event title (if event)",
    "description": "Write a HIGHLY DETAILED, engaging description. MUST BE VERY LONG (at least 3-4 paragraphs)!",
    "category": "Category string",
    "startDate": "YYYY-MM-DD (events only)",
    "startTime": "HH:MM (events only)",
    "endDate": "YYYY-MM-DD (events only)",
    "endTime": "HH:MM (events only)",
    "visibility": "One of: public, unlisted, custom",
    "registrationStatus": "One of: OPEN, CLOSED, SCHEDULED (events only)",
    "requireApproval": true_or_false,
    "approval": true_or_false,
    "questionnaireEnabled": true_or_false,
    "joinElig": "anyone, restricted, or invite",
    "capacity": 100,
    "imagePrompt": "A highly descriptive prompt to generate a 1:1 aspect ratio cover banner/image for this. YOU MUST PROVIDE THIS."
  }
}
`;

            const fullPrompt = `${systemPrompt}\n\nUser Request: ${prompt}`;

            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: fullPrompt }],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.5,
                response_format: { type: 'json_object' }
            });
            let cleanedText = chatCompletion.choices[0]?.message?.content || "{}";
            if (cleanedText.startsWith('\`\`\`json')) cleanedText = cleanedText.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
            else if (cleanedText.startsWith('\`\`\`')) cleanedText = cleanedText.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();

            let parsedJson;
            try {
                parsedJson = JSON.parse(cleanedText);
            } catch (e) {
                console.error("Failed to parse JSON from AI:", cleanedText);
                return reply.status(500).send({ success: false, message: 'AI returned invalid format.' });
            }

            return { success: true, data: parsedJson };
        } catch (e: any) {
            console.error("Global AI Assistant error:", e);
            return reply.status(500).send({ success: false, message: e.message || 'Failed to generate AI response' });
        }
    });
}
