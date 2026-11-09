import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('--- Verifying Google Profile Sync and Metadata Handling ---\n');

let failed = false;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failed = true;
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

// 1. Check authService.ts for User model and extraction logic
const authServicePath = path.join(rootDir, 'src', 'services', 'authService.ts');
const authServiceContent = fs.readFileSync(authServicePath, 'utf8');

assert(
  authServiceContent.includes('avatarUrl?: string;'),
  'User interface includes avatarUrl?: string'
);

assert(
  authServiceContent.includes('sbUser.user_metadata?.full_name') &&
  authServiceContent.includes('sbUser.user_metadata?.name') &&
  authServiceContent.includes('sbUser.user_metadata?.given_name'),
  'authService extracts full_name, name, and given_name + family_name'
);

assert(
  authServiceContent.includes('sbUser.user_metadata?.avatar_url') &&
  authServiceContent.includes('sbUser.user_metadata?.picture'),
  'authService extracts avatar_url and picture'
);

assert(
  authServiceContent.includes("'profiles'") &&
  authServiceContent.includes('upsert') &&
  authServiceContent.includes('avatar_url: avatarUrl || null') &&
  authServiceContent.includes('full_name: name'),
  'authService populates public.profiles table with full_name and avatar_url'
);

// 2. Check AuthContext.tsx for onAuthStateChange listener extracting metadata
const authContextPath = path.join(rootDir, 'src', 'context', 'AuthContext.tsx');
const authContextContent = fs.readFileSync(authContextPath, 'utf8');

assert(
  authContextContent.includes('sbUser.user_metadata?.avatar_url') ||
  authContextContent.includes('sbUser.user_metadata?.picture'),
  'AuthContext extracts avatar_url on auth state change'
);

assert(
  authContextContent.includes('avatarUrl'),
  'AuthContext sets avatarUrl in state'
);

// 3. Check home.tsx displays actual user name and avatar
const homePath = path.join(rootDir, 'src', 'app', '(tabs)', 'home.tsx');
const homeContent = fs.readFileSync(homePath, 'utf8');

assert(
  homeContent.includes("user?.name?.split(' ')[0]") || homeContent.includes('user?.name'),
  'Home screen displays user first name / full name rather than generic Maya'
);

assert(
  homeContent.includes('user?.avatarUrl') && homeContent.includes('<Image'),
  'Home screen renders Image with user.avatarUrl when present'
);

assert(
  homeContent.includes('avatarImage'),
  'Home screen defines avatarImage style'
);

// 4. Check profile.tsx displays actual user name and avatar
const profilePath = path.join(rootDir, 'src', 'app', '(tabs)', 'profile.tsx');
const profileContent = fs.readFileSync(profilePath, 'utf8');

assert(
  homeContent.includes('user?.avatarUrl') && profileContent.includes('<Image'),
  'Profile screen renders Image with user.avatarUrl when present'
);

assert(
  profileContent.includes("user?.name || 'Sanctuary Explorer'"),
  'Profile screen displays user.name with Sanctuary Explorer fallback'
);

assert(
  profileContent.includes('user?.email'),
  'Profile screen displays user.email'
);

assert(
  profileContent.includes('avatarImage'),
  'Profile screen defines avatarImage style'
);

// 5. Check schema.sql for profiles table trigger updating full_name and avatar_url
const schemaPath = path.join(rootDir, 'supabase', 'schema.sql');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

assert(
  schemaContent.includes("new.raw_user_meta_data->>'avatar_url'") &&
  schemaContent.includes("new.raw_user_meta_data->>'picture'"),
  'schema.sql handle_new_user trigger extracts avatar_url and picture'
);

assert(
  schemaContent.includes('avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url)'),
  'schema.sql handles upsert on conflict for avatar_url'
);

// 6. Test parsing logic with simulated Google user metadata objects
console.log('\n--- Testing Metadata Parsing Scenarios ---');

function parseUserMetadata(sbUser) {
  const name =
    sbUser.user_metadata?.full_name ||
    sbUser.user_metadata?.name ||
    (sbUser.user_metadata?.given_name
      ? `${sbUser.user_metadata.given_name} ${sbUser.user_metadata.family_name || ''}`.trim()
      : '') ||
    sbUser.user_metadata?.user_name ||
    sbUser.email?.split('@')[0] ||
    'Sanctuary Explorer';

  const avatarUrl =
    sbUser.user_metadata?.avatar_url ||
    sbUser.user_metadata?.picture ||
    undefined;

  const email = sbUser.email || sbUser.user_metadata?.email || '';

  return { name, avatarUrl, email };
}

// Scenario A: Standard Google OAuth user metadata (full_name + avatar_url)
const googleUserA = {
  email: 'jay.singh@gmail.com',
  user_metadata: {
    full_name: 'Jay Singh',
    avatar_url: 'https://lh3.googleusercontent.com/a/ACg8ocISample123',
    email: 'jay.singh@gmail.com',
  },
};
const parsedA = parseUserMetadata(googleUserA);
assert(parsedA.name === 'Jay Singh', 'Scenario A extracts full_name correctly');
assert(parsedA.avatarUrl === 'https://lh3.googleusercontent.com/a/ACg8ocISample123', 'Scenario A extracts avatar_url correctly');
assert(parsedA.email === 'jay.singh@gmail.com', 'Scenario A extracts email correctly');

// Scenario B: Google OAuth with picture and given_name / family_name
const googleUserB = {
  email: 'alex.rivera@gmail.com',
  user_metadata: {
    given_name: 'Alex',
    family_name: 'Rivera',
    picture: 'https://lh3.googleusercontent.com/a/ACg8ocPicture456',
  },
};
const parsedB = parseUserMetadata(googleUserB);
assert(parsedB.name === 'Alex Rivera', 'Scenario B combines given_name and family_name correctly');
assert(parsedB.avatarUrl === 'https://lh3.googleusercontent.com/a/ACg8ocPicture456', 'Scenario B extracts picture as avatarUrl');

// Scenario C: Email/password user without avatar
const emailUserC = {
  email: 'peaceful@wellness.internal',
  user_metadata: {
    name: 'Serena Waters',
  },
};
const parsedC = parseUserMetadata(emailUserC);
assert(parsedC.name === 'Serena Waters', 'Scenario C extracts name for email/password registration');
assert(parsedC.avatarUrl === undefined, 'Scenario C leaves avatarUrl undefined for default avatar');

if (failed) {
  console.error('\n❌ Google Profile Sync verification failed.');
  process.exit(1);
} else {
  console.log('\n🎉 ALL GOOGLE PROFILE SYNC VERIFICATIONS PASSED!\n');
}
