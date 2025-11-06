import { GoogleGenAI, Type } from "@google/genai";
import { Workflow } from '../types';

// Fix: Initialize the GoogleGenAI client.
// API key must be retrieved from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// This defines the expected JSON structure for the Gemini model.
const workflowSchema = {
    type: Type.OBJECT,
    properties: {
        nodes: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['agent', 'task', 'tool', 'trigger'] },
                    position: {
                        type: Type.OBJECT,
                        properties: {
                            x: { type: Type.NUMBER },
                            y: { type: Type.NUMBER }
                        },
                        required: ['x', 'y']
                    },
                    label: { type: Type.STRING },
                    data: { 
                        type: Type.OBJECT,
                        properties: {
                            // Agent properties
                            role: { type: Type.STRING },
                            goal: { type: Type.STRING },
                            backstory: { type: Type.STRING },
                            memory: { type: Type.BOOLEAN },
                            // Task properties
                            description: { type: Type.STRING },
                            expected_output: { type: Type.STRING },
                            // Tool property
                            name: { type: Type.STRING },
                            // Trigger properties
                            // FIX: Add 'Chat' to the enum to allow the model to generate chat-based triggers.
                            type: { type: Type.STRING, enum: ['Manual', 'Schedule', 'Webhook', 'Chat'] },
                            config: {
                                type: Type.OBJECT,
                                properties: {
                                    cron: { type: Type.STRING },
                                    url: { type: Type.STRING }
                                }
                            }
                        }
                    }
                },
                required: ['id', 'type', 'position', 'label', 'data']
            }
        },
        edges: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    source: { type: Type.STRING },
                    target: { type: Type.STRING }
                },
                required: ['id', 'source', 'target']
            }
        },
        config: {
            type: Type.OBJECT,
            properties: {
                process: { type: Type.STRING, enum: ['sequential', 'hierarchical'] },
                verbose: { type: Type.BOOLEAN }
            },
            required: ['process', 'verbose']
        }
    },
    required: ['nodes', 'edges', 'config']
};

const systemInstruction = `You are an expert at creating workflow configurations for an AI agent orchestration system called PraisonAI.
Your task is to generate a valid JSON object that represents a workflow based on the user's prompt.
The JSON must strictly adhere to the provided schema.
The workflow consists of nodes and edges.

Node Types:
- 'trigger': Starts the workflow. Usually 'Manual'.
- 'agent': An AI agent with a specific role, goal, and backstory. Can have memory.
- 'task': A specific action to be performed by an agent. Requires a description and expected_output.
- 'tool': A capability that can be connected to an agent (e.g., 'duckduckgo_search').

Connections (Edges):
- A 'trigger' node usually connects to the first 'task' node.
- An 'agent' node must be connected to the 'task' or 'tasks' it is responsible for.
- A 'tool' node must be connected to an 'agent' node that will use it.
- 'task' nodes can be connected to subsequent 'task' nodes to define the sequence of operations.

Guidelines:
- Generate unique and descriptive 'id' fields for all nodes and edges (e.g., 'agent-researcher', 'task-summarize', 'edge-researcher-to-task').
- Create plausible positions for the nodes so they form a readable graph layout. Start with triggers on the left, and flow to the right.
- The 'data' object for each node must contain the appropriate fields for its type.
- For agent nodes, provide a detailed role, goal, and backstory.
- For task nodes, provide a clear description and expected_output.
- For tool nodes, select a valid tool name.
- Always include a trigger node to start the process.
`;

export async function generateWorkflowFromPrompt(prompt: string): Promise<Workflow> {
    try {
        // Fix: Use a recommended model for complex text/JSON generation.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: workflowSchema,
            },
        });

        // Fix: Correctly access the response text.
        const jsonText = response.text;
        
        if (!jsonText) {
            throw new Error('Received an empty response from the API.');
        }

        // The response should be valid JSON due to the schema, so direct parsing is fine.
        const workflow = JSON.parse(jsonText);
        
        // Basic validation
        if (!workflow.nodes || !workflow.edges || !workflow.config) {
            throw new Error('Invalid workflow structure received from API.');
        }

        return workflow as Workflow;

    } catch (error) {
        console.error("Error generating workflow with Gemini:", error);
        if (error instanceof Error) {
             throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while communicating with the Gemini API.");
    }
}