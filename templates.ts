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
            agentId: 'researcher_01',
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
            agentId: 'writer_01',
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
        { id: 'agent-writer', type: 'agent', position: { x: 250, y: 50 }, label: 'Blog Post Writer', data: { role: 'Content Writer', goal: 'Write an engaging blog post on a given topic.', backstory: 'Expert in tech journalism.', memory: true, agentId: 'content_creator_01' } },
        { id: 'task-write', type: 'task', position: { x: 500, y: 50 }, label: 'Write Draft', data: { description: 'Write a 1000-word blog post about the future of AI.', expected_output: 'A markdown file of the draft.' } },
        { id: 'agent-editor', type: 'agent', position: { x: 250, y: 200 }, label: 'Editor', data: { role: 'Editor', goal: 'Review and edit the blog post for clarity and grammar.', backstory: 'A meticulous editor with an eye for detail.', memory: false, agentId: 'editor_01' } },
        { id: 'task-edit', type: 'task', position: { x: 500, y: 200 }, label: 'Edit Draft', data: { description: 'Review the draft from the writer, fix any errors, and improve readability.', expected_output: 'The final, edited markdown file.' } },
        { id: 'agent-illustrator', type: 'agent', position: { x: 250, y: 350 }, label: 'Image Specialist', data: { role: 'Image Specialist', goal: 'Find a suitable header image for the blog post.', backstory: 'Knows how to craft the perfect prompt for image generation.', memory: false, agentId: 'image_specialist_01' } },
        { id: 'tool-image', type: 'tool', position: { x: 250, y: 475 }, label: 'Image Tool', data: { name: 'duckduckgo_search' } },
        { id: 'task-image', type: 'task', position: { x: 500, y: 350 }, label: 'Find Image', data: { description: 'Search for a header image for a blog post about the future of AI. Style: photorealistic.', expected_output: 'A URL to the generated image.' } },
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
    name: 'Trip Planner',
    description: 'A multi-agent team to plan a trip, including flights, hotels, and activities.',
    workflow: {
      nodes: [
        { id: 'trigger-trip', type: 'trigger', position: { x: 50, y: 200 }, label: 'Plan Trip', data: { type: 'Manual' } },
        { id: 'agent-travel', type: 'agent', position: { x: 250, y: 200 }, label: 'Travel Agent', data: { role: 'Expert Travel Planner', goal: 'Create a comprehensive travel itinerary.', backstory: 'A seasoned travel consultant for crafting unforgettable journeys.', memory: true, agentId: 'travel_agent_01' } },
        { id: 'tool-search-trip', type: 'tool', position: { x: 250, y: 325 }, label: 'Search Tool', data: { name: 'duckduckgo_search' } },
        { id: 'task-research-fh', type: 'task', position: { x: 500, y: 50 }, label: 'Research Flights & Hotels', data: { description: 'Find best flight and hotel options for a 7-day trip to Paris for 2 adults.', expected_output: 'A list of 3 flight options and 3 hotel options with prices.' } },
        { id: 'task-research-act', type: 'task', position: { x: 500, y: 200 }, label: 'Research Activities', data: { description: 'Find 5 popular tourist attractions and 3 unique local experiences in Paris.', expected_output: 'A bulleted list of activities with brief descriptions.' } },
        { id: 'task-create-itin', type: 'task', position: { x: 750, y: 200 }, label: 'Create Itinerary', data: { description: 'Combine flight, hotel, and activity research into a day-by-day itinerary.', expected_output: 'A 7-day itinerary in markdown format.' } },
        { id: 'output-trip', type: 'output', position: { x: 1000, y: 200 }, label: 'Display Itinerary', data: { type: 'Display' } }
      ],
      edges: [
        { id: 'e-tr-ta', source: 'trigger-trip', target: 'task-research-fh' },
        { id: 'e-tr-tb', source: 'trigger-trip', target: 'task-research-act' },
        { id: 'e-ta-tfh', source: 'agent-travel', target: 'task-research-fh' },
        { id: 'e-ta-tact', source: 'agent-travel', target: 'task-research-act' },
        { id: 'e-tst-ta', source: 'tool-search-trip', target: 'agent-travel' },
        { id: 'e-tfh-tci', source: 'task-research-fh', target: 'task-create-itin' },
        { id: 'e-tact-tci', source: 'task-research-act', target: 'task-create-itin' },
        { id: 'e-ta-tci', source: 'agent-travel', target: 'task-create-itin' },
        { id: 'e-tci-ot', source: 'task-create-itin', target: 'output-trip' }
      ],
      config: { process: 'hierarchical', verbose: true }
    }
  },
  {
      name: 'Code Generation Team',
      description: 'Agents that take a feature request, write the code, and write tests for it.',
      workflow: {
          nodes: [
              { id: 'trigger-codegen', type: 'trigger', position: { x: 50, y: 200 }, label: 'Generate Code', data: { type: 'Manual' } },
              { id: 'agent-architect', type: 'agent', position: { x: 250, y: 50 }, label: 'Software Architect', data: { role: 'Software Architect', goal: 'Design robust and scalable software solutions.', backstory: 'A veteran architect who designs flawless software blueprints.', memory: false, agentId: 'architect_01' } },
              { id: 'task-design', type: 'task', position: { x: 500, y: 50 }, label: 'Design Function', data: { description: 'Design the structure for a Python function that calculates the nth Fibonacci number.', expected_output: 'A plan outlining the function signature, algorithm, and edge cases.' } },
              { id: 'agent-developer', type: 'agent', position: { x: 250, y: 200 }, label: 'Python Developer', data: { role: 'Senior Python Developer', goal: 'Write clean, efficient, and well-documented Python code.', backstory: 'A Python expert who loves solving complex problems.', memory: true, agentId: 'developer_01' } },
              { id: 'task-implement', type: 'task', position: { x: 500, y: 200 }, label: 'Implement Function', data: { description: 'Write a Python function based on the architect\'s design.', expected_output: 'The Python code for the Fibonacci function.' } },
              { id: 'agent-qa', type: 'agent', position: { x: 250, y: 350 }, label: 'QA Engineer', data: { role: 'QA Engineer', goal: 'Ensure code quality by writing thorough and reliable tests.', backstory: 'A meticulous tester who catches every bug.', memory: false, agentId: 'qa_engineer_01' } },
              { id: 'task-test', type: 'task', position: { x: 500, y: 350 }, label: 'Write Unit Tests', data: { description: 'Write pytest unit tests for the Fibonacci function, covering all cases.', expected_output: 'A Python file containing the unit tests.' } },
              { id: 'output-codegen', type: 'output', position: { x: 750, y: 200 }, label: 'Final Code', data: { type: 'Display' } }
          ],
          edges: [
              { id: 'e-tc-td', source: 'trigger-codegen', target: 'task-design' },
              { id: 'e-aa-td', source: 'agent-architect', target: 'task-design' },
              { id: 'e-td-ti', source: 'task-design', target: 'task-implement' },
              { id: 'e-ad-ti', source: 'agent-developer', target: 'task-implement' },
              { id: 'e-ti-tt', source: 'task-implement', target: 'task-test' },
              { id: 'e-aq-tt', source: 'agent-qa', target: 'task-test' },
              { id: 'e-ti-oc', source: 'task-implement', target: 'output-codegen' }
          ],
          config: { process: 'sequential', verbose: true }
      }
  },
  {
      name: 'Investment Analysis',
      description: 'Research a company, analyze its financials, and provide an investment recommendation.',
      workflow: {
          nodes: [
              { id: 'trigger-invest', type: 'trigger', position: { x: 50, y: 200 }, label: 'Analyze Ticker', data: { type: 'Manual' } },
              { id: 'agent-market', type: 'agent', position: { x: 250, y: 100 }, label: 'Market Researcher', data: { role: 'Market Researcher', goal: 'Gather and analyze market news and sentiment for a given company.', backstory: 'An analyst who keeps a finger on the pulse of the market.', memory: true, agentId: 'market_researcher_01' } },
              { id: 'tool-google', type: 'tool', position: { x: 250, y: -25 }, label: 'Google Search', data: { name: 'google_search' } },
              { id: 'task-news', type: 'task', position: { x: 500, y: 100 }, label: 'Gather Market News', data: { description: 'Gather recent news, analyst ratings, and overall market sentiment for TSLA.', expected_output: 'A summary of recent news and market sentiment.' } },
              { id: 'agent-financial', type: 'agent', position: { x: 250, y: 300 }, label: 'Financial Analyst', data: { role: 'Financial Analyst', goal: 'Analyze a company\'s financial statements and SEC filings.', backstory: 'A numbers expert who dissects financial reports for hidden insights.', memory: false, agentId: 'financial_analyst_02' } },
              { id: 'tool-sec', type: 'tool', position: { x: 250, y: 425 }, label: 'SEC Search', data: { name: 'sec_search' } },
              { id: 'task-financials', type: 'task', position: { x: 500, y: 300 }, label: 'Analyze Financials', data: { description: 'Analyze the latest 10-K and 10-Q filings for TSLA to assess its financial health.', expected_output: 'A summary of key financial metrics (revenue, profit, debt).' } },
              { id: 'agent-strategist', type: 'agent', position: { x: 750, y: 200 }, label: 'Investment Strategist', data: { role: 'Chief Investment Strategist', goal: 'Synthesize research to provide a clear investment recommendation.', backstory: 'A seasoned strategist who makes informed investment decisions.', memory: true, agentId: 'investment_strategist_01' } },
              { id: 'task-brief', type: 'task', position: { x: 1000, y: 200 }, label: 'Create Investment Brief', data: { description: 'Combine market research and financial analysis into a brief with a "buy", "hold", or "sell" recommendation.', expected_output: 'A concise investment brief with a final recommendation.' } },
              { id: 'output-invest', type: 'output', position: { x: 1250, y: 200 }, label: 'Display Brief', data: { type: 'Display' } }
          ],
          edges: [
              { id: 'e-ti-tn', source: 'trigger-invest', target: 'task-news' },
              { id: 'e-ti-tf', source: 'trigger-invest', target: 'task-financials' },
              { id: 'e-am-tn', source: 'agent-market', target: 'task-news' },
              { id: 'e-tg-am', source: 'tool-google', target: 'agent-market' },
              { id: 'e-af-tf', source: 'agent-financial', target: 'task-financials' },
              { id: 'e-ts-af', source: 'tool-sec', target: 'agent-financial' },
              { id: 'e-tn-tb', source: 'task-news', target: 'task-brief' },
              { id: 'e-tf-tb', source: 'task-financials', target: 'task-brief' },
              { id: 'e-as-tb', source: 'agent-strategist', target: 'task-brief' },
              { id: 'e-tb-oi', source: 'task-brief', target: 'output-invest' }
          ],
          config: { process: 'hierarchical', verbose: true }
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
            agentId: 'chat_assistant_01',
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
  {
    name: 'Hiring Assistant',
    description: 'Screens a resume against a job description and drafts an interview invite.',
    workflow: {
        nodes: [
            { id: 'trigger-hire', type: 'trigger', position: { x: 50, y: 200 }, label: 'Screen Candidate', data: { type: 'Manual' } },
            { id: 'agent-screener', type: 'agent', position: { x: 250, y: 100 }, label: 'Resume Screener', data: { role: 'Resume Screener', goal: 'Analyze a resume against a job description to determine fit.', backstory: 'An AI HR specialist that quickly identifies top talent.', memory: true, agentId: 'screener_01' } },
            { id: 'tool-file', type: 'tool', position: { x: 250, y: -25 }, label: 'File Reader', data: { name: 'file_reader' } },
            { id: 'task-screen', type: 'task', position: { x: 500, y: 100 }, label: 'Screen Resume', data: { description: 'Read the resume.txt and job_description.txt files. Compare the candidate\'s experience and skills with the job requirements.', expected_output: 'A summary of the candidate\'s qualifications and a "match" or "no match" conclusion.' } },
            { id: 'agent-scheduler', type: 'agent', position: { x: 250, y: 300 }, label: 'Scheduler', data: { role: 'Interview Scheduler', goal: 'Draft a friendly and professional interview invitation email.', backstory: 'An efficient assistant who helps coordinate the hiring process.', memory: false, agentId: 'scheduler_01' } },
            { id: 'task-draft', type: 'task', position: { x: 500, y: 300 }, label: 'Draft Invitation', data: { description: 'If the candidate is a "match", draft an email to invite them for a 30-minute virtual interview, offering three potential time slots.', expected_output: 'The complete text for the invitation email.' } },
            { id: 'output-hire', type: 'output', position: { x: 750, y: 300 }, label: 'Display Email', data: { type: 'Display' } }
        ],
        edges: [
            { id: 'e-th-ts', source: 'trigger-hire', target: 'task-screen' },
            { id: 'e-as-ts', source: 'agent-screener', target: 'task-screen' },
            { id: 'e-tf-as', source: 'tool-file', target: 'agent-screener' },
            { id: 'e-ts-td', source: 'task-screen', target: 'task-draft' },
            { id: 'e-asc-td', source: 'agent-scheduler', target: 'task-draft' },
            { id: 'e-td-oh', source: 'task-draft', target: 'output-hire' }
        ],
        config: { process: 'sequential', verbose: true }
    }
  },
  {
      name: 'Daily News Briefing',
      description: 'Gathers news from different sectors and synthesizes a daily briefing.',
      workflow: {
          nodes: [
              { id: 'trigger-news', type: 'trigger', position: { x: 50, y: 200 }, label: 'Get Daily News', data: { type: 'Manual' } },
              { id: 'agent-news', type: 'agent', position: { x: 250, y: 100 }, label: 'AI News Reporter', data: { role: 'AI Tech Reporter', goal: 'Find the top 3 latest news articles about Artificial Intelligence.', backstory: 'A reporter focused on the latest AI breakthroughs.', memory: true, agentId: 'ai_news_reporter' } },
              { id: 'tool-search-news', type: 'tool', position: { x: 250, y: -25 }, label: 'Search', data: { name: 'duckduckgo_search' } },
              { id: 'task-ai-news', type: 'task', position: { x: 500, y: 100 }, label: 'Fetch AI News', data: { description: 'Search for the latest news and developments in the field of AI.', expected_output: 'A bullet-point summary of the top 3 AI news articles.' } },
              { id: 'agent-finance', type: 'agent', position: { x: 250, y: 300 }, label: 'Finance Reporter', data: { role: 'Financial Market Reporter', goal: 'Find the top 3 latest news articles about the stock market.', backstory: 'A reporter who tracks market trends and financial news.', memory: true, agentId: 'finance_reporter' } },
              { id: 'task-finance-news', type: 'task', position: { x: 500, y: 300 }, label: 'Fetch Finance News', data: { description: 'Search for the latest news regarding the global stock market.', expected_output: 'A bullet-point summary of the top 3 finance news articles.' } },
              { id: 'agent-editor', type: 'agent', position: { x: 750, y: 200 }, label: 'Editor-in-Chief', data: { role: 'Editor-in-Chief', goal: 'Combine news reports into a single, cohesive daily briefing.', backstory: 'A lead editor who curates the final news summary.', memory: false, agentId: 'editor_in_chief' } },
              { id: 'task-briefing', type: 'task', position: { x: 1000, y: 200 }, label: 'Create Briefing', data: { description: 'Combine the AI and Finance news summaries into a single daily briefing document.', expected_output: 'A formatted markdown document with the combined daily news.' } },
              { id: 'output-news', type: 'output', position: { x: 1250, y: 200 }, label: 'Display Briefing', data: { type: 'Display' } }
          ],
          edges: [
              { id: 'e-tn-tan', source: 'trigger-news', target: 'task-ai-news' },
              { id: 'e-tn-tfn', source: 'trigger-news', target: 'task-finance-news' },
              { id: 'e-tsn-an', source: 'tool-search-news', target: 'agent-news' },
              { id: 'e-tsn-af', source: 'tool-search-news', target: 'agent-finance' },
              { id: 'e-an-tan', source: 'agent-news', target: 'task-ai-news' },
              { id: 'e-af-tfn', source: 'agent-finance', target: 'task-finance-news' },
              { id: 'e-tan-tb', source: 'task-ai-news', target: 'task-briefing' },
              { id: 'e-tfn-tb', source: 'task-finance-news', target: 'task-briefing' },
              { id: 'e-ae-tb', source: 'agent-editor', target: 'task-briefing' },
              { id: 'e-tb-on', source: 'task-briefing', target: 'output-news' }
          ],
          config: { process: 'hierarchical', verbose: false }
      }
  },
  {
      name: 'Social Media Post Generator',
      description: 'Generates a social media post and relevant hashtags for a given topic.',
      workflow: {
          nodes: [
              { id: 'trigger-social', type: 'trigger', position: { x: 50, y: 200 }, label: 'Create Post', data: { type: 'Manual' } },
              { id: 'agent-social', type: 'agent', position: { x: 250, y: 200 }, label: 'Social Media Manager', data: { role: 'Social Media Content Creator', goal: 'Create engaging social media content.', backstory: 'A creative mind who knows how to capture attention online.', memory: true, agentId: 'social_creator_01' } },
              { id: 'task-write-post', type: 'task', position: { x: 500, y: 100 }, label: 'Write Post', data: { description: 'Write a short, engaging Twitter post about the benefits of remote work.', expected_output: 'The text content of the Twitter post.' } },
              { id: 'task-hashtags', type: 'task', position: { x: 500, y: 300 }, label: 'Generate Hashtags', data: { description: 'Generate 5 relevant hashtags for a post about remote work.', expected_output: 'A list of 5 hashtags.' } },
              { id: 'output-social', type: 'output', position: { x: 750, y: 200 }, label: 'Display Post', data: { type: 'Display' } }
          ],
          edges: [
              { id: 'e-ts-twp', source: 'trigger-social', target: 'task-write-post' },
              // FIX: Corrected a typo in the edge definition. The id property was malformed.
              { id: 'e-ts-th', source: 'trigger-social', target: 'task-hashtags' },
              { id: 'e-as-twp', source: 'agent-social', target: 'task-write-post' },
              { id: 'e-as-th', source: 'agent-social', target: 'task-hashtags' },
              { id: 'e-twp-os', source: 'task-write-post', target: 'output-social' },
              { id: 'e-th-os', source: 'task-hashtags', target: 'output-social' },
          ],
          config: { process: 'hierarchical', verbose: true }
      }
  }
];