
import React from 'react';

export const AgentIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    {...props}
  >
    <path d="M12 2a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0 8a3 3 0 1 1 3-3 3 3 0 0 1-3 3z"></path>
    <path d="M12 14c-3.86 0-7 1.84-7 4v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2c0-2.16-3.14-4-7-4z"></path>
  </svg>
);
