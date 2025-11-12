// Custom sort order for admin pages (based on your specified order)
export const MEMBER_SORT_ORDER = [
  'Allie Young',
  'Eden Tan',
  'Lindsey Lee',
  'Giancarlo Novelli',
  'Jayson Tian',
  'Mark Lin',
  'Sean Chan',
  'Sidney Muntean',
  'Abby Kearny',
  'Anish Thalamati',
  'Anusha Chatterjee',
  'Quinn Kiefer',
  'Valerie Fan',
  'Arushi Gupta',
  'Mahi Ghia',
  'Sophie Liu',
  'Anirudh Chatterjee',
  'Charlotte Chiang',
  'Huixi Lee',
  'Ash Barrett',
  'Leilani Pradis',
  'Ming Lo',
  'Layla AlGhamdi',
  'Brandon Bao',
  'Dilnar Yu',
  'Jonathan Gossaye',
  'Elise Wu',
  'Samantha Waugh',
  'Natalie Tan',
  'Yashas Shashidhara',
  'Saathvik Pai',
  'Kit He',
  'Rahul Nanda',
  'Sonali Vaid',
  'Barima Adusei-Poku',
  'Ruhaan Mahindru',
  'Fiona Macleitch',
  'Kera Chang',
  'Sharan Subramanian',
  'Kevin He',
  'Armaan Bassi',
  'Joanna Bui',
  'Beck Peterson',
  'Elijah Bautista',
  'Joseph Wang',
  'Gary Li',
  'Edward Ke',
];

export function sortMembersByCustomOrder<T extends { name: string }>(members: T[]): T[] {
  const sorted = [...members];
  return sorted.sort((a, b) => {
    const indexA = MEMBER_SORT_ORDER.indexOf(a.name);
    const indexB = MEMBER_SORT_ORDER.indexOf(b.name);

    // If both are in the custom order, sort by that order
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }

    // If only one is in the custom order, prioritize it
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    // If neither is in the custom order, sort alphabetically
    return a.name.localeCompare(b.name);
  });
}
