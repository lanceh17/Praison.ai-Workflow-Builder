import { GoogleGenAI, Type } from "@google/genai";
import { Workflow, Node, Edge, NodeType } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const nodeSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING, description: "A unique identifier for the node (e.g., 'agent-1')." },
        type: { type: Type.STRING, enum: ['agent', 'task', 'tool', 'trigger', 'output', 'wait'], description: "The type of the node." },
        label: { type: Type.STRING, description: "A short, descriptive label for the node (e.g., 'Researcher')." },
        data: {
            type: Type.OBJECT,
            description: "Data specific to the node type.",
            properties: {
                // Agent
                role: { type: Type.STRING, description: "The role of the agent." },
                goal: { type: Type.STRING, description: "The goal of the agent." },
                backstory: { type: Type.STRING, description: "The backstory of the agent." },
                memory: { type: Type.BOOLEAN, description: "Whether the agent has memory." },
                agentId: { type: Type.STRING, description: "A unique ID for the agent, e.g., 'research_agent'." },
                // Task
                description: { type: Type.STRING, description: "The description of the task." },
                expected_output: { type: Type.STRING, description: "The expected output of the task." },
                // Tool
                name: { type: Type.STRING, description: "The name of the tool." },
                // Trigger
                type: { type: Type.STRING, enum: ['Manual', 'Schedule', 'Webhook', 'Chat'], description: "The type of trigger." },
                // Output
                filename: { type: Type.STRING, description: "The filename for 'SaveToFile' output type." },
                // Wait
                duration: { type: Type.NUMBER, description: "The wait duration in seconds." }
            }
        }
    },
    required: ['id', 'type', 'label', 'data']
};

const edgeSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING, description: "A unique identifier for the edge (e.g., 'e-1')." },
        source: { type: Type.STRING, description: "The ID of the source node." },
        target: { type: Type.STRING, description: "The ID of the target node." }
    },
    required: ['id', 'source', 'target']
};

const workflowSchema = {
    type: Type.OBJECT,
    properties: {
        nodes: { type: Type.ARRAY, items: nodeSchema },
        edges: { type: Type.ARRAY, items: edgeSchema }
    },
    required: ['nodes', 'edges']
};


const generateSystemInstruction = (existingWorkflow: Workflow) => `
You are an AI expert specializing in creating Praison.ai workflow graphs in JSON format. Your task is to convert a user's prompt into a valid JSON object containing nodes and edges that represent a logical workflow. The output must strictly follow the provided schema.

**Core Task:**
- Analyze the user's prompt to determine the necessary agents, tasks, tools, and their connections.
- Construct a workflow starting with a 'trigger' and ending with an 'output'.

**Crucial Rule for 'agent' nodes:**
- When you create an 'agent' node, its 'data' object **MUST** include a 'role', 'goal', and 'backstory'. These fields must be populated with relevant, non-empty strings based on the agent's function in the workflow.

**Edge Logic:**
- Connect nodes logically. For example: an agent connects to a task it performs, a tool connects to an agent that uses it, and tasks connect to each other to show sequence.

**Context:**
- Here is the existing workflow, if any. Modify or add to it as needed:
${JSON.stringify(existingWorkflow, null, 2)}
`;


export const generateWorkflowFromPrompt = async (prompt: string, existingWorkflow: Workflow): Promise<{ nodes: Node[], edges: Edge[] }> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: generateSystemInstruction(existingWorkflow),
                responseMimeType: 'application/json',
                responseSchema: workflowSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText) as { nodes: Omit<Node, 'position'>[], edges: Edge[] };

        // Auto-generate goal and backstory for new agent nodes
        const agentNodes = parsed.nodes.filter(node => node.type === 'agent');
        if (agentNodes.length > 0) {
            const detailPromises = agentNodes.map(agent => 
                generateAgentDetails((agent.data as any).role).then(details => ({
                    id: agent.id,
                    ...details,
                }))
            );
            const allDetails = await Promise.all(detailPromises);
            const detailsMap = new Map(allDetails.map(d => [d.id, { goal: d.goal, backstory: d.backstory }]));
            
            parsed.nodes.forEach(node => {
                if (node.type === 'agent' && detailsMap.has(node.id)) {
                    const details = detailsMap.get(node.id)!;
                    (node.data as any).goal = details.goal;
                    (node.data as any).backstory = details.backstory;
                }
            });
        }


        // Add positions to nodes for canvas rendering
        const positionedNodes = parsed.nodes.map((node, index) => ({
            ...node,
            position: { x: 100 + (index * 250), y: 150 + (index % 3 * 120) }
        } as Node));
        
        return { nodes: positionedNodes, edges: parsed.edges };
    } catch (error) {
        console.error("Error generating workflow:", error);
        throw new Error("Gemini API call failed or returned invalid data.");
    }
};

export const getPromptSuggestions = async (): Promise<string[]> => {
    const systemInstruction = `You are an AI assistant for the Praison.ai workflow builder. Your task is to suggest 3 creative and distinct ideas for new agentic workflows that a user could build.

The suggestions should be single, compelling sentences that describe a complete process. They should be diverse and cover different potential use cases.

Think about common business or personal productivity tasks that can be automated with AI agents, such as:
- Research and analysis
- Content creation and marketing
- Software development planning
- Financial analysis
- Customer support automation

Do not suggest small additions to an existing workflow. Provide ideas for brand new, standalone workflows.

Examples of good suggestions:
- "Create a team of agents to research a new technology and write a detailed competitive analysis report."
- "Design a content creation pipeline that writes, edits, and finds an image for a weekly blog post."
- "Build a financial analysis agent that tracks a stock ticker and summarizes its daily performance."

Now, provide 3 new suggestions based on these instructions.`;
    
     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: "Suggest 3 new workflow ideas.",
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    suggestions: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                },
                required: ['suggestions']
            }
        },
    });

    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);
    return parsed.suggestions || [];
};

export const expandPrompt = async (prompt: string): Promise<string> => {
    const systemInstruction = `You are an expert AI workflow designer. Your task is to take a user's simple concept and expand it into a CONCISE and PUNCHY prompt for creating a multi-agent workflow. The output should be brief and easy to read.

**RULES:**
- **BE BRIEF.** The entire output should be short.
- Use Markdown for formatting.
- Do not use more than 3 agents.
- For each agent, provide only a **one-sentence description** of its role and primary task.
- Do NOT include sections for "Key Responsibilities" or "Example Task".

Follow this **strict** structure:

### **[Creative Workflow Name]**

**Goal:** A single, concise sentence explaining the workflow's objective.

**Agents:**
- **[Agent 1 Name]:** A single sentence describing its role.
- **[Agent 2 Name]:** A single sentence describing its role.
- **[Agent 3 Name]:** A single sentence describing its role.

**Flow:** A very brief (max 10 words) description of how they work together (e.g., "Profiler finds leads, Writer crafts the email.").

---
**EXAMPLE (Follow this style):**

### **Social Media Intelligence Network**

**Goal:** To autonomously track social media, analyze trends, and report key insights.

**Agents:**
- **Data Harvester:** Gathers raw social media posts based on keywords.
- **Content Analyst:** Analyzes posts for sentiment and key topics.
- **Reporting Agent:** Summarizes the findings into a daily report.

**Flow:** Data is harvested, then analyzed, then summarized into a report.
---

Now, take the user's prompt and generate a similarly brief and concise expansion.
`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `User prompt to expand: "${prompt}"`,
        config: {
            systemInstruction,
        }
    });
    return response.text.trim();
};


export const generatePraisonYaml = async (workflow: Workflow): Promise<string> => {
    const systemInstruction = `
You are a configuration expert for the Praison AI framework. Your task is to convert a JSON representation of a workflow into a valid 'praison.yaml' file.

The JSON input will contain nodes and edges.
- 'agent' nodes define the agents. Their 'agentId' field is the unique identifier.
- 'task' nodes define the tasks.
- 'tool' nodes define tools.
- Edges from agents to tasks mean that agent is assigned to that task.
- Edges from tools to agents mean that tool is available to that agent.
- Edges between tasks define dependencies. The target task depends on the source task.

Based on the provided JSON, generate the YAML output with two main sections: 'framework' and 'agents'.

**YAML Structure:**
- The 'framework' section should contain the process type and verbosity from the config.
- The 'agents' section is a list of agents.
- Each agent has a role, goal, backstory, and memory setting.
- Each agent has a list of 'tasks'.
- Each task has a description, expected_output.
- A task can have a 'context' array listing the IDs of tasks it depends on.
- Each agent can have a 'tools' list.

**Instructions:**
1.  Map the JSON 'agent' nodes to the YAML 'agents' list using their 'agentId' as the identifier.
2.  For each agent, find the tasks they are assigned to via edges.
3.  For each task, find its dependencies from other tasks via edges. Add these dependencies to the 'context' field of the task.
4.  For each agent, find the tools they are given via edges and list them.
5.  Format the output strictly as YAML. Do not include any explanations or markdown formatting like \`\`\`yaml.
`;
    const prompt = `Here is the workflow JSON: ${JSON.stringify(workflow)}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction,
        }
    });

    // Clean up potential markdown code blocks
    let yamlText = response.text.trim();
    if (yamlText.startsWith('```yaml')) {
        yamlText = yamlText.substring(7);
    }
    if (yamlText.endsWith('```')) {
        yamlText = yamlText.slice(0, -3);
    }

    return yamlText.trim();
};

export const generateAgentDetails = async (role: string): Promise<{ goal: string, backstory: string }> => {
    const systemInstruction = `You are an AI assistant that creates concise and creative personas for AI agents.
Given a 'role' for an agent, you must generate a corresponding 'goal' and 'backstory'.

**Rules:**
- The 'goal' must be a single, action-oriented sentence that clearly defines the agent's primary objective.
- The 'backstory' must be a single, creative sentence that gives the agent some personality and context.
- Your output **MUST** be a valid JSON object. Do not include any other text or markdown formatting.

**Example:**
If the input role is "Senior Research Analyst", your output should be:
{
  "goal": "Efficiently gather, analyze, and synthesize information on specified topics.",
  "backstory": "An experienced analyst with a knack for uncovering deep insights from complex data."
}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate details for the role: "${role}"`,
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    goal: { type: Type.STRING },
                    backstory: { type: Type.STRING }
                },
                required: ['goal', 'backstory']
            }
        },
    });

    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);
    return parsed;
};