import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Sample readings with comprehension questions
const SAMPLE_READINGS = [
  {
    id: "alice-rabbit-hole",
    title: "Alice's Adventure Begins",
    author: "Lewis Carroll",
    wordCount: 412,
    text: `Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice "without pictures or conversation?" So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her. There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, "Oh dear! Oh dear! I shall be late!" (when she thought it over afterwards, it occurred to her that she ought to have wondered at this, but at the time it all seemed quite natural); but when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and burning with curiosity, she ran across the field after the White Rabbit, never considering how in the world she was to get in again.`,
    questions: [
      {
        q: "What was Alice doing when she first saw the White Rabbit?",
        options: [
          "Reading a book with her sister",
          "Sitting by her sister on the bank",
          "Picking daisies",
          "Running across a field",
        ],
        answer: 1,
      },
      {
        q: "What did the White Rabbit have in its waistcoat-pocket?",
        options: ["Pink eyes", "A daisy-chain", "A watch", "A book"],
        answer: 2,
      },
      {
        q: "Why did Alice find the White Rabbit remarkable?",
        options: [
          "It was running very fast",
          "It had pink eyes",
          "It had a waistcoat-pocket and a watch",
          "It spoke to itself",
        ],
        answer: 2,
      },
      {
        q: "How did Alice feel before seeing the rabbit?",
        options: [
          "Excited and energetic",
          "Tired and sleepy",
          "Curious and alert",
          "Afraid and nervous",
        ],
        answer: 1,
      },
    ],
  },
  {
    id: "sherlock-case",
    title: "Sherlock Holmes Meets Watson",
    author: "Arthur Conan Doyle",
    wordCount: 398,
    text: `I took my pipe and notebook before settling into my armchair beside the fire in Baker Street. My friend Sherlock Holmes was curled up in his own chair opposite, with his thin, eager face turned towards the dying flames. He had spent all the morning absorbed in chemical research, and had emerged at lunch-time with the same dreamy, absent expression which showed that his mind was elsewhere. "You have been busy today, Holmes," I remarked. "Yes, Watson, I have," he replied, lighting a long thin cigar. "I have been working upon a most interesting little problem." "Tell me about it," I suggested, settling back in my chair. "It is a matter of some delicacy," Holmes continued, "and I hesitate to speak freely concerning it. However, I have reasons to believe that a most remarkable succession of events is impending. The case is of great importance, and I shall require your assistance." He rose from his chair and commenced to pace the room. "The facts, Watson, are these. I have received a communication from a certain client who has been the victim of a remarkable attempt at extortion."`,
    questions: [
      {
        q: "Where were Holmes and Watson sitting?",
        options: [
          "In a laboratory",
          "In Baker Street",
          "In Holmes's office",
          "At a restaurant",
        ],
        answer: 1,
      },
      {
        q: "What had Holmes been doing all morning?",
        options: [
          "Reading cases",
          "Walking in London",
          "Chemical research",
          "Sleeping",
        ],
        answer: 2,
      },
      {
        q: "What did Holmes ask Watson for?",
        options: [
          "A cigar",
          "His notebook",
          "Assistance with a case",
          "A cup of tea",
        ],
        answer: 2,
      },
      {
        q: "What was Holmes's case about?",
        options: [
          "A stolen jewel",
          "A murder investigation",
          "An attempt at extortion",
          "A missing person",
        ],
        answer: 2,
      },
    ],
  },
  {
    id: "pride-prejudice",
    title: "Elizabeth and Mr. Darcy",
    author: "Jane Austen",
    wordCount: 389,
    text: `Mr. Darcy sat alone in his study at Netherfield Park, wrestling with a most vexing problem. He had been trying to read the same page of his book for the past quarter hour, yet the words seemed to blur before his eyes. The real object of his thoughts was Miss Elizabeth Bennet, with her quick wit, lively manner, and those eyes that seemed to see directly into his soul. He had arrived in the country intending to enjoy the solitude and escape the tiresome social obligations of London. Instead, he found himself drawn irresistibly to a woman beneath his station. What could he be thinking? His pride rebelled against such a notion. Yet each time they met, he found himself admiring her more. Her refusal to be impressed by his rank and fortune, which might have offended him in another, instead proved irresistible. She was not like other women of his acquaintance, who seemed perpetually conscious of his status. Here was a lady of genuine intelligence and spirit. As evening fell and the shadows grew long across his desk, Mr. Darcy came to a troubling realization: he had fallen in love.`,
    questions: [
      {
        q: "What was Mr. Darcy trying to do when he was thinking about Elizabeth?",
        options: [
          "Take a walk",
          "Attend a party",
          "Read a book",
          "Write a letter",
        ],
        answer: 2,
      },
      {
        q: "Why was Mr. Darcy troubled by his feelings for Elizabeth?",
        options: [
          "She was engaged",
          "She was beneath his station",
          "She lived too far away",
          "She was already married",
        ],
        answer: 1,
      },
      {
        q: "What made Elizabeth different from other women Mr. Darcy knew?",
        options: [
          "She was wealthier",
          "She was more beautiful",
          "She had genuine intelligence and spirit",
          "She was from London",
        ],
        answer: 2,
      },
      {
        q: "Where did Mr. Darcy come to his realization about his feelings?",
        options: [
          "At a party",
          "In the garden",
          "In his study at evening",
          "At a social gathering",
        ],
        answer: 2,
      },
    ],
  },
];

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const readingId = searchParams.get("id");

  if (readingId) {
    const reading = SAMPLE_READINGS.find((r) => r.id === readingId);
    if (!reading) {
      return NextResponse.json({ error: "Reading not found" }, { status: 404 });
    }
    return NextResponse.json(reading);
  }

  // Return list of available readings
  return NextResponse.json(
    SAMPLE_READINGS.map((r) => ({
      id: r.id,
      title: r.title,
      author: r.author,
      wordCount: r.wordCount,
    })),
  );
}
