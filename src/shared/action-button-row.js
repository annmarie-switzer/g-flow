import { generateButton } from './button.js';

export const actionButtonRow = (buttons) => {
  const row = document.createElement('div');
  row.className = 'action-row';

  buttons.forEach((button) => {
    const btn = generateButton(button);
    row.appendChild(btn);
  });

  return row;
};
