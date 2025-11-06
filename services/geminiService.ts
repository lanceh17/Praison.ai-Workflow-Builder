
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
You are an expert at designing Praison.ai workflows. Your task is to take a user's prompt and convert it into a structured JSON object representing a workflow graph. The JSON output must strictly adhere to the provided schema.

**Node Generation Rules:**
- For a node with \`type: 'agent'\`, its \`data\` object **MUST** contain three non-empty string properties:
    - \`role\`: A descriptive title for the agent (e.g., "Senior Research Analyst").
    - \`goal\`: A concise, action-oriented sentence defining the agent's primary objective. (e.g., "Efficiently gather, analyze, and synthesize information on specified topics.")
    - \`backstory\`: A creative, one-sentence narrative giving the agent context and personality. (e.g., "An experienced analyst with a knack for uncovering deep insights.")
- For a node with \`type: 'task'\`, its \`data\` object **MUST** contain:
    - \`description\`: A clear description of what the task entails.
    - \`expected_output\`: A description of the task's deliverable.

**General Instructions:**
1.  Create a logical flow starting from exactly one 'trigger' node.
2.  Analyze the user's prompt to identify agents, tasks, and their relationships.
3.  Assign agents to tasks by creating an edge from the agent to the task.
4.  If tools are mentioned (like 'search'), create a 'tool' node and link it to the relevant agent.
5.  Structure the sequence of tasks correctly using edges.
6.  End the workflow with an 'output' node.
7.  Generate unique, descriptive IDs for all nodes and edges (e.g., 'agent-researcher', 'task-write-report', 'e-researcher-to-task').
8.  Do not create nodes with positions.
9.  If the user provides an existing workflow, modify or add to it. If it's empty, create a new one.

**Edge Rules (Important!):**
- Edges connect nodes. 'source' is the node ID where the edge starts, 'target' is where it ends.
- 'trigger' -> 'task' or 'wait'
- 'agent' -> 'task' (An agent is assigned to a task)
- 'tool' -> 'agent' (A tool is given to an agent)
- 'task' -> 'task', 'wait', or 'output' (Defines the sequence of operations)
- 'wait' -> 'task', 'wait', or 'output'

Existing workflow structure (for context):
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
    const systemInstruction = `You are an expert AI workflow designer. Your task is to take a user's simple concept and expand it into a sophisticated, detailed prompt for creating a multi-agent workflow. The goal is to provide a rich, imaginative scenario that can be used to generate a complex and useful workflow graph.

Follow this structure for your output, using Markdown for formatting:

### **Expanded Prompt: [Give the workflow a creative and descriptive name]**

**1. Overall Goal:**
Write a concise paragraph explaining the high-level objective and value of the workflow.

**2. Agentic Workflow Breakdown:**
This is the most important section. Identify and describe 3 to 5 key, specialized agents. For each agent, provide:
*   **Role:** A clear, one-sentence description of the agent's purpose.
*   **Key Responsibilities:** A brief bulleted list (2-3 points) of its main tasks.
*   **Example Task:** A single, concrete example of a task it would perform.

**3. Inter-Agent Communication:**
Briefly describe how the agents would interact (e.g., passing data, sequential execution).

---
**EXAMPLE FOR STYLE AND TONE (DO NOT COPY):**
If the user prompt is "social media tracker", a good expansion would be:

### **Expanded Prompt: The "OmniPulse Social Intelligence Network"**

**1. Overall Goal:**
To create an autonomous social media intelligence network that provides real-time analysis, trend prediction, and strategic recommendations for a marketing agency's clients. It moves beyond simple tracking to offer actionable insights.

**2. Agentic Workflow Breakdown:**
*   **Data Harvester Agent**
    *   **Role:** Gathers raw social media data from various platforms based on client-specific keywords and accounts.
    *   **Key Responsibilities:**
        *   Connect to social media APIs (e.g., Twitter, Reddit).
        *   Filter data based on keywords, hashtags, and user accounts.
    *   **Example Task:** Pull all tweets from the last 24 hours mentioning "#artisancoffee".
*   **Content Analyst Agent**
    *   **Role:** Processes raw data to extract meaningful information using natural language processing.
    *   **Key Responsibilities:**
        *   Perform sentiment analysis (positive, negative, neutral).
        *   Identify key topics, entities, and trends.
    *   **Example Task:** Analyze a tweet to determine sentiment is "delighted" and tag it as "product feedback".
*   **Strategy & Reporting Agent**
    *   **Role:** Synthesizes insights into actionable recommendations and client-ready reports.
    *   **Key Responsibilities:**
        *   Generate suggestions for content topics based on trends.
        *   Create weekly summary reports with key metrics and visualizations.
    *   **Example Task:** Generate a weekly report showing brand sentiment and suggest a content campaign around "cold brew".

**3. Inter-Agent Communication:**
The Data Harvester feeds raw data to the Content Analyst. The Analyst's structured data is then used by the Strategy & Reporting Agent to create the final output. The process is sequential.
---

Now, take the user's prompt and generate a similar expansion. Be creative, professional, and focus on creating a plausible and interesting workflow. Keep the total length reasonable and focused on the core components.
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
