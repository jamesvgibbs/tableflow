/**
 * Random creative event name generator
 * Combines an adjective with a noun to create fun, memorable event names
 */

const adjectives = [
  'Cosmic', 'Velvet', 'Electric', 'Midnight', 'Golden',
  'Neon', 'Crystal', 'Mystic', 'Turbo', 'Funky',
  'Groovy', 'Radical', 'Epic', 'Legendary', 'Secret',
  'Stellar', 'Magnetic', 'Vibrant', 'Luminous', 'Infinite',
  'Thunder', 'Phoenix', 'Aurora', 'Emerald', 'Sapphire',
  'Quantum', 'Galactic', 'Tropical', 'Arctic', 'Solar',
  'Lunar', 'Crimson', 'Azure', 'Amber', 'Jade',
]

const nouns = [
  'Fiesta', 'Gathering', 'Shindig', 'Jamboree', 'Bash',
  'Soiree', 'Mixer', 'Rendezvous', 'Hangout', 'Huddle',
  'Summit', 'Rally', 'Meetup', 'Assembly', 'Celebration',
  'Roundtable', 'Symposium', 'Gala', 'Festival', 'Jubilee',
  'Bonanza', 'Extravaganza', 'Carnival', 'Showcase', 'Reunion',
  'Encounter', 'Exchange', 'Forum', 'Conclave', 'Convention',
]

/**
 * Generates a random creative event name
 * @returns A name like "Cosmic Fiesta" or "Velvet Gathering"
 */
export function generateEventName(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  return `${adj} ${noun}`
}
