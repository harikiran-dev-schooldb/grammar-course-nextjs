import { type Lesson, lessons } from "./lessons";
import { type TestQuestion } from "../lib/daily-test-core";

const extra: Record<number, Curated[]> = {
  "1": [
    {
      "prompt": "Leela sings. ___ sings well.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "He",
        "She",
        "They"
      ],
      "answer": 1,
      "explanation": "Use she for one woman or girl.",
      "explanationTe": "ఒక అమ్మాయి గురించి చెప్పేటప్పుడు she వాడాలి."
    },
    {
      "prompt": "Which word is a noun?",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "Quickly",
        "Classroom",
        "Beautiful"
      ],
      "answer": 1,
      "explanation": "Classroom names a place, so it is a noun.",
      "explanationTe": "Classroom ఒక స్థలం పేరు, కాబట్టి noun."
    }
  ],
  "2": [
    {
      "prompt": "I ___ ready for class.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "is",
        "are",
        "am"
      ],
      "answer": 2,
      "explanation": "Use am with I.",
      "explanationTe": "I తో am వాడాలి."
    },
    {
      "prompt": "Those books ___ new.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "are",
        "is",
        "am"
      ],
      "answer": 0,
      "explanation": "Plural books take are.",
      "explanationTe": "Books plural కాబట్టి are వాడాలి."
    }
  ],
  "3": [
    {
      "prompt": "We saw ___ elephant.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "a",
        "an",
        "the"
      ],
      "answer": 1,
      "explanation": "Elephant begins with a vowel sound.",
      "explanationTe": "Elephant ముందు an వాడాలి."
    },
    {
      "prompt": "Please close ___ door we just opened.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "a",
        "an",
        "the"
      ],
      "answer": 2,
      "explanation": "The refers to a specific known door.",
      "explanationTe": "తెలిసిన door కు the వాడాలి."
    }
  ],
  "4": [
    {
      "prompt": "One box, two ___.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "boxes",
        "boxs",
        "boxies"
      ],
      "answer": 0,
      "explanation": "Box ends in x, so add es.",
      "explanationTe": "Box చివర x ఉంది, కాబట్టి es చేరుతుంది."
    },
    {
      "prompt": "One child, two ___.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "childs",
        "childes",
        "children"
      ],
      "answer": 2,
      "explanation": "Child has the irregular plural children.",
      "explanationTe": "Child plural children."
    }
  ],
  "5": [
    {
      "prompt": "Choose an adjective: a ___ sky.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "blue",
        "run",
        "quickly"
      ],
      "answer": 0,
      "explanation": "Blue describes the sky.",
      "explanationTe": "Blue ఆకాశాన్ని వర్ణిస్తుంది."
    },
    {
      "prompt": "Which phrase has correct adjective order?",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "three small bags",
        "three smalls bags",
        "three bags small"
      ],
      "answer": 0,
      "explanation": "Adjectives come before nouns and do not take plural s.",
      "explanationTe": "Adjective noun ముందు వస్తుంది, plural లో మారదు."
    }
  ],
  "6": [
    {
      "prompt": "Choose the natural sentence order.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "Rice eats the boy.",
        "The boy eats rice.",
        "Eats the boy rice."
      ],
      "answer": 1,
      "explanation": "The usual order is subject, verb, object.",
      "explanationTe": "Subject, verb, object క్రమం సరైనది."
    },
    {
      "prompt": "In Ravi plays tennis, what is the subject?",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "tennis",
        "plays",
        "Ravi"
      ],
      "answer": 2,
      "explanation": "Ravi performs the action.",
      "explanationTe": "పని చేసే వ్యక్తి Ravi; అదే subject."
    }
  ],
  "7": [
    {
      "prompt": "They ___ happy.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "is",
        "are",
        "am"
      ],
      "answer": 1,
      "explanation": "They takes are.",
      "explanationTe": "They తో are వాడాలి."
    },
    {
      "prompt": "She opened ___ umbrella.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "a",
        "an",
        "the"
      ],
      "answer": 1,
      "explanation": "Umbrella begins with a vowel sound.",
      "explanationTe": "Umbrella ముందు an వాడాలి."
    }
  ],
  "8": [
    {
      "prompt": "We ___ to school every morning.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "walk",
        "walks",
        "walking"
      ],
      "answer": 0,
      "explanation": "We takes the base verb in simple present.",
      "explanationTe": "We తో base verb వాడాలి."
    },
    {
      "prompt": "Water ___ at 100°C.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "boil",
        "boils",
        "boiling"
      ],
      "answer": 1,
      "explanation": "Water is singular, so use boils.",
      "explanationTe": "Water singular కాబట్టి boils వాడాలి."
    }
  ],
  "9": [
    {
      "prompt": "He ___ a book every night.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "read",
        "reads",
        "reading"
      ],
      "answer": 1,
      "explanation": "He takes a verb ending in s.",
      "explanationTe": "He తో verb కి s చేరుతుంది."
    },
    {
      "prompt": "The baby ___ when hungry.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "cry",
        "crys",
        "cries"
      ],
      "answer": 2,
      "explanation": "Consonant plus y changes to ies.",
      "explanationTe": "Consonant + y తో ies వస్తుంది."
    }
  ],
  "10": [
    {
      "prompt": "___ they work here?",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "Does",
        "Do",
        "Is"
      ],
      "answer": 1,
      "explanation": "Use do with they.",
      "explanationTe": "They తో do వాడాలి."
    },
    {
      "prompt": "Does she ___ English?",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "speaks",
        "speaking",
        "speak"
      ],
      "answer": 2,
      "explanation": "Use the base verb after does.",
      "explanationTe": "Does తర్వాత base verb వాడాలి."
    }
  ],
  "11": [
    {
      "prompt": "They ___ work on Sundays.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "doesn't",
        "don't",
        "isn't"
      ],
      "answer": 1,
      "explanation": "They takes don't.",
      "explanationTe": "They తో don't వాడాలి."
    },
    {
      "prompt": "She doesn't ___ coffee.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "drink",
        "drinks",
        "drinking"
      ],
      "answer": 0,
      "explanation": "Use the base verb after doesn't.",
      "explanationTe": "Doesn't తర్వాత drink వాడాలి."
    }
  ],
  "12": [
    {
      "prompt": "I ___ eat breakfast at eight.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "usually",
        "am",
        "usual"
      ],
      "answer": 0,
      "explanation": "Usually expresses frequency.",
      "explanationTe": "Usually frequency ని చెబుతుంది."
    },
    {
      "prompt": "We are ___ late.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "never",
        "late never",
        "nevers"
      ],
      "answer": 0,
      "explanation": "Frequency words follow be.",
      "explanationTe": "Be verb తర్వాత never వాడాలి."
    }
  ],
  "13": [
    {
      "prompt": "He ___ running right now.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "is",
        "are",
        "does"
      ],
      "answer": 0,
      "explanation": "He is + verb-ing is present continuous.",
      "explanationTe": "He తో is + verb-ing వాడాలి."
    },
    {
      "prompt": "She is ___ tea now.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "make",
        "making",
        "makes"
      ],
      "answer": 1,
      "explanation": "Drop the final e of make before ing.",
      "explanationTe": "Make చివరి e తీసి ing కలపాలి."
    }
  ],
  "14": [
    {
      "prompt": "Look! They ___ football now.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "play",
        "plays",
        "are playing"
      ],
      "answer": 2,
      "explanation": "Now signals an action in progress.",
      "explanationTe": "Now అంటే జరుగుతున్న action."
    },
    {
      "prompt": "She ___ to school daily.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "walks",
        "is walking",
        "walk"
      ],
      "answer": 0,
      "explanation": "Daily signals a simple present habit.",
      "explanationTe": "Daily అంటే అలవాటు, walks వాడాలి."
    }
  ],
  "15": [
    {
      "prompt": "I ___ home yesterday.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "am",
        "was",
        "were"
      ],
      "answer": 1,
      "explanation": "I takes was in the past.",
      "explanationTe": "Past లో I తో was వాడాలి."
    },
    {
      "prompt": "They ___ tired last night.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "were",
        "was",
        "are"
      ],
      "answer": 0,
      "explanation": "They takes were in the past.",
      "explanationTe": "They తో were వాడాలి."
    }
  ],
  "16": [
    {
      "prompt": "Past form of play is…",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "playd",
        "played",
        "plays"
      ],
      "answer": 1,
      "explanation": "Most regular verbs add ed.",
      "explanationTe": "Regular verb కు ed చేరుతుంది."
    },
    {
      "prompt": "Past form of live is…",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "lived",
        "liveed",
        "living"
      ],
      "answer": 0,
      "explanation": "Verbs ending in e add d.",
      "explanationTe": "చివర e ఉన్న verb కు d కలపాలి."
    }
  ],
  "17": [
    {
      "prompt": "Yesterday we ___ to school.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "go",
        "goed",
        "went"
      ],
      "answer": 2,
      "explanation": "Went is the past of go.",
      "explanationTe": "Go past form went."
    },
    {
      "prompt": "I ___ a rainbow yesterday.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "saw",
        "see",
        "seed"
      ],
      "answer": 0,
      "explanation": "Saw is the past of see.",
      "explanationTe": "See past form saw."
    }
  ],
  "18": [
    {
      "prompt": "Did you ___ your friend?",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "called",
        "call",
        "calling"
      ],
      "answer": 1,
      "explanation": "Use a base verb after did.",
      "explanationTe": "Did తర్వాత base verb వాడాలి."
    },
    {
      "prompt": "They didn't ___ the work.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "finished",
        "finishes",
        "finish"
      ],
      "answer": 2,
      "explanation": "After didn't use the base verb.",
      "explanationTe": "Didn't తర్వాత finish వాడాలి."
    }
  ],
  "19": [
    {
      "prompt": "I will ___ you tomorrow.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "help",
        "helps",
        "helping"
      ],
      "answer": 0,
      "explanation": "Will takes the base verb.",
      "explanationTe": "Will తర్వాత base verb వాడాలి."
    },
    {
      "prompt": "She ___ visit us next week.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "wills",
        "will",
        "willing"
      ],
      "answer": 1,
      "explanation": "Will is unchanged for every subject.",
      "explanationTe": "ప్రతి subject తో will ఒకటే."
    }
  ],
  "20": [
    {
      "prompt": "We ___ going to travel.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "is",
        "am",
        "are"
      ],
      "answer": 2,
      "explanation": "We takes are going to.",
      "explanationTe": "We తో are going to వాడాలి."
    },
    {
      "prompt": "It is going to ___ soon.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "rain",
        "rains",
        "raining"
      ],
      "answer": 0,
      "explanation": "Going to takes a base verb.",
      "explanationTe": "Going to తర్వాత rain వాడాలి."
    }
  ],
  "21": [
    {
      "prompt": "We ___ tired yesterday.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "are",
        "was",
        "were"
      ],
      "answer": 2,
      "explanation": "Yesterday signals past; we takes were.",
      "explanationTe": "Yesterday past, we తో were."
    },
    {
      "prompt": "Did she ___ yesterday?",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "call",
        "called",
        "calls"
      ],
      "answer": 0,
      "explanation": "Did takes the base verb.",
      "explanationTe": "Did తర్వాత base verb వాడాలి."
    }
  ],
  "22": [
    {
      "prompt": "The keys are ___ my bag. (inside)",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "on",
        "in",
        "under"
      ],
      "answer": 1,
      "explanation": "In means inside.",
      "explanationTe": "In అంటే లోపల."
    },
    {
      "prompt": "The cup is ___ the table. (on the surface)",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "on",
        "at",
        "in"
      ],
      "answer": 0,
      "explanation": "On indicates a surface.",
      "explanationTe": "On అంటే ఉపరితలం మీద."
    }
  ],
  "23": [
    {
      "prompt": "My birthday is ___ July.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "on",
        "in",
        "at"
      ],
      "answer": 1,
      "explanation": "Use in with months.",
      "explanationTe": "నెలల ముందు in వాడాలి."
    },
    {
      "prompt": "Class starts ___ 7:00.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "on",
        "in",
        "at"
      ],
      "answer": 2,
      "explanation": "Use at with exact times.",
      "explanationTe": "ఖచ్చితమైన సమయానికి at."
    }
  ],
  "24": [
    {
      "prompt": "You ___ rest when tired.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "should",
        "cans",
        "could to"
      ],
      "answer": 0,
      "explanation": "Should gives advice.",
      "explanationTe": "Advice కోసం should వాడాలి."
    },
    {
      "prompt": "___ you help me, please?",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "Should to",
        "Could",
        "Can to"
      ],
      "answer": 1,
      "explanation": "Could makes a polite request.",
      "explanationTe": "Polite request కి could."
    }
  ],
  "25": [
    {
      "prompt": "My room is ___ than yours.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "coldest",
        "colder",
        "more cold"
      ],
      "answer": 1,
      "explanation": "Short adjectives often use er + than.",
      "explanationTe": "చిన్న adjectives కు er + than."
    },
    {
      "prompt": "Comparative of good is…",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "gooder",
        "best",
        "better"
      ],
      "answer": 2,
      "explanation": "Good changes to better.",
      "explanationTe": "Good comparative better."
    }
  ],
  "26": [
    {
      "prompt": "She is the ___ runner here.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "tallest",
        "taller",
        "more tall"
      ],
      "answer": 0,
      "explanation": "Tall becomes tallest in the superlative.",
      "explanationTe": "Tall superlative tallest."
    },
    {
      "prompt": "Superlative of good is…",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "better",
        "best",
        "goodest"
      ],
      "answer": 1,
      "explanation": "Good becomes best.",
      "explanationTe": "Good superlative best."
    }
  ],
  "27": [
    {
      "prompt": "I bought rice ___ vegetables.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "because",
        "and",
        "but"
      ],
      "answer": 1,
      "explanation": "And joins items.",
      "explanationTe": "And రెండు విషయాలను కలుపుతుంది."
    },
    {
      "prompt": "I stayed home ___ it rained.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "because",
        "so",
        "and"
      ],
      "answer": 0,
      "explanation": "Because introduces a reason.",
      "explanationTe": "Because కారణం చెబుతుంది."
    }
  ],
  "28": [
    {
      "prompt": "___ is your birthday?",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "When",
        "Who",
        "Where"
      ],
      "answer": 0,
      "explanation": "When asks about time.",
      "explanationTe": "When సమయం గురించి అడుగుతుంది."
    },
    {
      "prompt": "___ broke the glass?",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "Why",
        "Who",
        "How"
      ],
      "answer": 1,
      "explanation": "Who asks about a person.",
      "explanationTe": "Who వ్యక్తి గురించి అడుగుతుంది."
    }
  ],
  "29": [
    {
      "prompt": "Look, they ___ playing now.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "is",
        "are",
        "was"
      ],
      "answer": 1,
      "explanation": "They takes are in present continuous.",
      "explanationTe": "They తో are వాడాలి."
    },
    {
      "prompt": "I ___ to school yesterday.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "walk",
        "walking",
        "walked"
      ],
      "answer": 2,
      "explanation": "Yesterday signals the past tense.",
      "explanationTe": "Yesterday కోసం walked."
    }
  ],
  "30": [
    {
      "prompt": "She doesn't ___ rice.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "eat",
        "eats",
        "eating"
      ],
      "answer": 0,
      "explanation": "Doesn't takes the base verb.",
      "explanationTe": "Doesn't తర్వాత eat వాడాలి."
    },
    {
      "prompt": "We ___ going to travel tomorrow.",
      "promptTe": "సరైన సమాధానం ఎంచుకోండి.",
      "options": [
        "am",
        "are",
        "is"
      ],
      "answer": 1,
      "explanation": "We takes are going to.",
      "explanationTe": "We తో are going to వాడాలి."
    }
  ]
};

type Curated = Omit<TestQuestion, "id" | "day">;
export function getDailyTestQuestions(lesson: Lesson): TestQuestion[] {
  const day = lesson.day;
  const curated = extra[day] ?? [];
  const examples = lesson.examples;
  if (examples.length < 3 || curated.length !== 2) return [];
  return [
    {
      id: "day-" + day + "-grammar-0", day,
      prompt: lesson.practice.prompt, promptTe: lesson.practice.promptTe,
      options: lesson.practice.options, answer: lesson.practice.answer,
      explanation: lesson.practice.explanation, explanationTe: lesson.teacherTe,
    },
    ...curated.map((item, index) => ({
      ...item, id: "day-" + day + "-grammar-" + (index + 1), day,
    })),
    {
      id: "day-" + day + "-translate-en", day,
      prompt: 'Which English example matches this Telugu meaning: "' + examples[0].te + '"?',
      promptTe: "ఈ తెలుగు అర్థానికి సరిపోయే English example ఎంచుకోండి.",
      options: examples.map((example) => example.en),
      answer: 0,
      explanation: 'The matching expression is "' + examples[0].en + '".',
      explanationTe: "సరైన English: " + examples[0].en,
    },
    {
      id: "day-" + day + "-translate-te", day,
      prompt: 'Choose the Telugu meaning of: "' + examples[1].en + '"',
      promptTe: "ఈ English expression కు సరైన తెలుగు అర్థం ఎంచుకోండి.",
      options: [examples[2].te, examples[0].te, examples[1].te],
      answer: 2,
      explanation: 'The matching meaning is "' + examples[1].te + '".',
      explanationTe: "సరైన తెలుగు: " + examples[1].te,
    },
  ];
}

export function getQuestionsForDay(day: number): TestQuestion[] {
  const lesson = lessons.find((item) => item.day === day);
  return lesson ? getDailyTestQuestions(lesson) : [];
}
