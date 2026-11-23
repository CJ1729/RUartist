// Ruartist constants and seed data.
// The seed artists below are sample profiles for demonstration. Remove or replace them before launch.

export const CITIES = ['Hyderabad', 'Tirupati', 'Bangalore', 'Chennai', 'Mumbai'];
export const TEXTURES = ['Husky', 'Smooth', 'Raspy', 'Airy', 'Deep'];
export const VIBES = ['Soulful/High-Feel', 'Romantic', 'Energetic', 'Raw/Folk'];
export const TYPES = ['Female', 'Male', 'Band'];
export const LANGUAGES = ['Telugu', 'Hindi', 'English', 'Tamil', 'Kannada'];
export const EXPERIENCE = ['<1 yr', '1-3 yrs', '3-5 yrs', '5+ yrs'];

export const BUDGET_MIN = 1500;
export const BUDGET_MAX = 25000;
export const MAX_TEXTURE_TAGS = 3;
export const MAX_TRACKS = 2;

// Money rules. Change these in one place.
export const PA_FEE = 2000; // Stage add-on: artist brings PA speakers and mics
export const PLATFORM_FEE_RATE = 0.05; // Ruartist booking fee, shown as its own line at checkout
export const ROYALTY_UPFRONT_RATE = 0.6; // Royalty split: producer pays 60% of the flat fee upfront...
export const ROYALTY_SHARE_PERCENT = 10; // ...and the artist keeps this share of the song's royalties
export const NEW_ARTIST_RATING = 4.0; // Neutral rating used for ranking until a new artist has reviews

// Bump when seed artists are added, so returning visitors receive the new ones.
export const SEED_VERSION = 2;

/* ---------- Tag groups ----------
   Each group: key, label, options, max (tags allowed per sample), quick (shown as the
   always-visible filter row), endorse (hosts can verify it after a booking). */
export const MUSIC_GROUPS = [
  { key: 'texture', label: 'Vocal texture', options: TEXTURES, max: 3, quick: true, endorse: true },
  { key: 'vibe', label: 'Feel / vibe', options: VIBES, max: 4, endorse: true },
];

export const FILM_ROLES = [
  {
    id: 'Character Artist', label: 'Character artists', single: 'Character artist', icon: 'mask',
    blurb: 'Actors for films, shorts, ads and web series', rateLabel: 'per shoot day',
    dateLabel: 'First shoot day', daysLabel: 'Shoot days', sampleNoun: 'Audition clip', genders: true,
    briefLabel: 'Character brief / script notes',
    briefPlaceholder: 'e.g. Police inspector in his 40s, two scenes in Telugu, shooting in Gachibowli.',
    groups: [
      { key: 'character', label: 'Character type', options: ['Lead', 'Supporting', 'Villain', 'Comedy', 'Parent/Elder', 'Cop/Uniform', 'Rural/Folk', 'Urban/Modern'], max: 3, quick: true, endorse: true },
      { key: 'acting', label: 'Acting style', options: ['Intense', 'Naturalistic', 'Comic timing', 'Dramatic', 'Method'], max: 2, endorse: true },
      { key: 'skills', label: 'Skills', options: ['Own dubbing', 'Dance', 'Action/Stunts', 'Horse riding', 'Swimming', 'Driving'], max: 4, endorse: true },
      { key: 'age', label: 'Playing age', options: ['18-25', '25-35', '35-50', '50+'], max: 2, endorse: false },
    ],
    addons: [
      { id: 'dub', label: 'Dubbing in own voice (post-production)', price: 3000, perDay: false },
      { id: 'look', label: 'Look test / costume trial', price: 2000, perDay: false },
    ],
  },
  {
    id: 'Editor', label: 'Editors', single: 'Editor', icon: 'scissors',
    blurb: 'Cutting for films, ads, music videos and reels', rateLabel: 'per edit day',
    dateLabel: 'Delivery date', daysLabel: 'Edit days', sampleNoun: 'Edit sample', genders: false,
    briefLabel: 'Project brief and references',
    briefPlaceholder: 'e.g. 3-minute Kannada music video, footage ready, reference: fast rhythmic cuts.',
    groups: [
      { key: 'genre', label: 'Project type', options: ['Feature film', 'Short film', 'Ad/Commercial', 'Music video', 'Documentary', 'Wedding film', 'Social reels'], max: 3, quick: true, endorse: true },
      { key: 'editStyle', label: 'Editing style', options: ['Fast-cut', 'Slow-burn', 'Rhythm/Music-driven', 'Narrative', 'Trailer/Promo'], max: 2, endorse: true },
      { key: 'software', label: 'Software', options: ['Premiere Pro', 'DaVinci Resolve', 'Final Cut Pro', 'Avid Media Composer', 'After Effects'], max: 3, endorse: false },
      { key: 'post', label: 'Post skills', options: ['Color grading', 'Sound mix', 'Motion graphics/VFX', 'Subtitles'], max: 3, endorse: true },
    ],
    addons: [
      { id: 'grade', label: 'Color grade', price: 4000, perDay: false },
      { id: 'subs', label: 'Subtitles in one language', price: 1500, perDay: false },
      { id: 'rev', label: 'Extra revision round', price: 2000, perDay: false },
    ],
  },
  {
    id: 'Cinematographer', label: 'Cinematographers', single: 'Cinematographer', icon: 'camera',
    blurb: 'DOPs and camera operators', rateLabel: 'per shoot day',
    dateLabel: 'First shoot day', daysLabel: 'Shoot days', sampleNoun: 'Showreel clip', genders: false,
    briefLabel: 'Shoot brief and references',
    briefPlaceholder: 'e.g. 30-second perfume ad, one location in Bandra, warm golden-hour look.',
    groups: [
      { key: 'look', label: 'Look', options: ['Natural light', 'Low-key/Noir', 'High-key', 'Teal & Orange', 'Warm/Golden', 'Monochrome'], max: 3, quick: true, endorse: true },
      { key: 'camera', label: 'Camera style', options: ['Handheld', 'Gimbal/Steadicam', 'Static/Tripod', 'Aerial/Drone'], max: 3, endorse: true },
      { key: 'gear', label: 'Camera system', options: ['ARRI Alexa', 'RED', 'Sony FX/Venice', 'Blackmagic', 'Canon Cinema', 'Mirrorless'], max: 3, endorse: false },
      { key: 'format', label: 'Project type', options: ['Feature film', 'Short film', 'Ad/Commercial', 'Music video', 'Documentary', 'Wedding film'], max: 3, endorse: true },
    ],
    addons: [
      { id: 'kit', label: 'Own camera and lens kit', price: 8000, perDay: true },
      { id: 'drone', label: 'Drone with licensed pilot', price: 6000, perDay: true },
      { id: 'lights', label: 'Lighting kit and gaffer', price: 5000, perDay: true },
    ],
  },
];
export const FILM_GENDERS = ['Female', 'Male'];
export const roleById = (id) => FILM_ROLES.find((r) => r.id === id) || FILM_ROLES[0];

export const AVATAR_COLORS =['#6B3FA0', '#1E6B73', '#B5462E', '#3D5A99', '#8A5A00', '#2F6B3A', '#7A2E5A', '#4A4F8C'];

export const SEED_ARTISTS = [
  {
    id: 'a1', name: 'Ananya Rao', type: 'Female', city: 'Hyderabad', experience: '3-5 yrs',
    languages: ['Telugu', 'Hindi', 'English'], rating: 4.8, reviews: 38, color: '#6B3FA0',
    bio: 'Playback-style vocalist singing Telugu and Hindi melodies. Unplugged sets for birthdays, sangeets and cafés, and clean studio vocals for indie producers.',
    stagePrice: 6000, studioPrice: 4500,
    stagePackage: '90-minute acoustic set with a guitarist',
    studioPackage: '1 lead vocal, 2 revisions, dry and tuned stems',
    availability: [2, 5, 9, 12, 16, 20],
    endorsements: { Husky: 14, 'Soulful/High-Feel': 11, Romantic: 9, Smooth: 6, Airy: 3 },
    tracks: [
      { id: 'a1t1', title: 'Monsoon Letters', tags: ['Husky', 'Soulful/High-Feel', 'Hindi'] },
      { id: 'a1t2', title: 'Gulabi Sky', tags: ['Smooth', 'Romantic', 'Telugu'] },
      { id: 'a1t3', title: 'Late Night Chai', tags: ['Airy', 'Romantic', 'English'] },
    ],
  },
  {
    id: 'a2', name: 'Karthik Menon', type: 'Male', city: 'Bangalore', experience: '5+ yrs',
    languages: ['Kannada', 'Tamil', 'English'], rating: 4.7, reviews: 61, color: '#1E6B73',
    bio: 'Rock and indie vocalist who has fronted pub gigs across Bangalore for years. Brings big energy to parties and gritty, layered vocals to studio work.',
    stagePrice: 9000, studioPrice: 7000,
    stagePackage: '2-hour live set with backing tracks',
    studioPackage: 'Lead and harmony vocals, 3 revisions',
    availability: [3, 4, 10, 11, 17, 24],
    endorsements: { Raspy: 19, Energetic: 16, Deep: 8, 'Soulful/High-Feel': 5 },
    tracks: [
      { id: 'a2t1', title: 'Highway Hum', tags: ['Raspy', 'Energetic', 'Kannada'] },
      { id: 'a2t2', title: 'Ember', tags: ['Deep', 'Soulful/High-Feel', 'English'] },
    ],
  },
  {
    id: 'a3', name: 'The Charminar Collective', type: 'Band', city: 'Hyderabad', experience: '3-5 yrs',
    languages: ['Telugu', 'Hindi'], rating: 4.6, reviews: 27, color: '#B5462E',
    bio: 'Five-piece fusion band mixing Deccani folk with funk. Built for weddings, college fests and rooftop parties that need a full stage sound.',
    stagePrice: 18000, studioPrice: 12000,
    stagePackage: '2-hour show, 5 members, own instruments',
    studioPackage: 'Full band arrangement and recording of 1 song',
    availability: [6, 7, 13, 14, 21],
    endorsements: { Energetic: 12, Raspy: 7, 'Raw/Folk': 9, Smooth: 4, Deep: 3 },
    tracks: [
      { id: 'a3t1', title: 'Old City Groove', tags: ['Raspy', 'Energetic', 'Hindi'] },
      { id: 'a3t2', title: 'Pearl Lane', tags: ['Smooth', 'Raw/Folk', 'Telugu'] },
      { id: 'a3t3', title: 'Lamp Bazaar', tags: ['Deep', 'Energetic', 'Telugu'] },
    ],
  },
  {
    id: 'a4', name: 'Lakshmi Priya', type: 'Female', city: 'Tirupati', experience: '1-3 yrs',
    languages: ['Telugu', 'Tamil'], rating: 4.9, reviews: 14, color: '#8A5A00',
    bio: 'Carnatic-trained singer who performs devotional and light-classical sets for family functions, and records airy, clear vocals for producers.',
    stagePrice: 2500, studioPrice: 2000,
    stagePackage: '1-hour devotional or light-classical set',
    studioPackage: '1 vocal track with harmonies, 2 revisions',
    availability: [1, 3, 8, 15, 22],
    endorsements: { Airy: 9, 'Soulful/High-Feel': 8, Smooth: 5, 'Raw/Folk': 2 },
    tracks: [
      { id: 'a4t1', title: 'Seven Hills Dawn', tags: ['Airy', 'Soulful/High-Feel', 'Telugu'] },
      { id: 'a4t2', title: 'Temple Lights', tags: ['Smooth', 'Raw/Folk', 'Tamil'] },
    ],
  },
  {
    id: 'a5', name: 'Arjun Iyer', type: 'Male', city: 'Chennai', experience: '1-3 yrs',
    languages: ['Tamil', 'English'], rating: 4.5, reviews: 19, color: '#3D5A99',
    bio: 'Smooth Tamil and English vocalist for intimate parties and acoustic covers. Comfortable with romantic ballads and lo-fi studio sessions.',
    stagePrice: 3500, studioPrice: 3000,
    stagePackage: '75-minute acoustic set, solo with guitar',
    studioPackage: '1 lead vocal, 2 revisions, comped takes',
    availability: [2, 6, 9, 13, 20, 27],
    endorsements: { Smooth: 10, Romantic: 8, Husky: 4, Deep: 3, 'Raw/Folk': 2 },
    tracks: [
      { id: 'a5t1', title: 'Marina Wind', tags: ['Smooth', 'Romantic', 'Tamil'] },
      { id: 'a5t2', title: 'Filter Coffee', tags: ['Husky', 'Raw/Folk', 'Tamil'] },
      { id: 'a5t3', title: 'Velvet', tags: ['Deep', 'Romantic', 'English'] },
    ],
  },
  {
    id: 'a6', name: 'Madras Mavericks', type: 'Band', city: 'Chennai', experience: '5+ yrs',
    languages: ['Tamil', 'English'], rating: 4.8, reviews: 52, color: '#2F6B3A',
    bio: 'Six-piece party band with a horn section, playing Tamil dance numbers and English covers. Known for packed dance floors at receptions.',
    stagePrice: 22000, studioPrice: 15000,
    stagePackage: '3-hour show, 6 members, own sound engineer',
    studioPackage: 'Horn and rhythm section recording for 1 song',
    availability: [5, 12, 19, 26],
    endorsements: { Energetic: 21, Raspy: 9, Deep: 7, 'Soulful/High-Feel': 6 },
    tracks: [
      { id: 'a6t1', title: 'Kuthu Circuit', tags: ['Raspy', 'Energetic', 'Tamil'] },
      { id: 'a6t2', title: 'Harbour Lights', tags: ['Deep', 'Soulful/High-Feel', 'English'] },
    ],
  },
  {
    id: 'a7', name: 'Zoya Shaikh', type: 'Female', city: 'Mumbai', experience: '3-5 yrs',
    languages: ['Hindi', 'English'], rating: 4.7, reviews: 44, color: '#7A2E5A',
    bio: 'Bollywood and soul singer playing lounges and private parties around Mumbai. Records husky, emotive toplines for independent producers.',
    stagePrice: 8000, studioPrice: 6500,
    stagePackage: '2 × 45-minute sets with a keyboard player',
    studioPackage: 'Topline vocal and ad-libs, 3 revisions',
    availability: [1, 4, 8, 11, 18, 25],
    endorsements: { Husky: 17, Romantic: 12, Raspy: 6, Airy: 5, 'Soulful/High-Feel': 9 },
    tracks: [
      { id: 'a7t1', title: 'Bandra Rain', tags: ['Husky', 'Romantic', 'Hindi'] },
      { id: 'a7t2', title: 'Local Train Heart', tags: ['Raspy', 'Energetic', 'Hindi'] },
      { id: 'a7t3', title: 'Sea Link', tags: ['Airy', 'Soulful/High-Feel', 'English'] },
    ],
  },
  {
    id: 'a8', name: "Rohan D'Souza", type: 'Male', city: 'Mumbai', experience: '<1 yr',
    languages: ['Hindi', 'English'], rating: 4.4, reviews: 6, color: '#4A4F8C',
    bio: 'New singer-songwriter playing open mics.',
    stagePrice: 1800, studioPrice: 1500,
    stagePackage: '1-hour acoustic set',
    studioPackage: '1 vocal track, 1 revision',
    availability: [2, 3, 9, 10, 16],
    endorsements: { Smooth: 3, Husky: 2, 'Raw/Folk': 2 },
    tracks: [
      { id: 'a8t1', title: 'First Light', tags: ['Smooth', 'Raw/Folk', 'English'] },
      { id: 'a8t2', title: 'Kinara', tags: ['Husky', 'Soulful/High-Feel', 'Hindi'] },
    ],
  },
];

// Sample film and video professionals (category: 'film'). Rates are per day.
export const FILM_SEED_ARTISTS = [
  {
    id: 'f1', category: 'film', role: 'Character Artist', gender: 'Male', name: 'Pranav Reddy', city: 'Hyderabad', experience: '5+ yrs',
    languages: ['Telugu', 'Hindi', 'English'], rating: 4.8, reviews: 33, color: '#4A4F8C',
    bio: 'Theatre-trained character artist with years of Telugu features and web series. Known for menacing villains and tough cops, and dubs his own voice.',
    rate: 8000, packageDetail: 'Up to 10 hours on set, including make-up and costume time',
    availability: [3, 4, 5, 11, 12, 18],
    endorsements: { Villain: 15, Intense: 13, 'Cop/Uniform': 9, 'Own dubbing': 8, 'Action/Stunts': 5 },
    samples: [
      { id: 'f1s1', title: 'Interrogation room', tags: ['Villain', 'Intense', 'Own dubbing', '35-50', 'Telugu'] },
      { id: 'f1s2', title: 'Night patrol', tags: ['Cop/Uniform', 'Method', 'Action/Stunts', '35-50', 'Hindi'] },
    ],
  },
  {
    id: 'f2', category: 'film', role: 'Character Artist', gender: 'Female', name: 'Kavya Nair', city: 'Chennai', experience: '3-5 yrs',
    languages: ['Tamil', 'English', 'Telugu'], rating: 4.7, reviews: 21, color: '#7A2E5A',
    bio: 'Lead and supporting roles in Tamil shorts, ads and two web series. Natural on camera, quick with comedy, and a trained Bharatanatyam dancer.',
    rate: 6000, packageDetail: 'Up to 10 hours on set, one costume change included',
    availability: [2, 6, 9, 13, 16, 23],
    endorsements: { Lead: 11, Naturalistic: 10, 'Comic timing': 8, Dance: 7, 'Urban/Modern': 5 },
    samples: [
      { id: 'f2s1', title: 'Flatmates, first morning', tags: ['Lead', 'Urban/Modern', 'Naturalistic', '25-35', 'Tamil'] },
      { id: 'f2s2', title: 'Wedding mix-up', tags: ['Comedy', 'Comic timing', 'Dance', '25-35', 'English'] },
    ],
  },
  {
    id: 'f3', category: 'film', role: 'Character Artist', gender: 'Male', name: 'Venkatesh Murthy', city: 'Tirupati', experience: '5+ yrs',
    languages: ['Telugu', 'Kannada'], rating: 4.9, reviews: 12, color: '#8A5A00',
    bio: 'Veteran stage actor who now plays fathers, village elders and comic uncles in Telugu and Kannada films.',
    rate: 3500, packageDetail: 'Up to 8 hours on set within 50 km of Tirupati',
    availability: [1, 2, 8, 9, 15],
    endorsements: { 'Parent/Elder': 9, 'Rural/Folk': 8, Dramatic: 6, Comedy: 4 },
    samples: [
      { id: 'f3s1', title: "Father's farewell", tags: ['Parent/Elder', 'Dramatic', 'Own dubbing', '50+', 'Telugu'] },
      { id: 'f3s2', title: 'Village panchayat', tags: ['Rural/Folk', 'Comedy', 'Naturalistic', '50+', 'Kannada'] },
    ],
  },
  {
    id: 'f4', category: 'film', role: 'Character Artist', gender: 'Female', name: 'Simran Kaur', city: 'Mumbai', experience: '1-3 yrs',
    languages: ['Hindi', 'English'], rating: 4.5, reviews: 7, color: '#B5462E',
    bio: 'Mumbai-based actor for ads, music videos and indie shorts. Comfortable with dance numbers and driving scenes.',
    rate: 4000, packageDetail: 'Up to 10 hours on set',
    availability: [3, 7, 10, 14, 21],
    endorsements: { Supporting: 4, Naturalistic: 3, Dance: 4 },
    samples: [
      { id: 'f4s1', title: 'Coffee ad, take 3', tags: ['Supporting', 'Urban/Modern', 'Naturalistic', '18-25', 'Hindi'] },
      { id: 'f4s2', title: 'Road trip scene', tags: ['Lead', 'Driving', 'Dance', '18-25', 'English'] },
    ],
  },
  {
    id: 'f5', category: 'film', role: 'Editor', name: 'Nikhil Joshi', city: 'Mumbai', experience: '5+ yrs',
    languages: ['Hindi', 'English'], rating: 4.8, reviews: 40, color: '#1E6B73',
    bio: 'Feature and ad-film editor who cuts trailers and promos for independent releases. Grades in DaVinci Resolve and delivers broadcast-ready masters.',
    rate: 6000, packageDetail: '8-hour edit day, project files and exports included',
    availability: [1, 2, 3, 8, 9, 10],
    endorsements: { Narrative: 12, 'Trailer/Promo': 10, 'Color grading': 9, 'Feature film': 8, 'Ad/Commercial': 6 },
    samples: [
      { id: 'f5s1', title: 'Indie thriller trailer', tags: ['Feature film', 'Trailer/Promo', 'DaVinci Resolve', 'Color grading'] },
      { id: 'f5s2', title: 'Bank ad, 45 seconds', tags: ['Ad/Commercial', 'Narrative', 'Avid Media Composer', 'Sound mix'] },
    ],
  },
  {
    id: 'f6', category: 'film', role: 'Editor', name: 'Sneha Pillai', city: 'Bangalore', experience: '3-5 yrs',
    languages: ['Kannada', 'English', 'Tamil'], rating: 4.7, reviews: 26, color: '#6B3FA0',
    bio: 'Music-video and social-content editor. Beat-synced cuts, kinetic type and quick turnarounds for brands and independent musicians.',
    rate: 4000, packageDetail: '8-hour edit day, 2 revision rounds',
    availability: [2, 4, 6, 9, 11, 13],
    endorsements: { 'Rhythm/Music-driven': 13, 'Fast-cut': 11, 'Music video': 10, 'Motion graphics/VFX': 7, 'Social reels': 6 },
    samples: [
      { id: 'f6s1', title: 'Indie pop music video', tags: ['Music video', 'Rhythm/Music-driven', 'Premiere Pro', 'Motion graphics/VFX'] },
      { id: 'f6s2', title: 'Sneaker launch reels', tags: ['Social reels', 'Fast-cut', 'After Effects', 'Subtitles'] },
    ],
  },
  {
    id: 'f7', category: 'film', role: 'Editor', name: 'Imran Sheikh', city: 'Hyderabad', experience: '1-3 yrs',
    languages: ['Hindi', 'Telugu', 'English'], rating: 4.6, reviews: 9, color: '#2F6B3A',
    bio: 'Short-film and documentary editor who likes slow, patient storytelling. Also cuts wedding films and adds subtitles.',
    rate: 2500, packageDetail: '8-hour edit day',
    availability: [1, 3, 5, 7, 12],
    endorsements: { 'Slow-burn': 5, Documentary: 4, 'Short film': 4, Subtitles: 3 },
    samples: [
      { id: 'f7s1', title: 'Old City weavers (doc)', tags: ['Documentary', 'Slow-burn', 'Final Cut Pro', 'Subtitles'] },
      { id: 'f7s2', title: 'Last bus home (short)', tags: ['Short film', 'Narrative', 'Premiere Pro', 'Color grading'] },
    ],
  },
  {
    id: 'f8', category: 'film', role: 'Cinematographer', name: 'Arvind Krishnan', city: 'Chennai', experience: '5+ yrs',
    languages: ['Tamil', 'English'], rating: 4.9, reviews: 31, color: '#3D5A99',
    bio: 'DOP for Tamil features and national ad campaigns. Moody low-key night work and polished commercial looks.',
    rate: 15000, packageDetail: '10-hour shoot day as DOP, pre-production recce call included',
    availability: [4, 5, 12, 13, 19, 20],
    addons: [
      { id: 'kit', label: 'Own ARRI Alexa kit with prime lenses', price: 20000, perDay: true },
      { id: 'lights', label: 'Lighting kit and gaffer', price: 7000, perDay: true },
    ],
    endorsements: { 'Low-key/Noir': 14, 'Teal & Orange': 9, 'Gimbal/Steadicam': 8, 'Feature film': 10, 'Ad/Commercial': 7 },
    samples: [
      { id: 'f8s1', title: 'Night market chase', tags: ['Low-key/Noir', 'Handheld', 'ARRI Alexa', 'Feature film'] },
      { id: 'f8s2', title: 'Coastal perfume ad', tags: ['Teal & Orange', 'Gimbal/Steadicam', 'RED', 'Ad/Commercial'] },
    ],
  },
  {
    id: 'f9', category: 'film', role: 'Cinematographer', name: 'Deepa Rao', city: 'Hyderabad', experience: '3-5 yrs',
    languages: ['Telugu', 'Hindi', 'English'], rating: 4.7, reviews: 18, color: '#C93C27',
    bio: 'Documentary and music-video cinematographer who works with natural and golden-hour light and a small, fast crew.',
    rate: 9000, packageDetail: '10-hour shoot day as DOP or camera operator',
    availability: [2, 3, 9, 10, 16, 17],
    addons: [
      { id: 'kit', label: 'Own Sony FX6 kit with lenses', price: 7000, perDay: true },
      { id: 'drone', label: 'Drone with licensed pilot', price: 6000, perDay: true },
    ],
    endorsements: { 'Natural light': 10, 'Warm/Golden': 9, Handheld: 7, Documentary: 8, 'Music video': 5 },
    samples: [
      { id: 'f9s1', title: 'Monsoon farmers (doc)', tags: ['Natural light', 'Handheld', 'Sony FX/Venice', 'Documentary'] },
      { id: 'f9s2', title: 'Folk singer, golden hour', tags: ['Warm/Golden', 'Static/Tripod', 'Canon Cinema', 'Music video'] },
    ],
  },
  {
    id: 'f10', category: 'film', role: 'Cinematographer', name: 'Farhan Ali', city: 'Mumbai', experience: '1-3 yrs',
    languages: ['Hindi', 'English'], rating: 4.5, reviews: 11, color: '#1E6B73',
    bio: 'Wedding and music-video shooter with a licensed drone. Bright, clean high-key looks and smooth gimbal movement.',
    rate: 5000, packageDetail: '10-hour shoot day, raw footage handed over the same night',
    availability: [1, 5, 6, 12, 13, 26],
    addons: [
      { id: 'kit', label: 'Own Blackmagic kit with lenses', price: 4000, perDay: true },
      { id: 'drone', label: 'Drone (he is the licensed pilot)', price: 3000, perDay: true },
    ],
    endorsements: { 'High-key': 6, 'Aerial/Drone': 8, 'Gimbal/Steadicam': 5, 'Wedding film': 7 },
    samples: [
      { id: 'f10s1', title: 'Lakeside wedding', tags: ['High-key', 'Aerial/Drone', 'Blackmagic', 'Wedding film'] },
      { id: 'f10s2', title: 'Rooftop rapper', tags: ['Teal & Orange', 'Gimbal/Steadicam', 'Mirrorless', 'Music video'] },
    ],
  },
];
