const actionButton = (details) => {
  const btn = document.createElement('button');

  fetch(`icons/${details.icon}.svg`)
    .then((response) => response.text())
    .then((svgContent) => {
      const content = details.text
        ? `${svgContent}<span>${details.text}</span>`
        : svgContent;

      btn.innerHTML = content;
    });

  btn.title = details.title;

  btn.addEventListener('click', () => {
    details.action();
  });

  return btn;
};

export const actionButtonRow = (buttons) => {
  const row = document.createElement('div');
  row.className = 'action-row';

  buttons.forEach((button) => {
    row.appendChild(actionButton(button));
  });

  return row;
};
