export function removePunctuation(word: string) {
  return word.toLowerCase().replace(/[^\w]/g, '');
}
