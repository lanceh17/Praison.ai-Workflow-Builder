import React from 'react';

export const TriggerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.38-.67.72-1.21C8.75 10.79 10.06 9 13 4h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 20.3 11 21 11 21z" />
  </svg>
);
