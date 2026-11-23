/* ============================================================
   JEE Quest — static data: defaults, stages, zones, topics, quotes
   ============================================================ */
(function () {
  const JQ = (window.JQ = window.JQ || {});

  // ---------- Default configuration (editable in Settings) ----------
  JQ.DEFAULTS = {
    name: 'Warrior',
    jee: {
      start: '2026-11-01',
      exam: '2027-01-20', // your paper date (from admit card)
      window: ['2027-01-20', '2027-01-21', '2027-01-22', '2027-01-23', '2027-01-24', '2027-01-28'],
    },
    boards: {
      start: '2026-11-01',
      // CBSE Class 12 — Science stream subjects
      subjects: [
        { id: 'phy', name: 'Physics', short: 'Phy', date: '2027-02-16', on: true },
        { id: 'pe', name: 'Physical Education', short: 'PE', date: '2027-02-18', on: true },
        { id: 'chem', name: 'Chemistry', short: 'Chem', date: '2027-02-27', on: true },
        { id: 'eng', name: 'English', short: 'Eng', date: '2027-03-05', on: true },
        { id: 'math', name: 'Mathematics', short: 'Math', date: '2027-03-09', on: true },
        { id: 'hin', name: 'Hindi', short: 'Hin', date: '2027-03-13', on: false },
        { id: 'bio', name: 'Biology', short: 'Bio', date: '2027-03-25', on: false },
      ],
    },
  };

  // ---------- Warrior evolution stages (driven by countdown progress) ----------
  JQ.STAGES = [
    { name: 'Recruit', title: 'The Untested', at: 0,
      desc: 'A pencil for a sword, a textbook for a shield. Untested and afraid \u2014 but you answered the call, and every legend starts there.' },
    { name: 'Squire', title: 'The Sworn Learner', at: 0.15,
      desc: 'A true blade and a wooden shield. You serve the craft now, and the fear is fading.' },
    { name: 'Sworn Sword', title: 'The Steadfast', at: 0.35,
      desc: 'Steel helm and plate. You hold your ground on any chapter the realm throws at you.' },
    { name: 'Knight', title: 'The Anointed', at: 0.55,
      desc: 'Kneel, and rise a Knight. A cloak lined with fur and your house sigil on your shield.' },
    { name: 'Lord Commander', title: 'The Unbreakable', at: 0.75,
      desc: 'Winged helm and a blade that burns with purpose. Armies of questions fall before you.' },
    { name: 'Sovereign', title: 'Ruler of Ranks', at: 0.93,
      desc: 'Golden armour, a crown and wings of light. The realm is ready to bend the knee.' },
  ];
  JQ.stageFor = function (p) {
    let s = 0;
    for (let i = 0; i < JQ.STAGES.length; i++) if (p >= JQ.STAGES[i].at - 1e-9) s = i;
    return s;
  };

  // ---------- Map zones (bottom → top) ----------
  JQ.ZONES = {
    jee: [
      { name: 'The Vale of Vectors', color: '#e8d5aa', props: ['tree', 'castle', 'bush', 'rock', 'tree'] },
      { name: 'Kinematic Kingswood', color: '#dfcb9c', props: ['pine', 'pine', 'tent', 'tower', 'bush'] },
      { name: 'The Mole Marches', color: '#d9c290', props: ['peak', 'rock', 'castle', 'pine'] },
      { name: 'Calculus Crags', color: '#d4b47f', props: ['mesa', 'tower', 'rock', 'bones'] },
      { name: 'The Organic Wildwood', color: '#cba674', props: ['pine', 'bush', 'tent', 'mushroom'] },
      { name: 'Ashfall Keep', color: '#b98258', props: ['lava', 'deadtree', 'tower', 'lava'] },
    ],
    jeeTop: ['#5a2416', '#1a0806'],
    boards: [
      { name: 'Frostford Library', color: '#e2e5e0', props: ['bpine', 'castle', 'books', 'lantern'] },
      { name: 'The Snowdrift Shore', color: '#d5dcdc', props: ['scroll', 'bcrystal', 'tent', 'bpine'] },
      { name: 'The NCERT Northwood', color: '#c9d4d9', props: ['bpine', 'bpine', 'tower', 'books'] },
      { name: 'Sample Paper Spires', color: '#bdccd7', props: ['bpeak', 'icewall', 'bcrystal'] },
      { name: 'Revision Rimehold', color: '#b2c4d5', props: ['icewall', 'bcrystal', 'tower', 'lantern'] },
      { name: 'The Frozen Archive', color: '#a6bed5', props: ['pillar', 'castle', 'icewall', 'pillar'] },
    ],
    boardsTop: ['#34506d', '#0b1522'],
  };

  // ---------- Bosses & houses ----------
  JQ.BOSS = {
    jee: { kicker: 'The Final Siege', name: 'PYRAXIS', title: 'The Three-Headed Dread', win: 'The realm is yours \u2014 JEE Main conquered' },
    boards: { kicker: 'The Last Gate', name: 'RIMEWARDEN', title: 'The Frost Archivist', win: 'The frost yields \u2014 Boards conquered' },
  };
  JQ.HOUSE = { jee: 'House of the Flame', boards: 'House of the Frost' };

  // ---------- JEE topics ----------
  JQ.SUBJ = ['Physics', 'Chemistry', 'Mathematics'];
  JQ.TOPICS = {
    Physics: ['Units & Dimensions', 'Kinematics', 'Laws of Motion', 'Work, Energy & Power', 'Rotational Motion',
      'Gravitation', 'Properties of Solids & Liquids', 'Thermodynamics', 'Kinetic Theory of Gases', 'Oscillations & Waves',
      'Electrostatics', 'Current Electricity', 'Magnetic Effects of Current', 'EMI & AC', 'EM Waves', 'Ray Optics',
      'Wave Optics', 'Dual Nature of Matter', 'Atoms & Nuclei', 'Semiconductors'],
    Chemistry: ['Mole Concept', 'Atomic Structure', 'Chemical Bonding', 'Chemical Thermodynamics', 'Equilibrium',
      'Redox & Electrochemistry', 'Chemical Kinetics', 'Periodic Table', 'p-Block Elements', 'd & f Block Elements',
      'Coordination Compounds', 'GOC', 'Hydrocarbons', 'Haloalkanes & Haloarenes', 'Alcohols, Phenols & Ethers',
      'Aldehydes & Ketones', 'Amines', 'Biomolecules', 'Solutions'],
    Mathematics: ['Sets & Relations', 'Complex Numbers', 'Quadratic Equations', 'Matrices & Determinants',
      'Permutations & Combinations', 'Binomial Theorem', 'Sequences & Series', 'Limits & Continuity', 'Differentiation',
      'Application of Derivatives', 'Indefinite Integrals', 'Definite Integrals & Area', 'Differential Equations',
      'Straight Lines', 'Circles', 'Conic Sections', '3D Geometry', 'Vectors', 'Probability', 'Statistics', 'Trigonometry'],
  };
  JQ.JEE_TASKS = [
    'Solve 30 PYQs on {t} — mark every mistake in your error log.',
    'Revise {t}, then 25 timed MCQs (40 min).',
    'Master {t}: notes → 20 problems → 5 hardest re-solved.',
    'Speed drill on {t}: 15 questions in 30 minutes.',
    'Concept + numericals: {t}. Finish with 10 integer-type questions.',
  ];

  // ---------- Board topics (NCERT-aligned) ----------
  JQ.BOARD_TOPICS = {
    Physics: ['Electric Charges & Fields', 'Electrostatic Potential', 'Current Electricity', 'Moving Charges & Magnetism',
      'Magnetism & Matter', 'EMI', 'Alternating Current', 'EM Waves', 'Ray Optics', 'Wave Optics', 'Dual Nature',
      'Atoms', 'Nuclei', 'Semiconductor Electronics'],
    Chemistry: ['Solutions', 'Electrochemistry', 'Chemical Kinetics', 'd & f Block', 'Coordination Compounds',
      'Haloalkanes & Haloarenes', 'Alcohols, Phenols & Ethers', 'Aldehydes, Ketones & Acids', 'Amines', 'Biomolecules'],
    Mathematics: ['Relations & Functions', 'Inverse Trigonometry', 'Matrices', 'Determinants', 'Continuity & Differentiability',
      'Application of Derivatives', 'Integrals', 'Application of Integrals', 'Differential Equations', 'Vectors',
      '3D Geometry', 'Linear Programming', 'Probability'],
    Biology: ['Sexual Reproduction in Plants', 'Human Reproduction', 'Reproductive Health', 'Inheritance & Variation',
      'Molecular Basis of Inheritance', 'Evolution', 'Human Health & Disease', 'Microbes in Human Welfare',
      'Biotechnology Principles', 'Biotechnology Applications', 'Organisms & Populations', 'Ecosystem', 'Biodiversity'],
    English: ['Reading comprehension', 'Notice & invitation writing', 'Letter writing', 'Article & report writing',
      'Flamingo prose', 'Flamingo poetry', 'Vistas supplementary', 'Character sketches & themes'],
    'Physical Education': ['Management of Sporting Events', 'Children & Women in Sports', 'Yoga as Preventive Measure',
      'Physical Education & Sports for CWSN', 'Sports & Nutrition', 'Test & Measurement', 'Physiology & Injuries',
      'Biomechanics', 'Psychology & Sports', 'Training in Sports'],
    Hindi: ['अपठित गद्यांश', 'कार्यालयी हिंदी व रचनात्मक लेखन', 'आरोह — गद्य खंड', 'आरोह — काव्य खंड', 'वितान'],
  };
  JQ.BOARD_TASKS = [
    'NCERT line-by-line: {t} + all in-text & exercise questions.',
    'Write 3 long answers from {t} — neat headings and labelled diagrams.',
    'Previous-year board questions on {t} (last 5 years).',
    'Make a one-page revision sheet for {t}, then self-test from memory.',
  ];

  // ---------- Original motivational lines ----------
  JQ.QUOTES = [
    'A warrior who studies through the long night rides first at dawn.',
    'Steel is forged in fire. So are ranks.',
    'Every chapter conquered is a castle taken.',
    'The throne does not care how you feel today. Show up anyway.',
    'Dragons are not born fearless. They are born stubborn.',
    'Sharpen your blade daily \u2014 battles do not wait for the unready.',
    'A small banner raised every day becomes an army.',
    'Your mistakes are scouts. They show you where the enemy hides.',
    'Kingdoms fall to patience, not to panic.',
    'Hold the line one more hour. That is how sieges are won.',
    'Even the coldest winter ends for those who keep marching.',
    'Doubt is a whisper. Discipline is a war drum.',
    'You are on Day {n} of your campaign. Give the bards something to sing.',
    'Revise like a general: know every inch of ground before the battle.',
    'The crown goes to the consistent, not merely the clever.',
    'Light your candle. Open your book. Take your kingdom.',
    'Fear is only a gate. Walk through it.',
    'Every formula you master is another sword in your armoury.',
    'The realm remembers those who never missed a day.',
    'Silence the ravens. Wake the warrior.',
    'Hard questions are dragons. Slay them in practice first.',
    'Win the quiet days, and the loud day will be yours.',
  ];

  // ---------- Reward lines shown when a day's goals are all done ----------
  JQ.REWARD_QUOTES = [
    'Momentum is mass times velocity. You just added both.',
    'Today you were the constant in a world of variables.',
    'Every solved problem is a step function — and you only go up.',
    'Small daily wins compound faster than interest. Keep stacking.',
    'You turned potential energy into kinetic. That is how ranks move.',
    'The exam rewards consistency, not last-minute heroics. Today, you were consistent.',
    'One more day of the reaction is complete. Your rank is the product.',
    'Discipline is the catalyst — it lowers the activation energy of every tomorrow.',
    'Limits are only approached by those who never stop. You did not stop.',
    'Integrate today\'s effort over 60 days and the area under the curve is your result.',
    'Your future self at NIT Trichy just said thank you.',
    'Hard work today, fewer surprises in the exam hall.',
    'Bonds formed by practice are the hardest to break.',
    'Every completed day is a guard at the gate who already knows your name.',
    'Equilibrium is boring. You chose progress.',
    'You did not wait for motivation. You created it. Well done.',
    'Mistakes made in practice are marks saved in the exam.',
    'The gate opens a little wider with every day like this one.',
    'Rest well tonight — tomorrow\'s problems are already a little afraid of you.',
    'Strong today, stronger tomorrow. That is the only formula you need.',
  ];
})();
