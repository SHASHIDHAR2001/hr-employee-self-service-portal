import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "" 
});

interface DocumentContext {
  name: string;
  content: string;
  category: string;
}

export async function askHRAssistant(
  question: string,
  documents: DocumentContext[]
): Promise<{ answer: string; documentsUsed: string[] }> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured. Please add your OPENAI_API_KEY to use the AI Assistant.");
    }

    const context = documents
      .map(doc => `Document: ${doc.name} (${doc.category})\nContent: ${doc.content}`)
      .join('\n\n---\n\n');

    const systemPrompt = `You are an AI HR Assistant for an employee self-service portal. Your role is to answer HR-related questions based on the provided company documents and policies.

Guidelines:
- Always be helpful, professional, and accurate
- Reference specific policy documents when applicable
- If you don't have enough information, say so clearly
- Provide actionable advice when possible
- Keep responses concise but comprehensive
- Format your response clearly with bullet points or sections when appropriate

Available Documents:
${context}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question }
      ],
      max_tokens: 1000,
    });

    const answer = response.choices[0].message.content || "I apologize, but I couldn't generate a response to your question.";
    
    // Determine which documents were likely used based on the response
    const documentsUsed = documents
      .filter(doc => answer.toLowerCase().includes(doc.name.toLowerCase()) || 
                    answer.toLowerCase().includes(doc.category.toLowerCase()))
      .map(doc => doc.name);

    return {
      answer,
      documentsUsed: documentsUsed.length > 0 ? documentsUsed : [documents[0]?.name].filter(Boolean)
    };

  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    if (error instanceof Error && error.message.includes("OpenAI API key is not configured")) {
      throw error;
    }
    throw new Error("Failed to get AI response. Please try again later.");
  }
}

export async function processDocumentForVectorization(
  documentContent: string,
  documentName: string
): Promise<string[]> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      // Fallback: simple text splitting when API key is not available
      const chunks = documentContent.split('\n\n').filter(chunk => chunk.trim().length > 50);
      return chunks.slice(0, 50);
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Break down this HR document into meaningful chunks for vector storage. Each chunk should be self-contained and cover a specific topic or policy. Return the chunks as a JSON array of strings."
        },
        {
          role: "user", 
          content: `Document: ${documentName}\n\nContent: ${documentContent}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"chunks": []}');
    return result.chunks || [];

  } catch (error) {
    console.error("Error processing document:", error);
    // Fallback: simple text splitting
    const chunks = documentContent.split('\n\n').filter(chunk => chunk.trim().length > 50);
    return chunks.slice(0, 50); // Limit to 50 chunks per document
  }
}
