import React from 'react';

export default function AuthBrand({ tone = 'dark', compact = false }) {
  return (
    <img
      src="https://media.base44.com/images/public/6a3aac1387cca7f58c54761e/dd8af7569_2f08ffa4b_RBIfw1.png"
      alt="REBEL Business Intelligence"
      className={`${compact ? 'h-7' : 'h-20 xl:h-24'} w-auto object-contain ${tone === 'dark' ? 'brightness-0 invert opacity-90' : ''}`}
    />
  );
}