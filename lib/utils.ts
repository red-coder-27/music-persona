export function formatGenre(genre: string): string {
  if (!genre) return ''

  // Special cases that need specific capitalization
  const specialCases: Record<string, string> = {
    kollywood: 'Kollywood',
    tollywood: 'Tollywood',
    mollywood: 'Mollywood',
    bollywood: 'Bollywood',
    'k-pop': 'K-Pop',
    'r&b': 'R&B',
    edm: 'EDM',
    'lo-fi': 'Lo-Fi',
    'hip hop': 'Hip-Hop',
    'hip-hop': 'Hip-Hop',
    'uk garage': 'UK Garage',
    'us indie': 'US Indie',
    'indian classical': 'Indian Classical',
    'indian folk': 'Indian Folk',
    carnatic: 'Carnatic',
    hindustani: 'Hindustani'
  }

  const lower = genre.toLowerCase()
  if (specialCases[lower]) return specialCases[lower]

  // Default: capitalize each word
  return genre
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
