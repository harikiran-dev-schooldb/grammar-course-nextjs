export type ReadingPassage = {
  id: string;
  level: "START" | "A1" | "A2" | "B1" | "B2";
  title: string;
  titleTe: string;
  text: string;
  tip: string;
  tipTe: string;
};

export const readingPassages: ReadingPassage[] = [
  {id:"red-cap",level:"START",title:"Sam's red cap",titleTe:"Sam ఎర్ర టోపీ",text:"Sam has a red cap. The cap is on his bed.",tip:"Read slowly. Touch every word with your eyes.",tipTe:"నెమ్మదిగా చదవండి. ప్రతి word ని చూడండి."},
  {id:"little-cat",level:"START",title:"The little cat",titleTe:"చిన్న పిల్లి",text:"The little cat sits on the mat. It can run and jump.",tip:"Blend short words: c-a-t, m-a-t and r-u-n.",tipTe:"చిన్న words లో sounds కలిపి చదవండి."},
  {id:"school-day",level:"A1",title:"My school day",titleTe:"నా school day",text:"I walk to school with my friend. We read books and play after lunch.",tip:"Pause briefly at the full stop.",tipTe:"Full stop దగ్గర కొద్దిగా ఆగండి."},
  {id:"rainy-morning",level:"A1",title:"A rainy morning",titleTe:"వర్షం పడిన ఉదయం",text:"It is raining this morning. Meena takes her blue umbrella and waits for the bus.",tip:"Keep a steady pace and pronounce word endings.",tipTe:"ఒకే speed లో చదివి word endings స్పష్టంగా పలకండి."},
  {id:"market-visit",level:"A2",title:"At the market",titleTe:"Market లో",text:"Ravi visits the market with his mother. They compare fresh vegetables before choosing tomatoes and carrots.",tip:"Break longer words into syllables: veg-e-ta-bles.",tipTe:"పెద్ద words ని syllables గా విడదీసి చదవండి."},
  {id:"helpful-neighbour",level:"A2",title:"A helpful neighbour",titleTe:"సహాయం చేసే neighbour",text:"Our neighbour noticed a broken bicycle near the gate. She brought her tools and helped us repair it.",tip:"Let commas and full stops guide your breathing.",tipTe:"Comma, full stop దగ్గర సరైన విధంగా pause తీసుకోండి."},
  {id:"library-project",level:"B1",title:"The library project",titleTe:"Library project",text:"The students planned a small library for their village. They collected books, organised shelves, and invited younger children to visit.",tip:"Stress the important content words in each sentence.",tipTe:"ప్రతి sentence లో ముఖ్యమైన words ని కొంచెం stress చేసి చదవండి."},
  {id:"clean-river",level:"B1",title:"A cleaner river",titleTe:"శుభ్రమైన నది",text:"After learning about plastic pollution, the community organised a weekend clean-up. Their effort inspired nearby villages to protect the river too.",tip:"Read in meaningful phrases instead of one word at a time.",tipTe:"ఒక్కో word కాకుండా అర్థవంతమైన phrases గా చదవండి."},
  {id:"brave-choice",level:"B1",title:"A brave choice",titleTe:"ధైర్యమైన నిర్ణయం",text:"Although Anu felt nervous, she volunteered to present the team's idea. Her clear explanation encouraged everyone to support the plan.",tip:"Use your voice to show contrast after although.",tipTe:"Although తర్వాత contrast వినిపించేలా voice మార్చండి."},
  {id:"future-learning",level:"B2",title:"The future of learning",titleTe:"Learning యొక్క భవిష్యత్తు",text:"Technology can make education more accessible, but thoughtful guidance remains essential. Effective learning combines useful tools with curiosity, practice, and human encouragement.",tip:"Aim for expression, accuracy and natural sentence rhythm.",tipTe:"Accuracy తో పాటు natural rhythm, expression పై దృష్టి పెట్టండి."},
  {id:"responsible-progress",level:"B2",title:"Responsible progress",titleTe:"బాధ్యతతో కూడిన progress",text:"Scientific progress creates valuable opportunities while also raising difficult questions. Communities must consider long-term consequences before adopting powerful new systems.",tip:"Slow down slightly for complex ideas and unfamiliar words.",tipTe:"Complex ideas, కొత్త words ఉన్నప్పుడు కొంచెం నెమ్మదిగా చదవండి."},
  {id:"confident-speaker",level:"B2",title:"A confident communicator",titleTe:"ధైర్యంగా మాట్లాడే వ్యక్తి",text:"Confident communication is not about speaking quickly. It means organising ideas carefully, listening respectfully, and adapting language so that every audience can understand.",tip:"Finish each sentence strongly without rushing the final words.",tipTe:"చివరి words తొందరపడకుండా ప్రతి sentence ని స్పష్టంగా పూర్తి చేయండి."},
];
