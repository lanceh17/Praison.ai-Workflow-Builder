import React from 'react';

export const OutputIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M13 5.41V17a1 1 0 0 1-2 0V5.41l-3.3 3.3a1 1 0 0 1-1.4-1.42l5-5a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1-1.4 1.42L13 5.41zM4 20a1 1 0 0 1-1-1v-4a1 1 0 0 1 2 0v3h14v-3a1 1 0 0 1 2 0v4a1 1 0 0 1-1 1H4z" />
  </svg>
);