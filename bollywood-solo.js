// Offline solo catalog. Multiplayer routes and seat answers remain server-authoritative.
// Keep word/kind/clue equal to data/bollywood-answers.json; test-bollywood-solo.js checks parity.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SixthSenseBollywoodSolo = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const answers = Object.freeze([
  {
    "word": "padosan",
    "clue": "Borrowed singing talent in a neighbourhood romance.",
    "kind": "Film"
  },
  {
    "word": "anand",
    "clue": "A cheerful patient leaves a quieter doctor with a story.",
    "kind": "Film"
  },
  {
    "word": "deewaar",
    "clue": "Two brothers, opposite sides of the law, one mother.",
    "kind": "Film"
  },
  {
    "word": "sholay",
    "clue": "An unfinished score in Ramgarh needs two unlikely helpers.",
    "kind": "Film"
  },
  {
    "word": "golmaal",
    "clue": "A moustache does most of the work in a double-life comedy.",
    "kind": "Film"
  },
  {
    "word": "mrindia",
    "clue": "A crowded home gains an unseen protector.",
    "kind": "Film"
  },
  {
    "word": "damini",
    "clue": "A witness stands firm while justice keeps getting postponed.",
    "kind": "Film"
  },
  {
    "word": "border",
    "clue": "A small outpost waits through the night at Longewala.",
    "kind": "Film"
  },
  {
    "word": "dhadkan",
    "clue": "An old love returns after a marriage has begun to heal.",
    "kind": "Film"
  },
  {
    "word": "lagaan",
    "clue": "A village wagers its future on an unfamiliar game.",
    "kind": "Film"
  },
  {
    "word": "nayak",
    "clue": "A reporter gets one day to put his criticism into practice.",
    "kind": "Film"
  },
  {
    "word": "aankhen",
    "clue": "A disgraced banker recruits robbers who cannot see.",
    "kind": "Film"
  },
  {
    "word": "company",
    "clue": "An underworld partnership grows too powerful to stay united.",
    "kind": "Film"
  },
  {
    "word": "devdas",
    "clue": "Childhood love gives way to pride and self-destruction.",
    "kind": "Film"
  },
  {
    "word": "baghban",
    "clue": "Retirement tests how much room children make for their parents.",
    "kind": "Film"
  },
  {
    "word": "hungama",
    "clue": "One wealthy man's name causes far too many misunderstandings.",
    "kind": "Film"
  },
  {
    "word": "dhoom",
    "clue": "The getaway vehicles become almost as famous as the robbers.",
    "kind": "Film"
  },
  {
    "word": "humtum",
    "clue": "Repeated encounters turn an argument into a cartoonist's romance.",
    "kind": "Film"
  },
  {
    "word": "swades",
    "clue": "A scientist looks homeward when a village needs light.",
    "kind": "Film"
  },
  {
    "word": "black",
    "clue": "A demanding teacher reaches a girl without sight or hearing.",
    "kind": "Film"
  },
  {
    "word": "iqbal",
    "clue": "A village bowler's ambition needs no spoken words.",
    "kind": "Film"
  },
  {
    "word": "noentry",
    "clue": "One romantic cover-up becomes several husbands' problem.",
    "kind": "Film"
  },
  {
    "word": "fanaa",
    "clue": "A charming guide carries a secret darker than his poetry.",
    "kind": "Film"
  },
  {
    "word": "krrish",
    "clue": "A mountain-raised young man finds a masked destiny in Singapore.",
    "kind": "Film"
  },
  {
    "word": "vivah",
    "clue": "An arranged match faces its hardest promise after a fire.",
    "kind": "Film"
  },
  {
    "word": "dhamaal",
    "clue": "A dying stranger's directions start a chaotic race to Goa.",
    "kind": "Film"
  },
  {
    "word": "partner",
    "clue": "A romance coach takes on a client in love with his own boss.",
    "kind": "Film"
  },
  {
    "word": "welcome",
    "clue": "A respectable marriage needs a gangster family to change careers.",
    "kind": "Film"
  },
  {
    "word": "ghajini",
    "clue": "Notes and tattoos hold together a broken trail of revenge.",
    "kind": "Film"
  },
  {
    "word": "jannat",
    "clue": "Easy money draws a gambler behind cricket's scorecards.",
    "kind": "Film"
  },
  {
    "word": "wanted",
    "clue": "A ruthless hired gun is hiding more than his employers realise.",
    "kind": "Film"
  },
  {
    "word": "dabangg",
    "clue": "Back-collar sunglasses and a policeman with flexible rules.",
    "kind": "Film"
  },
  {
    "word": "ready",
    "clue": "A runaway bride's greedy relatives meet an elaborate family plan.",
    "kind": "Film"
  },
  {
    "word": "singham",
    "clue": "A village policeman takes his defiance into a corrupt city.",
    "kind": "Film"
  },
  {
    "word": "barfi",
    "clue": "A mischievous young man says plenty without speaking.",
    "kind": "Film"
  },
  {
    "word": "kahaani",
    "clue": "A missing husband's trail winds through festive Kolkata.",
    "kind": "Film"
  },
  {
    "word": "fukrey",
    "clue": "Strange dreams become a risky source of easy money.",
    "kind": "Film"
  },
  {
    "word": "haider",
    "clue": "A missing father and a familiar tragedy in Kashmir.",
    "kind": "Film"
  },
  {
    "word": "queen",
    "clue": "A cancelled wedding becomes an unexpected solo honeymoon.",
    "kind": "Film"
  },
  {
    "word": "tamasha",
    "clue": "A holiday disguise feels more honest than everyday office life.",
    "kind": "Film"
  },
  {
    "word": "airlift",
    "clue": "An invasion makes an expatriate businessman responsible for thousands.",
    "kind": "Film"
  },
  {
    "word": "dangal",
    "clue": "A father's unfinished ambition returns through his daughters.",
    "kind": "Film"
  },
  {
    "word": "neerja",
    "clue": "A young cabin-crew member stands between hijackers and passengers.",
    "kind": "Film"
  },
  {
    "word": "sultan",
    "clue": "A fallen wrestler seeks a comeback in a different fighting arena.",
    "kind": "Film"
  },
  {
    "word": "raazi",
    "clue": "A marriage places a daughter inside an enemy military household.",
    "kind": "Film"
  },
  {
    "word": "sanju",
    "clue": "A star's turbulent life, retold with Ranbir in his shoes.",
    "kind": "Film"
  },
  {
    "word": "simmba",
    "clue": "An easy-money policeman finally finds a reason to change sides.",
    "kind": "Film"
  },
  {
    "word": "stree",
    "clue": "A town's men trust a painted doorway message after dark.",
    "kind": "Film"
  },
  {
    "word": "animal",
    "clue": "A son's hunger for his father's approval turns violently obsessive.",
    "kind": "Film"
  },
  {
    "word": "jawan",
    "clue": "A metro hijack becomes a public reckoning for powerful institutions.",
    "kind": "Film"
  },
  {
    "word": "pathaan",
    "clue": "An agent returns to confront a former insider and a deadly threat.",
    "kind": "Film"
  },
  {
    "word": "munjya",
    "clue": "An old village spirit still wants the wedding it never had.",
    "kind": "Film"
  },
  {
    "word": "chhaava",
    "clue": "A son defends a Maratha kingdom and his father's legacy.",
    "kind": "Film"
  },
  {
    "word": "newyork",
    "clue": "Three college friends find their lives reshaped by suspicion after September 11.",
    "kind": "Film"
  },
  {
    "word": "hichki",
    "clue": "A teacher's involuntary sounds are not her classroom's biggest obstacle.",
    "kind": "Film"
  },
  {
    "word": "dostana",
    "clue": "Two men invent a relationship to share a flat, then fall for the same woman.",
    "kind": "Film"
  },
  {
    "word": "rockon",
    "clue": "An unfinished band's old disagreements return with a chance to play again.",
    "kind": "Film"
  },
  {
    "word": "kesari",
    "clue": "Twenty-one soldiers face an army at an isolated frontier post.",
    "kind": "Film"
  },
  {
    "word": "masti",
    "clue": "Three husbands' secret adventures land them in the same murder investigation.",
    "kind": "Film"
  },
  {
    "word": "gunday",
    "clue": "Two refugee boys build a coal empire before love divides their partnership.",
    "kind": "Film"
  },
  {
    "word": "murder",
    "clue": "An old lover returns to a lonely wife's life, followed by a disappearance.",
    "kind": "Film"
  },
  {
    "word": "bhoot",
    "clue": "A Mumbai high-rise flat comes with a previous resident's unfinished story.",
    "kind": "Film"
  },
  {
    "word": "raone",
    "clue": "A game developer's villain escapes the screen and pursues his son.",
    "kind": "Film"
  },
  {
    "word": "judaai",
    "clue": "A wife's dream of wealth puts a price on sharing her husband.",
    "kind": "Film"
  },
  {
    "word": "judwaa",
    "clue": "Separated brothers find that distance cannot quite separate their reflexes.",
    "kind": "Film"
  },
  {
    "word": "khiladi",
    "clue": "A college group's fake kidnapping stops being a harmless wager.",
    "kind": "Film"
  },
  {
    "word": "saajan",
    "clue": "A woman loves a poet's words, while another man borrows his identity.",
    "kind": "Film"
  },
  {
    "word": "mohra",
    "clue": "A freed prisoner's new benefactor has a dangerous use for his gratitude.",
    "kind": "Film"
  },
  {
    "word": "pardes",
    "clue": "A promised American dream hides a very different fiance.",
    "kind": "Film"
  },
  {
    "word": "ghayal",
    "clue": "A boxer's search for his brother becomes a fight against a protected crime boss.",
    "kind": "Film"
  },
  {
    "word": "tezaab",
    "clue": "A dancer, an exploited daughter and the street tough who loves her.",
    "kind": "Film"
  },
  {
    "word": "tridev",
    "clue": "A policeman, a bandit's son and a street fighter find a common enemy.",
    "kind": "Film"
  },
  {
    "word": "zanjeer",
    "clue": "A policeman's childhood nightmare keeps returning to a horse-shaped bracelet charm.",
    "kind": "Film"
  },
  {
    "word": "satya",
    "clue": "A newcomer finds friendship in Mumbai's underworld, at a lasting cost.",
    "kind": "Film"
  },
  {
    "word": "ghatak",
    "clue": "A wrestler's trip from Banaras becomes a confrontation with a city's feared tyrant.",
    "kind": "Film"
  },
  {
    "word": "baburao",
    "clue": "An irritable landlord whose wrong-number calls rarely bring good news.",
    "kind": "Character"
  },
  {
    "word": "gabbar",
    "clue": "A bandit turns a simple headcount into a terrifying conversation.",
    "kind": "Character"
  },
  {
    "word": "mogambo",
    "clue": "An underground empire runs on fear and its master's occasional satisfaction.",
    "kind": "Character"
  },
  {
    "word": "circuit",
    "clue": "A gangster's loyal helper treats impossible favours as everyday errands.",
    "kind": "Character"
  },
  {
    "word": "munna",
    "clue": "A medical student's favourite treatment is a hug, not a prescription.",
    "kind": "Character"
  },
  {
    "word": "rancho",
    "clue": "An engineering student's unusual lessons outlast the identity he borrowed.",
    "kind": "Character"
  },
  {
    "word": "chatur",
    "clue": "A memorised college speech becomes a lesson he never intended to give.",
    "kind": "Character"
  },
  {
    "word": "simran",
    "clue": "A European holiday leaves her waiting for permission on a railway platform.",
    "kind": "Character"
  },
  {
    "word": "anjali",
    "clue": "The basketball-playing college friend whose unfinished romance returns at summer camp.",
    "kind": "Character"
  },
  {
    "word": "chulbul",
    "clue": "A swaggering policeman prefers his sunglasses behind his collar.",
    "kind": "Character"
  },
  {
    "word": "bhuvan",
    "clue": "A villager accepts a tax wager before he has a cricket team.",
    "kind": "Character"
  },
  {
    "word": "veeru",
    "clue": "A marriage negotiation becomes a very public performance atop a water tank.",
    "kind": "Character"
  },
  {
    "word": "basanti",
    "clue": "A talkative carriage driver has a trusted companion named Dhanno.",
    "kind": "Character"
  },
  {
    "word": "murad",
    "clue": "A chauffeur's son finds another voice in Mumbai's underground rap battles.",
    "kind": "Character"
  },
  {
    "word": "sehmat",
    "clue": "A daughter enters a military household with a wedding and a secret assignment.",
    "kind": "Character"
  },
  {
    "word": "kachra",
    "clue": "An overlooked villager gives an unlikely cricket team its sharpest spin.",
    "kind": "Character"
  },
  {
    "word": "faizal",
    "clue": "An underestimated son inherits his family's bloody Wasseypur score.",
    "kind": "Character"
  },
  {
    "word": "sardar",
    "clue": "A coal-belt patriarch leaves his sons a dangerous inheritance of revenge.",
    "kind": "Character"
  },
  {
    "word": "ishaan",
    "clue": "An art teacher sees the imagination hidden behind his struggling schoolwork.",
    "kind": "Character"
  },
  {
    "word": "naina",
    "clue": "A studious schoolmate's mountain trip becomes a romance revisited at a wedding.",
    "kind": "Character"
  },
  {
    "word": "shyam",
    "clue": "A bank-job hopeful becomes the grounded tenant in a disastrous ransom scheme.",
    "kind": "Character"
  },
  {
    "word": "majnu",
    "clue": "A feared gangster would much rather show someone his paintings.",
    "kind": "Character"
  },
  {
    "word": "lucky",
    "clue": "The quietest of four freeloaders still manages to make himself heard.",
    "kind": "Character"
  },
  {
    "word": "gopal",
    "clue": "The bossy freeloader supplies a fake grandson's voice while his friend supplies the face.",
    "kind": "Character"
  },
  {
    "word": "madhav",
    "clue": "The wisecracking freeloader keeps trying to outwit the bossiest man in his group.",
    "kind": "Character"
  },
  {
    "word": "choocha",
    "clue": "His peculiar dreams make his friends believe there is money in sleeping.",
    "kind": "Character"
  },
  {
    "word": "hunny",
    "clue": "He turns his best friend's bizarre dreams into lottery predictions.",
    "kind": "Character"
  },
  {
    "word": "zafar",
    "clue": "A struggling musician joins a dream-based scheme while his father's hospital bills mount.",
    "kind": "Character"
  },
  {
    "word": "virus",
    "clue": "An engineering college's feared director treats every minute like a competition.",
    "kind": "Character"
  },
  {
    "word": "farhan",
    "clue": "An engineering student keeps his real ambition behind a camera.",
    "kind": "Character"
  },
  {
    "word": "aditya",
    "clue": "A defeated businessman finds a reason to keep going after a talkative train encounter.",
    "kind": "Character"
  },
  {
    "word": "bunny",
    "clue": "A restless traveller must decide whether another departure is worth what he leaves behind.",
    "kind": "Character"
  },
  {
    "word": "aditi",
    "clue": "A fiery college friend called Meow takes time to recognise her perfect match.",
    "kind": "Character"
  },
  {
    "word": "kalpana",
    "clue": "She invents a romance with a tycoon without recognising the man she has actually met.",
    "kind": "Character"
  },
  {
    "word": "sanjay",
    "clue": "A tycoon's revenge depends on photographs, notes and messages tattooed on his body.",
    "kind": "Character"
  },
  {
    "word": "radhe",
    "clue": "A reckless college tough's devotion ends behind an institution's walls.",
    "kind": "Character"
  },
  {
    "word": "rahul",
    "clue": "An adopted son's choice of bride sends him away from his wealthy father's home.",
    "kind": "Character"
  },
  {
    "word": "pooja",
    "clue": "The fashion-conscious younger sister sets her own rules in London.",
    "kind": "Character"
  },
  {
    "word": "rohit",
    "clue": "His father's old computer brings an unexpected friend from the sky.",
    "kind": "Character"
  },
  {
    "word": "krishna",
    "clue": "A mountain-raised grandson follows love to Singapore and uncovers his father's fate.",
    "kind": "Character"
  },
  {
    "word": "jadoo",
    "clue": "A stranded visitor's extraordinary gifts draw their strength from sunlight.",
    "kind": "Character"
  },
  {
    "word": "sakeena",
    "clue": "A truck driver's love takes her across Partition's newly drawn divide.",
    "kind": "Character"
  },
  {
    "word": "rudra",
    "clue": "A Chanderi bookseller knows which old legend his friends should take seriously.",
    "kind": "Character"
  },
  {
    "word": "vicky",
    "clue": "A gifted tailor's mysterious new crush arrives with his town's most feared festival.",
    "kind": "Character"
  },
  {
    "word": "bittu",
    "clue": "The tailor's friend loses his girlfriend to Chanderi's new night-time threat.",
    "kind": "Character"
  },
  {
    "word": "sarkata",
    "clue": "Chanderi's new terror can send its head ahead of the rest of its body.",
    "kind": "Character"
  },
  {
    "word": "mukesh",
    "clue": "A film producer thinks a burning set will bury his secret forever.",
    "kind": "Character"
  },
  {
    "word": "rajiv",
    "clue": "A respectable groom discovers that winning his bride means reforming her gangster brothers.",
    "kind": "Character"
  },
  {
    "word": "lakhan",
    "clue": "A policeman's easy-money ambitions clash with his more principled elder brother.",
    "kind": "Character"
  },
  {
    "word": "shanti",
    "clue": "A screen star's unfinished story waits for a junior artist's next lifetime.",
    "kind": "Character"
  }
].map(Object.freeze));
  const words = new Set(answers.map(entry => entry.word));
  function next(history = [], previous = "", random = Math.random) {
    let seen = [...new Set(history.filter(word => words.has(word)))];
    let remaining = answers.filter(entry => !seen.includes(entry.word));
    if (!remaining.length) { seen = []; remaining = answers.filter(entry => entry.word !== previous); }
    const answer = remaining[Math.min(remaining.length - 1, Math.max(0, Math.floor(random() * remaining.length)))];
    return { answer, seen: [...seen, answer.word] };
  }
  return Object.freeze({ answers, next });
});
