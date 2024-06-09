const spinnerIcon =
  '<svg class="spinner" viewBox="0 0 50 50" height="18" width="18"><circle cx="25" cy="25" r="20"></circle></svg>';

const getIconNode = (iconFn) => {
  const parser = new DOMParser();

  const svgString = iconFn();

  const svg = parser.parseFromString(
    svgString,
    'image/svg+xml'
  ).documentElement;

  return svg;
};

export const generateButton = (details) => {
  const { text = '', icon, action, title, spinner } = details;

  const btn = document.createElement('button');

  if (icon) {
    const svg = getIconNode(icon);
    btn.appendChild(svg);
  }

  btn.innerHTML += text;
  btn.title = title;
  btn.addEventListener('click', (event) => {
    event.stopPropagation();

    if (spinner) {
      btn.innerHTML = spinnerIcon;
    }

    action();
  });

  return btn;
};
