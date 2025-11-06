import { WorkflowTemplate } from './types';

export const initialTemplates: WorkflowTemplate[] = [
  {
    name: 'Basic Research & Report',
    description: 'A simple workflow to research a topic and write a report.',
    workflow: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          position: { x: 50, y: 150 },
          label: 'Manual Trigger',
          data: { type: 'Manual' },
        },
        {
          id: 'agent-1',
          type: 'agent',
          position: { x: 300, y: 50 },
          label: 'Researcher',
          data: {
            role: 'Senior Research Analyst',
            goal: 'Gather and synthesize information on a given topic.',
            backstory: 'An expert in finding and analyzing information from the web.',
            memory: true,
          },
        },
         {
          id: 'tool-1',
          type: 'tool',
          position: { x: 300, y: -75 },
          label: 'Search Tool',
          data: { name: 'duckduckgo_search' },
        },
        {
          id: 'task-1',
          type: 'task',
          position: { x: 550, y: 150 },
          label: 'Research Topic',
          data: {
            description: 'Use the search tool to find information about "The impact of AI on climate change".',
            expected_output: 'A bulleted list of key findings and sources.',
          },
        },
        {
          id: 'task-2',
          type: 'task',
          position: { x: 800, y: 150 },
          label: 'Write Report',
          data: {
            description: 'Compile the research findings into a 500-word report.',
            expected_output: 'A formatted report in markdown.',
          },
        },
         {
          id: 'agent-2',
          type: 'agent',
          position: { x: 550, y: 300 },
          label: 'Writer',
          data: {
            role: 'Content Writer',
            goal: 'Write a comprehensive report based on provided information.',
            backstory: 'A skilled writer specializing in clear and concise reports.',
            memory: false,
          },
        },
        {
          id: 'output-1',
          type: 'output',
          position: { x: 1050, y: 150 },
          label: 'Display Report',
          data: { type: 'Display' },
        },
      ],
      edges: [
        { id: 'e-t1-a1', source: 'tool-1', target: 'agent-1' },
        { id: 'e-tr1-t1', source: 'trigger-1', target: 'task-1' },
        { id: 'e-a1-t1', source: 'agent-1', target: 'task-1' },
        { id: 'e-t1-t2', source: 'task-1', target: 'task-2' },
        { id: 'e-a2-t2', source: 'agent-2', target: 'task-2' },
        { id: 'e-t2-o1', source: 'task-2', target: 'output-1' },
      ],
      config: { process: 'sequential', verbose: true },
    },
  },
  {
    name: 'Content Creation Pipeline',
    description: 'A team of agents collaborates to write, edit, and find an image for a blog post.',
    workflow: {
      nodes: [
        { id: 'trigger-cc', type: 'trigger', position: { x: 25, y: 200 }, label: 'Start Blog Post', data: { type: 'Manual' } },
        { id: 'agent-writer', type: 'agent', position: { x: 250, y: 50 }, label: 'Blog Post Writer', data: { role: 'Content Writer', goal: 'Write an engaging blog post on a given topic.', backstory: 'Expert in tech journalism.', memory: true } },
        { id: 'task-write', type: 'task', position: { x: 500, y: 50 }, label: 'Write Draft', data: { description: 'Write a 1000-word blog post about the future of AI.', expected_output: 'A markdown file of the draft.' } },
        { id: 'agent-editor', type: 'agent', position: { x: 250, y: 200 }, label: 'Editor', data: { role: 'Editor', goal: 'Review and edit the blog post for clarity and grammar.', backstory: 'A meticulous editor with an eye for detail.', memory: false } },
        { id: 'task-edit', type: 'task', position: { x: 500, y: 200 }, label: 'Edit Draft', data: { description: 'Review the draft from the writer, fix any errors, and improve readability.', expected_output: 'The final, edited markdown file.' } },
        { id: 'agent-illustrator', type: 'agent', position: { x: 250, y: 350 }, label: 'Image Specialist', data: { role: 'Image Specialist', goal: 'Find a suitable header image for the blog post.', backstory: 'Knows how to craft the perfect prompt for image generation.', memory: false } },
        { id: 'tool-image', type: 'tool', position: { x: 250, y: 475 }, label: 'Image Tool', data: { name: 'image_generation_tool' } },
        { id: 'task-image', type: 'task', position: { x: 500, y: 350 }, label: 'Generate Image', data: { description: 'Generate a header image for a blog post about the future of AI. Style: photorealistic.', expected_output: 'A URL to the generated image.' } },
        { id: 'output-final', type: 'output', position: { x: 750, y: 200 }, label: 'Final Post', data: { type: 'Display' } },
      ],
      edges: [
        { id: 'e-tr-tw', source: 'trigger-cc', target: 'task-write' },
        { id: 'e-aw-tw', source: 'agent-writer', target: 'task-write' },
        { id: 'e-tw-te', source: 'task-write', target: 'task-edit' },
        { id: 'e-ae-te', source: 'agent-editor', target: 'task-edit' },
        { id: 'e-te-ti', source: 'task-edit', target: 'task-image' },
        { id: 'e-ai-ti', source: 'agent-illustrator', target: 'task-image' },
        { id: 'e-ti-ai', source: 'tool-image', target: 'agent-illustrator' },
        { id: 'e-te-of', source: 'task-edit', target: 'output-final' },
      ],
      config: { process: 'sequential', verbose: true },
    },
  },
  {
      name: 'Financial Stock Analysis',
      description: 'An agent uses a finance tool to fetch and analyze stock data for a given ticker.',
      workflow: {
          nodes: [
              { id: 't-fs', type: 'trigger', position: { x: 50, y: 150 }, label: 'Analyze Stock', data: { type: 'Manual' } },
              { id: 'a-fa', type: 'agent', position: { x: 300, y: 150 }, label: 'Financial Analyst', data: { role: 'Financial Analyst', goal: 'Analyze stock data and provide insights.', backstory: 'An expert in financial markets.', memory: false } },
              { id: 'tool-yf', type: 'tool', position: { x: 300, y: 275 }, label: 'Yahoo Finance', data: { name: 'yfinance_tool' } },
              { id: 'task-fa', type: 'task', position: { x: 550, y: 150 }, label: 'Fetch & Analyze', data: { description: 'Fetch the latest stock data for AAPL and provide a summary of its performance.', expected_output: 'A summary report with key metrics.' } },
              { id: 'o-fa', type: 'output', position: { x: 800, y: 150 }, label: 'Display Analysis', data: { type: 'Display' } }
          ],
          edges: [
              { id: 'e-tfs-tfa', source: 't-fs', target: 'task-fa' },
              { id: 'e-afa-tfa', source: 'a-fa', target: 'task-fa' },
              { id: 'e-tyf-afa', source: 'tool-yf', target: 'a-fa' },
              { id: 'e-tfa-ofa', source: 'task-fa', target: 'o-fa' }
          ],
          config: { process: 'sequential', verbose: true }
      }
  },
  {
      name: 'Conditional Content Review',
      description: 'A workflow that writes content, then uses a condition to decide if it needs revision.',
      workflow: {
          nodes: [
              { id: 't-ccr', type: 'trigger', position: { x: 50, y: 200 }, label: 'Start Review', data: { type: 'Manual' } },
              { id: 'a-w-ccr', type: 'agent', position: { x: 300, y: 50 }, label: 'Writer', data: { role: 'Writer', goal: 'Write content.', backstory: 'A creative writer.', memory: true } },
              { id: 'task-w-ccr', type: 'task', position: { x: 550, y: 50 }, label: 'Write Article', data: { description: 'Write a short article about "PraisonAI".', expected_output: 'The article text.' } },
              { id: 'task-r-ccr', type: 'task', position: { x: 800, y: 200 }, label: 'Review Article', data: { description: 'Review the article. If it contains the word "great", approve it. Otherwise, request revision.', expected_output: 'Either "Approved" or "Revision Needed".' } },
              { id: 'a-e-ccr', type: 'agent', position: { x: 550, y: 200 }, label: 'Editor', data: { role: 'Editor', goal: 'Review content.', backstory: 'A meticulous editor.', memory: false } },
              { id: 'cond-1', type: 'wait', position: { x: 1050, y: 200 }, label: 'Check Approval', data: { duration: 5 } }, // Using wait as a placeholder for condition node
              { id: 'o-app-ccr', type: 'output', position: { x: 1300, y: 100 }, label: 'Approved Output', data: { type: 'Display' } },
              { id: 'task-rev-ccr', type: 'task', position: { x: 550, y: 350 }, label: 'Revise Article', data: { description: 'Revise the article to be more positive, include the word "great".', expected_output: 'The revised article text.' } },
              { id: 'o-rev-ccr', type: 'output', position: { x: 800, y: 350 }, label: 'Revised Output', data: { type: 'Display' } }
          ],
          edges: [
              { id: 'e-t-tw', source: 't-ccr', target: 'task-w-ccr' },
              { id: 'e-aw-tw', source: 'a-w-ccr', target: 'task-w-ccr' },
              { id: 'e-tw-tr', source: 'task-w-ccr', target: 'task-r-ccr' },
              { id: 'e-ae-tr', source: 'a-e-ccr', target: 'task-r-ccr' },
              { id: 'e-tr-c1', source: 'task-r-ccr', target: 'cond-1' },
              { id: 'e-c1t-oa', source: 'cond-1', target: 'o-app-ccr' },
              { id: 'e-c1f-trev', source: 'cond-1', target: 'task-rev-ccr' },
              { id: 'e-aw-trev', source: 'a-w-ccr', target: 'task-rev-ccr' },
              { id: 'e-trev-orev', source: 'task-rev-ccr', target: 'o-rev-ccr' }
          ],
          config: { process: 'sequential', verbose: true }
      }
  },
   {
    name: 'Conversational Agent',
    description: 'A simple setup for a conversational agent that responds to user input.',
    workflow: {
      nodes: [
        {
          id: 'trigger-chat-1',
          type: 'trigger',
          position: { x: 100, y: 200 },
          label: 'User Chat',
          data: { type: 'Chat' },
        },
        {
          id: 'agent-convo-1',
          type: 'agent',
          position: { x: 350, y: 200 },
          label: 'Helpful Assistant',
          data: {
            role: 'Helpful Assistant',
            goal: 'Answer user questions and be friendly.',
            backstory: 'An AI assistant designed for helpful conversations.',
            memory: true,
          },
        },
        {
          id: 'task-convo-1',
          type: 'task',
          position: { x: 600, y: 200 },
          label: 'Respond to User',
          data: {
            description: 'Based on the user input, provide a helpful and friendly response.',
            expected_output: 'A conversational response to the user\'s message.',
          },
        },
        {
          id: 'output-chat-1',
          type: 'output',
          position: { x: 850, y: 200 },
          label: 'Display Response',
          data: { type: 'Display' },
        },
      ],
      edges: [
        { id: 'e-tc1-tt1', source: 'trigger-chat-1', target: 'task-convo-1' },
        { id: 'e-ac1-tt1', source: 'agent-convo-1', target: 'task-convo-1' },
        { id: 'e-tt1-oc1', source: 'task-convo-1', target: 'output-chat-1' },
      ],
      config: {
        process: 'sequential',
        verbose: true,
      },
    },
  },
];