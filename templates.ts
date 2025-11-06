import { WorkflowTemplate } from './types';

export const templates: WorkflowTemplate[] = [
  {
    name: 'Basic Research Team',
    description: 'A researcher agent uses a search tool to investigate a topic, and a writer agent summarizes the findings.',
    workflow: {
      nodes: [
        { id: 'trigger-manual', type: 'trigger', position: { x: 50, y: 150 }, label: 'Manual Start', data: { type: 'Manual' } },
        { id: 'agent-researcher', type: 'agent', position: { x: 550, y: 50 }, label: 'Researcher Agent', data: { role: 'Senior Research Analyst', goal: 'Gather and analyze information on a given topic.', backstory: 'An expert researcher with access to cutting-edge search tools.', memory: true } },
        { id: 'agent-writer', type: 'agent', position: { x: 800, y: 250 }, label: 'Writer Agent', data: { role: 'Content Writer', goal: 'Synthesize research findings into a concise summary.', backstory: 'A skilled writer who can distill complex information.', memory: false } },
        { id: 'tool-search', type: 'tool', position: { x: 300, y: 50 }, label: 'DuckDuckGo Search', data: { name: 'duckduckgo_search' } },
        { id: 'task-research', type: 'task', position: { x: 300, y: 150 }, label: 'Research Topic', data: { description: 'Investigate the topic of "The Future of Renewable Energy" and find 5 key points.', expected_output: 'A bullet-point list summarizing 5 key trends in renewable energy.' } },
        { id: 'task-summarize', type: 'task', position: { x: 550, y: 150 }, label: 'Summarize Findings', data: { description: 'Take the research findings and write a one-paragraph summary.', expected_output: 'A concise, easy-to-read paragraph summarizing the research.' } },
      ],
      edges: [
        { id: 'e-trigger-research', source: 'trigger-manual', target: 'task-research' },
        { id: 'e-research-summarize', source: 'task-research', target: 'task-summarize' },
        { id: 'e-tool-researcher', source: 'tool-search', target: 'agent-researcher' },
        { id: 'e-researcher-task', source: 'agent-researcher', target: 'task-research' },
        { id: 'e-writer-task', source: 'agent-writer', target: 'task-summarize' },
      ],
      config: { process: 'sequential', verbose: true },
    },
  },
  {
    name: 'Content Creation Pipeline',
    description: 'A multi-agent workflow for researching, writing, and reviewing a blog post.',
    workflow: {
        nodes: [
            { id: 'trigger-1', type: 'trigger', position: { x: 50, y: 200 }, label: 'Manual Trigger', data: { type: 'Manual' } },
            { id: 'agent-writer', type: 'agent', position: { x: 550, y: 100 }, label: 'Writer Agent', data: { role: 'Content Writer', goal: 'Write a blog post based on research.', backstory: 'A creative writer specializing in tech articles.', memory: true } },
            { id: 'agent-editor', type: 'agent', position: { x: 800, y: 250 }, label: 'Editor Agent', data: { role: 'Content Editor', goal: 'Review and edit the blog post for clarity and correctness.', backstory: 'A meticulous editor with an eye for detail.', memory: false } },
            { id: 'task-research', type: 'task', position: { x: 300, y: 200 }, label: 'Research AI trends', data: { description: 'Research the latest trends in Artificial Intelligence.', expected_output: 'A bullet point list of 5 key AI trends.' } },
            { id: 'task-write', type: 'task', position: { x: 550, y: 200 }, label: 'Write Blog Post', data: { description: 'Write a 500-word blog post about the AI trends.', expected_output: 'A draft of the blog post.' } },
            { id: 'task-review', type: 'task', position: { x: 800, y: 100 }, label: 'Review Draft', data: { description: 'Review the blog post for grammar and factual accuracy.', expected_output: 'A final, polished version of the blog post.' } },
            { id: 'tool-search', type: 'tool', position: { x: 300, y: 100 }, label: 'Web Search', data: { name: 'duckduckgo_search' } },
        ],
        edges: [
            { id: 'e-1-2', source: 'trigger-1', target: 'task-research' },
            { id: 'e-2-3', source: 'task-research', target: 'task-write' },
            { id: 'e-3-4', source: 'task-write', target: 'task-review' },
            { id: 'e-agent-w-task', source: 'agent-writer', target: 'task-write' },
            { id: 'e-agent-e-task', source: 'agent-editor', target: 'task-review' },
            { id: 'e-tool-to-w', source: 'tool-search', target: 'agent-writer' },
        ],
        config: { process: 'sequential', verbose: true },
    },
  },
  {
    name: 'Orchestrator-Worker Team',
    description: 'A hierarchical workflow where a manager agent delegates tasks to a worker agent.',
    workflow: {
      nodes: [
        { id: 'trigger-1', type: 'trigger', position: { x: 50, y: 150 }, label: 'Start Project', data: { type: 'Manual' } },
        { id: 'agent-manager', type: 'agent', position: { x: 300, y: 50 }, label: 'Project Manager', data: { role: 'Project Manager', goal: 'Break down a project into smaller tasks and delegate them.', backstory: 'An experienced manager who oversees the entire project.', memory: true } },
        { id: 'agent-worker', type: 'agent', position: { x: 550, y: 250 }, label: 'Worker Agent', data: { role: 'General Worker', goal: 'Execute assigned tasks efficiently.', backstory: 'A diligent worker who follows instructions perfectly.', memory: false } },
        { id: 'task-main', type: 'task', position: { x: 300, y: 150 }, label: 'Develop a Web App', data: { description: 'The main goal is to develop a new web application. The manager should create a plan.', expected_output: 'A list of sub-tasks for the worker agent.' } },
        { id: 'task-sub', type: 'task', position: { x: 550, y: 150 }, label: 'Execute Sub-Tasks', data: { description: 'Worker agent will execute the tasks provided by the manager.', expected_output: 'Completed work for each sub-task.' } },
      ],
      edges: [
        { id: 'e-trigger-main', source: 'trigger-1', target: 'task-main' },
        { id: 'e-manager-main', source: 'agent-manager', target: 'task-main' },
        { id: 'e-worker-sub', source: 'agent-worker', target: 'task-sub' },
        { id: 'e-main-sub', source: 'task-main', target: 'task-sub' }
      ],
      config: { process: 'hierarchical', verbose: true },
    }
  },
  {
    name: 'Evaluator-Optimiser Loop',
    description: 'A cyclical workflow for content creation and revision, with an evaluator sending work back for changes.',
    workflow: {
        nodes: [
            { id: 'trigger', type: 'trigger', position: { x: 50, y: 150 }, label: 'Start Writing', data: { type: 'Manual' } },
            { id: 'agent-writer', type: 'agent', position: { x: 300, y: 50 }, label: 'Writer', data: { role: 'Creative Writer', goal: 'Generate initial content based on a prompt.', backstory: 'I write drafts.', memory: true } },
            { id: 'agent-evaluator', type: 'agent', position: { x: 550, y: 250 }, label: 'Evaluator', data: { role: 'Critical Evaluator', goal: 'Review content and provide feedback for improvement.', backstory: 'I provide feedback.', memory: false } },
            { id: 'task-write', type: 'task', position: { x: 300, y: 150 }, label: 'Create Draft', data: { description: 'Write a short story about a robot who discovers music.', expected_output: 'A 300-word draft of the story.' } },
            { id: 'task-evaluate', type: 'task', position: { x: 550, y: 150 }, label: 'Evaluate Story', data: { description: 'Review the story for emotional impact. If it is not impactful enough, provide feedback.', expected_output: 'Either approval or a list of concrete suggestions for improvement.' } },
        ],
        edges: [
            { id: 'e-trigger-write', source: 'trigger', target: 'task-write' },
            { id: 'e-write-evaluate', source: 'task-write', target: 'task-evaluate' },
            { id: 'e-evaluate-write', source: 'task-evaluate', target: 'task-write' }, // The loop back
            { id: 'e-writer-write', source: 'agent-writer', target: 'task-write' },
            { id: 'e-evaluator-evaluate', source: 'agent-evaluator', target: 'task-evaluate' },
        ],
        config: { process: 'sequential', verbose: true },
    }
  },
  {
    name: 'Financial Stock Analysis',
    description: 'An agent uses the yfinance tool to fetch and analyze stock data for a given ticker.',
    workflow: {
      nodes: [
        { id: 'trigger-1', type: 'trigger', position: { x: 50, y: 150 }, label: 'Manual Start', data: { type: 'Manual' } },
        { id: 'agent-analyst', type: 'agent', position: { x: 550, y: 150 }, label: 'Financial Analyst', data: { role: 'Stock Analyst', goal: 'Analyze a stock ticker and provide a summary of its recent performance.', backstory: 'An expert in financial markets.', memory: false } },
        { id: 'tool-yfinance', type: 'tool', position: { x: 300, y: 50 }, label: 'Yahoo Finance Tool', data: { name: 'yfinance_tool' } },
        { id: 'task-analyze', type: 'task', position: { x: 300, y: 150 }, label: 'Analyze Stock', data: { description: 'Analyze the stock performance of TSLA over the last 3 months.', expected_output: 'A summary of the stock performance including key metrics like high, low, and volume.' } },
      ],
      edges: [
        { id: 'e-trigger-task', source: 'trigger-1', target: 'task-analyze' },
        { id: 'e-tool-agent', source: 'tool-yfinance', target: 'agent-analyst' },
        { id: 'e-agent-task', source: 'agent-analyst', target: 'task-analyze' },
      ],
      config: { process: 'sequential', verbose: true },
    }
  },
  {
    name: 'Conversational Agent',
    description: 'A simple setup to have a direct conversation with an agent through the chat interface.',
    workflow: {
      nodes: [
        { id: 'trigger-chat', type: 'trigger', position: { x: 50, y: 150 }, label: 'Start Chat', data: { type: 'Chat' } },
        { id: 'agent-convo', type: 'agent', position: { x: 550, y: 150 }, label: 'Conversational Agent', data: { role: 'Helpful Assistant', goal: 'Answer user questions and engage in conversation.', backstory: 'A friendly AI designed for conversation.', memory: true } },
        { id: 'task-chat', type: 'task', position: { x: 300, y: 150 }, label: 'Handle Conversation', data: { description: 'Respond to the user\'s message in a helpful and friendly manner.', expected_output: 'A relevant and coherent response to the user\'s input.' } },
      ],
      edges: [
        { id: 'e-trigger-task', source: 'trigger-chat', target: 'task-chat' },
        { id: 'e-agent-task', source: 'agent-convo', target: 'task-chat' },
      ],
      config: { process: 'sequential', verbose: true },
    }
  }
];
