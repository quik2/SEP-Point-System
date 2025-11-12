// Map member names to their photo filenames
export function getPhotoPath(memberName: string): string {
  // Extract first name and convert to lowercase
  const firstName = memberName.split(' ')[0].toLowerCase();

  // Members with JPG files instead of AVIF
  const jpgMembers = ['abby', 'eden', 'lindsey', 'allie'];

  // Special cases for nicknames or different filenames based on the photos you uploaded
  const nameMapping: Record<string, string> = {
    // Full names as filenames
    'jayson tian': 'jayson tian',
    'mark lin': 'mark lin',
    'sidney muntean': 'sidney muntean',
    'sean chan': 'sean chan',

    // Nicknames or shortened names
    'anirudh chatterjee': 'ani',
    'giancarlo novelli': 'giancarlo',
    'anish thalamati': 'anish',
    'anusha chatterjee': 'anusha',
    'franco cachay': 'franco',

    // First name mappings
    'allie young': 'allie',
    'abby kearny': 'abby',
    'eden tan': 'eden',
    'lindsey lee': 'lindsey',
    'quinn': 'quinn',
    'arushi': 'arushi',
    'ash': 'ash',
    'charlotte': 'charlotte',
    'edward': 'edward',
    'huixi': 'huixi',
    'mahi': 'mahi',
    'ming': 'ming',
    'sophie': 'sophie',
    'aryan': 'aryan',
    'brandon': 'brandon',
    'dilnar': 'dilnar',
    'elise': 'elise',
    'johnathan': 'johnathan',
    'kit': 'kit',
    'layla': 'layla',
    'natalie': 'natalie',
    'rahul': 'rahul',
    'samantha': 'samantha',
    'saathvik': 'saathvik',
    'ved': 'ved',
    'yashas': 'yashas',
    'armaan': 'armaan',
    'barima': 'barima',
    'beck': 'beck',
    'elijah': 'elijah',
    'fiona': 'fiona',
    'gary': 'gary',
    'joanna': 'joanna',
    'joseph': 'joseph',
    'kera': 'kera',
    'kevin': 'kevin',
    'ruhaan': 'ruhaan',
    'sharan': 'sharan',
    'sonali': 'sonali',
  };

  // Check if there's a specific mapping
  const lowerName = memberName.toLowerCase();
  let photoName = '';

  if (nameMapping[lowerName]) {
    photoName = nameMapping[lowerName];
  } else if (nameMapping[firstName]) {
    photoName = nameMapping[firstName];
  } else {
    photoName = firstName;
  }

  // Determine file extension (jpg for specific members, avif for others)
  const extension = jpgMembers.includes(photoName) ? 'jpg' : 'avif';

  return `/photos/${photoName}.${extension}`;
}

// Fallback if photo doesn't exist
export function getPhotoPathWithFallback(memberName: string): string {
  return getPhotoPath(memberName);
}
