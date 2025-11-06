import { GoogleGenAI, GenerateContentResponse, Type } from '@google/genai';
import { Workflow } from '../types';

// Per coding guidelines, initialize GoogleGenAI with a named API key parameter.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const generateWorkflowFromPrompt = async (prompt: string): Promise<Workflow> => {
  if (!process.env.API_KEY) {
    throw new Error('API_KEY environment variable is not set.');
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a workflow generation expert for the PraisonAI framework. Convert the following user prompt into a structured JSON workflow object. The JSON must have "nodes", "edges", and "config" properties. Nodes should have id, type, position, label, and data. Edges should have id, source, and target. Ensure agents are connected to tasks they perform, and tools are connected to agents that use them. Distribute node positions logically in a left-to-right flow. User prompt: "${prompt}"`,
        config: {
            responseMimeType: "application/json",
            // This complex schema is required to guide the AI to produce a valid workflow structure.
            responseSchema: {
                type: Type.OBJECT,
                required: ['nodes', 'edges', 'config'],
                properties: {
                    nodes: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            required: ['id', 'type', 'position', 'label', 'data'],
                            properties: {
                                id: { type: Type.STRING },
                                type: { type: Type.STRING, enum: ['trigger', 'agent', 'task', 'tool'] },
                                position: { 
                                    type: Type.OBJECT, 
                                    required: ['x', 'y'],
                                    properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } 
                                },
                                label: { type: Type.STRING },
                                data: { 
                                    type: Type.OBJECT,
                                    properties: {
                                        type: { type: Type.STRING, enum: ['Manual', 'Schedule', 'Webhook', 'Chat'], nullable: true },
                                        role: { type: Type.STRING, nullable: true },
                                        goal: { type: Type.STRING, nullable: true },
                                        backstory: { type: Type.STRING, nullable: true },
                                        memory: { type: Type.BOOLEAN, nullable: true },
                                        description: { type: Type.STRING, nullable: true },
                                        expected_output: { type: Type.STRING, nullable: true },
                                        name: { type: Type.STRING, nullable: true }
                                    }
                                }
                            }
                        }
                    },
                    edges: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            required: ['id', 'source', 'target'],
                            properties: {
                                id: { type: Type.STRING },
                                source: { type: Type.STRING },
                                target: { type: Type.STRING }
                            }
                        }
                    },
                    config: {
                        type: Type.OBJECT,
                        required: ['process', 'verbose'],
                        properties: {
                            process: { type: Type.STRING, enum: ['sequential', 'hierarchical'] },
                            verbose: { type: Type.BOOLEAN }
                        }
                    }
                }
            }
        }
    });
    
    // Clean up potential markdown fences from the response
    let jsonText = response.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.substring(7);
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3);
      }
    }
    
    const generatedWorkflow = JSON.parse(jsonText) as Workflow;

    if (!generatedWorkflow || !Array.isArray(generatedWorkflow.nodes) || !Array.isArray(generatedWorkflow.edges)) {
        console.error("Invalid workflow structure received from API. Got:", JSON.stringify(generatedWorkflow, null, 2));
        throw new Error('Invalid workflow structure received from API.');
    }

    return generatedWorkflow;
  } catch (error) {
    console.error('Error generating workflow from prompt:', error);
    throw new Error(`Gemini API Error: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const generatePromptSuggestions = async (): Promise<string[]> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "You are a creative assistant. Brainstorm 3 distinct and interesting ideas for an AI-powered agent workflow. The ideas should be a single sentence each. Return the ideas as a JSON array of strings.",
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error getting prompt suggestions:", error);
        throw new Error("Failed to get suggestions from AI.");
    }
};

export const expandPrompt = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are an expert prompt engineer. Take the user's simple idea and expand it into a detailed, high-quality prompt for an AI that generates agentic workflows. The expanded prompt should describe the agents, their roles, goals, necessary tools, and the sequence of tasks. User idea: "${prompt}"`
        });
        return response.text;
    } catch (error) {
        console.error("Error expanding prompt:", error);
        throw new Error("Failed to expand prompt with AI.");
    }
};