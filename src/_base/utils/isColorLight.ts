export const isColorLight = (color: string): boolean => {
  // Verifique se a cor começa com # e, se não, adicione # no início
  if (!color.startsWith('#')) {
    color = '#' + color;
  }

  // Remove o # se houver
  color = color.slice(1);

  // Converte a cor para RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);

  // Fórmula de contraste de cores para determinar se a cor é clara ou escura
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 128;
};
