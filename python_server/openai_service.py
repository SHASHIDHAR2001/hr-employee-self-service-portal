import os
from openai import OpenAI
from typing import List, Dict, Optional

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))

class DocumentContext:
    def __init__(self, name: str, content: str, category: str):
        self.name = name
        self.content = content
        self.category = category

async def ask_hr_assistant(question: str, documents: List[DocumentContext]) -> Dict[str, any]:
    try:
        if not os.getenv("OPENAI_API_KEY"):
            raise ValueError("OpenAI API key is not configured. Please add your OPENAI_API_KEY to use the AI Assistant.")
        
        context = "\n\n---\n\n".join([
            f"Document: {doc.name} ({doc.category})\nContent: {doc.content}"
            for doc in documents
        ])
        
        system_prompt = f"""You are an AI HR Assistant for an employee self-service portal. Your role is to answer HR-related questions based on the provided company documents and policies.

Guidelines:
- Always be helpful, professional, and accurate
- Reference specific policy documents when applicable
- If you don't have enough information, say so clearly
- Provide actionable advice when possible
- Keep responses concise but comprehensive
- Format your response clearly with bullet points or sections when appropriate

Available Documents:
{context}"""
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ],
            max_tokens=1000,
        )
        
        answer = response.choices[0].message.content or "I apologize, but I couldn't generate a response to your question."
        
        documents_used = [
            doc.name for doc in documents
            if doc.name.lower() in answer.lower() or doc.category.lower() in answer.lower()
        ]
        
        if not documents_used and documents:
            documents_used = [documents[0].name]
        
        return {
            "answer": answer,
            "documentsUsed": documents_used
        }
    
    except Exception as error:
        print(f"Error calling OpenAI API: {error}")
        if "OpenAI API key is not configured" in str(error):
            raise error
        raise ValueError("Failed to get AI response. Please try again later.")

async def process_document_for_vectorization(document_content: str, document_name: str) -> List[str]:
    try:
        system_prompt = """You are a document processing assistant. Your task is to extract meaningful chunks from HR policy documents for efficient retrieval.

Instructions:
1. Break the document into logical sections
2. Each chunk should be self-contained and meaningful
3. Keep chunks between 100-500 words
4. Preserve important context in each chunk
5. Return the chunks as a JSON array

Return format: {"chunks": ["chunk1", "chunk2", ...]}"""
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Document: {document_name}\n\n{document_content}"}
            ],
            response_format={"type": "json_object"},
            max_tokens=2000,
        )
        
        import json
        result = json.loads(response.choices[0].message.content or '{"chunks": []}')
        return result.get("chunks", [])
    
    except Exception as error:
        print(f"Error processing document: {error}")
        chunks = [chunk for chunk in document_content.split('\n\n') if len(chunk.strip()) > 50]
        return chunks[:50]
