
import React from 'react';

export const TaskIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    {...props}
  >
    <path d="M22 7h-2V5c0-1.1-.9-2-2-2h-3c-1.1 0-2 .9-2 2v2H9V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM7 5h2v14H7V5zm13 14H10V9h10v10z"></path>
    <path d="M12 11h6v2h-6zm0 4h6v2h-6z"></path>
  </svg>
);
