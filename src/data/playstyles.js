export const playstyleNames = [
  'Aggressive Baseliner',
  'Counterpuncher',
  'All-Court Player',
  'Serve-and-Volley Player',
  'Defensive Grinder',
  'Big Server',
  'Heavy Topspin Player',
];

export const playstyles = {
  'Aggressive Baseliner': {
    identity: 'You win by taking court position early, redirecting pace, and turning neutral balls into pressure.',
    strengths: ['First-strike forehand patterns', 'Attacking short balls', 'Dictating from inside the baseline'],
    weaknesses: ['Overhitting before the point is built', 'Low-margin errors under pressure', 'Patience against elite defenders'],
  },
  Counterpuncher: {
    identity: 'You absorb pace, extend rallies, and need gear that stays predictable when the ball is coming in fast.',
    strengths: ['Redirecting speed', 'Passing shots', 'Decision-making under pressure'],
    weaknesses: ['Finishing when given control', 'Getting pushed too deep', 'Passive second-serve returns'],
  },
  'All-Court Player': {
    identity: 'You blend baseline patterns, transition shots, and net pressure, so your gear needs a balanced response everywhere.',
    strengths: ['Varied point construction', 'Net transitions', 'Adapting your gear to multiple shot types'],
    weaknesses: ['Lacking a default pattern under stress', 'Choosing variety over clarity', 'Mid-court indecision'],
  },
  'Serve-and-Volley Player': {
    identity: 'You compress points with serve placement, forward movement, and decisive volley positioning.',
    strengths: ['Short points', 'Net pressure', 'Taking time away'],
    weaknesses: ['Passing-shot exposure', 'Second-serve vulnerability', 'Baseline patience'],
  },
  'Defensive Grinder': {
    identity: 'You make matches physical, defend with discipline, and need comfort and control that hold up deep into long rallies.',
    strengths: ['Consistency', 'Court coverage', 'Mental pressure through ball tolerance'],
    weaknesses: ['Leaving balls short', 'Struggling to end points', 'Getting exposed by net rushes'],
  },
  'Big Server': {
    identity: 'Your serve creates scoreboard pressure, free points, and short-ball opportunities before rallies fully form.',
    strengths: ['Free points', 'Serve plus one', 'Tiebreak pressure'],
    weaknesses: ['Return games drifting', 'Baseline rhythm after serve drops', 'Over-relying on first serve'],
  },
  'Heavy Topspin Player': {
    identity: 'You use shape, height, and rotation, so your setup should help the ball jump without losing depth control.',
    strengths: ['High-margin offense', 'Forehand spin', 'Creating short balls with height'],
    weaknesses: ['Flattening out at the right time', 'Low skidding balls', 'Taking balls early'],
  },
};

export const quizQuestions = [
  {
    id: 'rallyLength',
    question: 'What rally length feels most natural?',
    options: [
      { label: 'Short points, first strike', scores: { 'Big Server': 2, 'Serve-and-Volley Player': 2, 'Aggressive Baseliner': 1 } },
      { label: 'Medium rallies with chances to attack', scores: { 'Aggressive Baseliner': 2, 'All-Court Player': 2, 'Heavy Topspin Player': 1 } },
      { label: 'Long rallies where patience wins', scores: { 'Defensive Grinder': 2, Counterpuncher: 2, 'Heavy Topspin Player': 1 } },
    ],
  },
  {
    id: 'wingStrength',
    question: 'Which wing shapes your game?',
    options: [
      { label: 'Forehand is the weapon', scores: { 'Aggressive Baseliner': 2, 'Heavy Topspin Player': 2, 'Big Server': 1 } },
      { label: 'Backhand redirect is reliable', scores: { Counterpuncher: 2, 'All-Court Player': 1, 'Defensive Grinder': 1 } },
      { label: 'Both sides are balanced', scores: { 'All-Court Player': 2, Counterpuncher: 1, 'Defensive Grinder': 1 } },
    ],
  },
  {
    id: 'serveStrength',
    question: 'How much does your serve help you?',
    options: [
      { label: 'It wins free points', scores: { 'Big Server': 3, 'Serve-and-Volley Player': 1 } },
      { label: 'It starts patterns well', scores: { 'Aggressive Baseliner': 2, 'All-Court Player': 1 } },
      { label: 'It mostly starts rallies', scores: { 'Defensive Grinder': 2, Counterpuncher: 1 } },
    ],
  },
  {
    id: 'netComfort',
    question: 'How comfortable are you at net?',
    options: [
      { label: 'I want to finish there', scores: { 'Serve-and-Volley Player': 3, 'All-Court Player': 2 } },
      { label: 'I come in after earning it', scores: { 'All-Court Player': 2, 'Aggressive Baseliner': 1 } },
      { label: 'I prefer passing from the baseline', scores: { Counterpuncher: 2, 'Defensive Grinder': 2 } },
    ],
  },
  {
    id: 'spinProfile',
    question: 'What ball shape do you trust most?',
    options: [
      { label: 'Heavy topspin and height', scores: { 'Heavy Topspin Player': 3, 'Defensive Grinder': 1 } },
      { label: 'Flat pace through the court', scores: { 'Aggressive Baseliner': 2, 'Big Server': 1 } },
      { label: 'Varied spin, slice, and pace', scores: { 'All-Court Player': 2, Counterpuncher: 1 } },
    ],
  },
  {
    id: 'riskTolerance',
    question: 'What should your gear help most?',
    options: [
      { label: 'Power creates the answer', scores: { 'Aggressive Baseliner': 2, 'Big Server': 2 } },
      { label: 'Consistency and control', scores: { 'Defensive Grinder': 3, Counterpuncher: 2 } },
      { label: 'Controlled power with margin', scores: { 'Heavy Topspin Player': 2, 'All-Court Player': 1 } },
    ],
  },
  {
    id: 'defense',
    question: 'When pulled wide, what happens?',
    options: [
      { label: 'I reset and extend', scores: { 'Defensive Grinder': 3, Counterpuncher: 2 } },
      { label: 'I counter into open space', scores: { Counterpuncher: 3, 'All-Court Player': 1 } },
      { label: 'I look for a running winner', scores: { 'Aggressive Baseliner': 2, 'Heavy Topspin Player': 1 } },
    ],
  },
  {
    id: 'secondServe',
    question: 'What kind of return feel do you like?',
    options: [
      { label: 'Step in and attack', scores: { 'Aggressive Baseliner': 2, 'Big Server': 1, 'All-Court Player': 1 } },
      { label: 'Make a deep return first', scores: { Counterpuncher: 2, 'Defensive Grinder': 2 } },
      { label: 'Chip, charge, or change looks', scores: { 'Serve-and-Volley Player': 2, 'All-Court Player': 2 } },
    ],
  },
  {
    id: 'courtPosition',
    question: 'Where do you prefer to play?',
    options: [
      { label: 'Inside or on the baseline', scores: { 'Aggressive Baseliner': 2, 'Big Server': 1 } },
      { label: 'A step back with time to shape points', scores: { 'Heavy Topspin Player': 2, 'Defensive Grinder': 2 } },
      { label: 'Moving forward whenever possible', scores: { 'Serve-and-Volley Player': 2, 'All-Court Player': 2 } },
    ],
  },
  {
    id: 'weakness',
    question: 'What costs you the most matches?',
    options: [
      { label: 'Too many errors while attacking', scores: { 'Aggressive Baseliner': 2, 'Heavy Topspin Player': 1 } },
      { label: 'Trouble finishing points', scores: { 'Defensive Grinder': 2, Counterpuncher: 2 } },
      { label: 'Return games and baseline exchanges', scores: { 'Big Server': 2, 'Serve-and-Volley Player': 1 } },
    ],
  },
  {
    id: 'budget',
    question: 'What budget feels realistic for a full racket + string setup?',
    options: [
      { label: 'Keep it value-focused under $250', profile: { budgetTier: 'Value', maxSetupPrice: 250 } },
      { label: 'Balanced setup around $250-$330', profile: { budgetTier: 'Balanced', maxSetupPrice: 330 } },
      { label: 'Premium fit matters more than price', profile: { budgetTier: 'Premium', maxSetupPrice: 420 } },
    ],
  },
  {
    id: 'armHealth',
    question: 'Any current arm issues we should protect?',
    options: [
      { label: 'No current elbow, shoulder, or wrist problems', profile: { armIssue: 'None', comfortPriority: 0 } },
      { label: 'Some soreness after playing', profile: { armIssue: 'Mild soreness', comfortPriority: 1 } },
      { label: 'Elbow, shoulder, or wrist pain affects how I play', profile: { armIssue: 'Active pain', comfortPriority: 2 } },
    ],
  },
];

export const quizSliders = [
  {
    id: 'spinIntent',
    label: 'Ball shape',
    lowLabel: 'Flatter drive',
    highLabel: 'Heavy topspin',
    defaultValue: 6,
    scores: { 'Heavy Topspin Player': 2.6, 'Defensive Grinder': 0.7, 'Aggressive Baseliner': -0.4 },
  },
  {
    id: 'powerIntent',
    label: 'Power preference',
    lowLabel: 'I create pace',
    highLabel: 'I want free power',
    defaultValue: 5,
    scores: { 'Big Server': 1.3, 'Aggressive Baseliner': 1.1, Counterpuncher: -0.5 },
  },
  {
    id: 'controlIntent',
    label: 'Control need',
    lowLabel: 'Easy depth',
    highLabel: 'Precise targeting',
    defaultValue: 6,
    scores: { Counterpuncher: 1.4, 'All-Court Player': 1.1, 'Defensive Grinder': 0.9, 'Big Server': -0.4 },
  },
  {
    id: 'rallyTolerance',
    label: 'Point length',
    lowLabel: 'End points early',
    highLabel: 'Live in long rallies',
    defaultValue: 5,
    scores: { 'Defensive Grinder': 1.6, Counterpuncher: 1.3, 'Big Server': -1.1, 'Serve-and-Volley Player': -0.8 },
  },
  {
    id: 'netIntent',
    label: 'Forward pressure',
    lowLabel: 'Baseline first',
    highLabel: 'Finish forward',
    defaultValue: 4,
    scores: { 'Serve-and-Volley Player': 2.2, 'All-Court Player': 1.4, 'Defensive Grinder': -0.8 },
  },
  {
    id: 'riskIntent',
    label: 'Shot selection',
    lowLabel: 'High percentage',
    highLabel: 'Take aggressive cuts',
    defaultValue: 5,
    scores: { 'Aggressive Baseliner': 1.8, 'Big Server': 1.0, 'Defensive Grinder': -1.3, Counterpuncher: -0.7 },
  },
  {
    id: 'serveReliance',
    label: 'Serve value',
    lowLabel: 'Starts rallies',
    highLabel: 'Creates points',
    defaultValue: 5,
    scores: { 'Big Server': 2.3, 'Serve-and-Volley Player': 1.2, 'Defensive Grinder': -0.7 },
  },
  {
    id: 'comfortNeed',
    label: 'Comfort priority',
    lowLabel: 'Firm feel is okay',
    highLabel: 'Protect my arm',
    defaultValue: 4,
    scores: { 'Defensive Grinder': 0.5, Counterpuncher: 0.4 },
  },
  {
    id: 'maneuverabilityNeed',
    label: 'Swing feel',
    lowLabel: 'Stable/plow-through',
    highLabel: 'Fast/easy swing',
    defaultValue: 6,
    scores: { 'All-Court Player': 0.9, 'Serve-and-Volley Player': 0.8, 'Heavy Topspin Player': 0.4 },
  },
  {
    id: 'durabilityNeed',
    label: 'String durability',
    lowLabel: 'Feel first',
    highLabel: 'I break strings',
    defaultValue: 5,
    scores: { 'Heavy Topspin Player': 0.9, 'Aggressive Baseliner': 0.5 },
  },
];

export const quizProfileFields = [
  {
    id: 'skillLevel',
    label: 'UTR/NTRP or skill level',
    type: 'select',
    defaultValue: 'Recreational',
    options: ['Beginner', 'Recreational', 'NTRP 3.0', 'NTRP 3.5', 'NTRP 4.0', 'NTRP 4.5+', 'UTR 1-3', 'UTR 4-6', 'UTR 7+'],
  },
  {
    id: 'age',
    label: 'Age',
    type: 'number',
    placeholder: 'Optional',
    defaultValue: '',
  },
  {
    id: 'height',
    label: 'Height',
    type: 'text',
    placeholder: 'Optional, ex: 5 ft 10',
    defaultValue: '',
  },
  {
    id: 'weight',
    label: 'Weight',
    type: 'text',
    placeholder: 'Optional',
    defaultValue: '',
  },
  {
    id: 'playingStyle',
    label: 'Closest player archetype',
    type: 'select',
    defaultValue: 'All-court player',
    options: ['Heavy topspin baseliner', 'Flat power hitter', 'Counterpuncher', 'All-court player', 'Serve-focused player', 'Beginner/recreational player', 'Arm-sensitive player'],
  },
  {
    id: 'swingSpeed',
    label: 'Swing speed',
    type: 'select',
    defaultValue: 'Medium',
    options: ['Slow', 'Medium', 'Fast'],
  },
  {
    id: 'strokeLength',
    label: 'Stroke length',
    type: 'select',
    defaultValue: 'Moderate',
    options: ['Compact', 'Moderate', 'Long/full'],
  },
  {
    id: 'paceGeneration',
    label: 'Pace generation',
    type: 'select',
    defaultValue: 'Neutral',
    options: ['I create my own pace', 'Neutral', 'I need help creating depth'],
  },
  {
    id: 'topspinLevel',
    label: 'Topspin level',
    type: 'range',
    defaultValue: 6,
  },
  {
    id: 'launchPreference',
    label: 'Preferred launch window',
    type: 'select',
    defaultValue: 'Neutral shape',
    options: ['Higher heavy ball', 'Neutral shape', 'Lower penetrating ball', 'Not sure yet'],
  },
  {
    id: 'missPattern',
    label: 'Common miss pattern',
    type: 'select',
    defaultValue: 'Not sure yet',
    options: ['Long', 'Short', 'Into the net', 'Wide/timing miss', 'Not sure yet'],
  },
  {
    id: 'courtPositionPreference',
    label: 'Preferred court position',
    type: 'select',
    defaultValue: 'Baseline',
    options: ['Baseline', 'All-court', 'Net/transition'],
  },
  {
    id: 'swingweightTolerance',
    label: 'Swingweight feel',
    type: 'select',
    defaultValue: 'Balanced',
    options: ['Need easy maneuverability', 'Balanced', 'Want stability/plow-through', 'Not sure yet'],
  },
  {
    id: 'fatigueBreakdown',
    label: 'When tired or rushed',
    type: 'select',
    defaultValue: 'No major issue',
    options: ['Swing slows down', 'Timing gets late', 'Racket feels unstable', 'No major issue', 'Not sure yet'],
  },
  {
    id: 'serveImportance',
    label: 'Serve importance',
    type: 'range',
    defaultValue: 5,
  },
  {
    id: 'powerControlPreference',
    label: 'Power vs control',
    type: 'select',
    defaultValue: 'Balanced',
    options: ['More power', 'Balanced', 'More control'],
  },
  {
    id: 'painArea',
    label: 'Pain or injury focus',
    type: 'select',
    defaultValue: 'None',
    options: ['None', 'Elbow', 'Shoulder', 'Wrist', 'Multiple areas'],
  },
  {
    id: 'painSeverity',
    label: 'Pain severity',
    type: 'select',
    defaultValue: 'None',
    options: ['None', 'Mild soreness after long play', 'Recurring during or after play', 'Active pain changes my swing'],
  },
  {
    id: 'stringBreakFrequency',
    label: 'String break frequency',
    type: 'select',
    defaultValue: 'Rarely break strings',
    options: ['Rarely break strings', 'Every 10-20 hours', 'Every 6-10 hours', 'Every 3-6 hours', 'Not sure yet'],
  },
  {
    id: 'controlMeaning',
    label: 'When you say control',
    type: 'select',
    defaultValue: 'Predictable depth',
    options: ['Lower launch', 'More stability', 'Less free power', 'Predictable depth', 'Better feel', 'Not sure yet'],
  },
  {
    id: 'powerMeaning',
    label: 'When you say power',
    type: 'select',
    defaultValue: 'Free depth',
    options: ['Free depth', 'More ball speed', 'Easier defense', 'Serve pop', 'Not sure yet'],
  },
  {
    id: 'feelMeaning',
    label: 'When you say feel',
    type: 'select',
    defaultValue: 'Connected response',
    options: ['Softer pocketing', 'More feedback', 'Better touch/volleys', 'Connected response', 'Not sure yet'],
  },
  {
    id: 'spinMeaning',
    label: 'When you say spin',
    type: 'select',
    defaultValue: 'More safety margin',
    options: ['More RPM', 'Higher net clearance', 'More safety margin', 'Heavier bounce', 'Not sure yet'],
  },
  {
    id: 'demoReadiness',
    label: 'Recommendation style',
    type: 'select',
    defaultValue: 'Show me a ranked shortlist',
    options: ['Give me one strong answer', 'Show me a ranked shortlist', 'Give me a demo sequence'],
  },
  {
    id: 'currentRacket',
    label: 'Current racket',
    type: 'text',
    placeholder: 'Optional',
    defaultValue: '',
  },
  {
    id: 'currentString',
    label: 'Current string',
    type: 'text',
    placeholder: 'Optional',
    defaultValue: '',
  },
  {
    id: 'currentTension',
    label: 'Current tension',
    type: 'number',
    placeholder: 'Optional lbs',
    defaultValue: '',
  },
  {
    id: 'budgetAmount',
    label: 'Max setup budget',
    type: 'number',
    placeholder: 'Optional dollars',
    defaultValue: '',
  },
  {
    id: 'setupDislikes',
    label: 'What do you dislike about your setup?',
    type: 'textarea',
    placeholder: 'Too stiff, no depth, too much launch, not enough spin...',
    defaultValue: '',
  },
];

export const quizProfileDefaults = Object.fromEntries(quizProfileFields.map((field) => [field.id, field.defaultValue]));

function defaultTraits() {
  return Object.fromEntries(quizSliders.map((slider) => [slider.id, slider.defaultValue * 10]));
}

export function scoreQuiz(answers) {
  const totals = Object.fromEntries(playstyleNames.map((style) => [style, 0]));
  const profile = {
    budgetTier: 'Balanced',
    maxSetupPrice: 330,
    armIssue: 'None',
    comfortPriority: 0,
    traits: defaultTraits(),
    profileInputs: { ...quizProfileDefaults },
  };

  quizProfileFields.forEach((field) => {
    const rawValue = answers[field.id];
    if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
      profile.profileInputs[field.id] = rawValue;
    }
  });

  quizQuestions.forEach((question) => {
    const selectedIndex = answers[question.id];
    const selected = question.options[selectedIndex];
    if (!selected) return;

    Object.entries(selected.scores || {}).forEach(([style, points]) => {
      totals[style] += points;
    });

    Object.assign(profile, selected.profile || {});
  });

  quizSliders.forEach((slider) => {
    const rawValue = Number(answers[slider.id] ?? slider.defaultValue);
    const rating = Math.min(10, Math.max(1, rawValue));
    const value = rating * 10;
    const centered = (value - 50) / 50;

    profile.traits[slider.id] = value;

    Object.entries(slider.scores || {}).forEach(([style, weight]) => {
      totals[style] += centered * weight;
    });
  });

  const profileInputs = profile.profileInputs;
  const explicitSpin = Number(profileInputs.topspinLevel);
  const explicitServe = Number(profileInputs.serveImportance);
  const explicitBudget = Number(profileInputs.budgetAmount);

  if (Number.isFinite(explicitSpin) && explicitSpin > 0) {
    profile.traits.spinIntent = Math.min(100, Math.max(10, explicitSpin * 10));
  }

  if (Number.isFinite(explicitServe) && explicitServe > 0) {
    profile.traits.serveReliance = Math.min(100, Math.max(10, explicitServe * 10));
  }

  if (profileInputs.swingSpeed === 'Fast') {
    profile.traits.riskIntent = Math.max(profile.traits.riskIntent, 64);
    profile.traits.maneuverabilityNeed = Math.max(profile.traits.maneuverabilityNeed, 58);
  } else if (profileInputs.swingSpeed === 'Slow') {
    profile.traits.powerIntent = Math.max(profile.traits.powerIntent, 66);
    profile.traits.maneuverabilityNeed = Math.max(profile.traits.maneuverabilityNeed, 70);
  }

  if (profileInputs.strokeLength === 'Long/full') {
    profile.traits.riskIntent = Math.max(profile.traits.riskIntent, 62);
  } else if (profileInputs.strokeLength === 'Compact') {
    profile.traits.powerIntent = Math.max(profile.traits.powerIntent, 66);
    profile.traits.maneuverabilityNeed = Math.max(profile.traits.maneuverabilityNeed, 68);
  }

  if (profileInputs.paceGeneration === 'I create my own pace') {
    profile.traits.controlIntent = Math.max(profile.traits.controlIntent, 68);
    profile.traits.powerIntent = Math.min(profile.traits.powerIntent, 58);
  } else if (profileInputs.paceGeneration === 'I need help creating depth') {
    profile.traits.powerIntent = Math.max(profile.traits.powerIntent, 74);
  }

  if (profileInputs.launchPreference === 'Higher heavy ball') {
    profile.traits.spinIntent = Math.max(profile.traits.spinIntent, 82);
  } else if (profileInputs.launchPreference === 'Lower penetrating ball') {
    profile.traits.controlIntent = Math.max(profile.traits.controlIntent, 78);
    profile.traits.spinIntent = Math.min(profile.traits.spinIntent, 52);
  }

  if (profileInputs.missPattern === 'Long') {
    profile.traits.controlIntent = Math.max(profile.traits.controlIntent, 78);
    profile.traits.powerIntent = Math.min(profile.traits.powerIntent, 56);
  } else if (profileInputs.missPattern === 'Short' || profileInputs.missPattern === 'Into the net') {
    profile.traits.powerIntent = Math.max(profile.traits.powerIntent, 72);
  } else if (profileInputs.missPattern === 'Wide/timing miss') {
    profile.traits.maneuverabilityNeed = Math.max(profile.traits.maneuverabilityNeed, 70);
  }

  if (profileInputs.swingweightTolerance === 'Need easy maneuverability') {
    profile.traits.maneuverabilityNeed = Math.max(profile.traits.maneuverabilityNeed, 82);
  } else if (profileInputs.swingweightTolerance === 'Want stability/plow-through') {
    profile.traits.maneuverabilityNeed = Math.min(profile.traits.maneuverabilityNeed, 42);
    profile.traits.controlIntent = Math.max(profile.traits.controlIntent, 66);
  }

  if (profileInputs.fatigueBreakdown === 'Swing slows down' || profileInputs.fatigueBreakdown === 'Timing gets late') {
    profile.traits.maneuverabilityNeed = Math.max(profile.traits.maneuverabilityNeed, 78);
  } else if (profileInputs.fatigueBreakdown === 'Racket feels unstable') {
    profile.traits.controlIntent = Math.max(profile.traits.controlIntent, 70);
  }

  if (profileInputs.stringBreakFrequency === 'Every 3-6 hours') {
    profile.traits.durabilityNeed = Math.max(profile.traits.durabilityNeed, 92);
  } else if (profileInputs.stringBreakFrequency === 'Every 6-10 hours') {
    profile.traits.durabilityNeed = Math.max(profile.traits.durabilityNeed, 78);
  } else if (profileInputs.stringBreakFrequency === 'Every 10-20 hours') {
    profile.traits.durabilityNeed = Math.max(profile.traits.durabilityNeed, 62);
  }

  if (profileInputs.powerControlPreference === 'More power') {
    profile.traits.powerIntent = Math.max(profile.traits.powerIntent, 72);
    profile.traits.controlIntent = Math.min(profile.traits.controlIntent, 58);
  } else if (profileInputs.powerControlPreference === 'More control') {
    profile.traits.controlIntent = Math.max(profile.traits.controlIntent, 74);
    profile.traits.powerIntent = Math.min(profile.traits.powerIntent, 58);
  }

  if (profileInputs.courtPositionPreference === 'Net/transition') {
    profile.traits.netIntent = Math.max(profile.traits.netIntent, 74);
  } else if (profileInputs.courtPositionPreference === 'Baseline') {
    profile.traits.netIntent = Math.min(profile.traits.netIntent, 46);
  }

  if ((profileInputs.painArea && profileInputs.painArea !== 'None') || (profileInputs.painSeverity && profileInputs.painSeverity !== 'None')) {
    profile.comfortPriority = Math.max(profile.comfortPriority, 2);
    profile.armIssue = profileInputs.painArea && profileInputs.painArea !== 'None' ? `${profileInputs.painArea} pain` : profileInputs.painSeverity;
    profile.traits.comfortNeed = Math.max(profile.traits.comfortNeed, 86);
  }

  if (Number.isFinite(explicitBudget) && explicitBudget > 0) {
    profile.maxSetupPrice = explicitBudget;
    profile.budgetTier = explicitBudget < 260 ? 'Value' : explicitBudget > 380 ? 'Premium' : 'Balanced';
  }

  if (profile.traits.comfortNeed >= 78) {
    profile.comfortPriority = Math.max(profile.comfortPriority, 2);
    profile.armIssue = profile.armIssue === 'None' ? 'Comfort priority' : profile.armIssue;
  } else if (profile.traits.comfortNeed >= 55) {
    profile.comfortPriority = Math.max(profile.comfortPriority, 1);
    profile.armIssue = profile.armIssue === 'None' ? 'Comfort preference' : profile.armIssue;
  }

  const ranked = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  return {
    totals,
    primary: ranked[0][0],
    secondary: ranked[1][0],
    ...profile,
  };
}
