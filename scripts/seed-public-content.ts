import { neon, Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('POSTGRES_URL or DATABASE_URL environment variable is required');
  process.exit(1);
}

interface DocSeed {
  name: string;
  filename: string;
  fileType: string;
  chunks: Array<{ text: string; label: string }>;
}

// ─── Famous Quotes ──────────────────────────────────────────────────────────

const quotes: DocSeed = {
  name: 'Famous Quotes',
  filename: 'famous-quotes.txt',
  fileType: '.txt',
  chunks: [
    // Movie Quotes
    { text: 'Here\'s looking at you, kid.', label: 'Casablanca (1942)' },
    { text: 'After all, tomorrow is another day.', label: 'Gone with the Wind (1939)' },
    { text: 'They may take our lives, but they\'ll never take our freedom!', label: 'Braveheart (1995)' },
    { text: 'Life is like a box of chocolates. You never know what you\'re gonna get.', label: 'Forrest Gump (1994)' },
    { text: 'It is not our abilities that show what we truly are. It is our choices.', label: 'Harry Potter and the Chamber of Secrets (2002)' },
    { text: 'The greatest trick the devil ever pulled was convincing the world he didn\'t exist.', label: 'The Usual Suspects (1995)' },
    { text: 'Hope is a good thing, maybe the best of things, and no good thing ever dies.', label: 'The Shawshank Redemption (1994)' },
    { text: 'Do, or do not. There is no try.', label: 'The Empire Strikes Back (1980)' },
    { text: 'It\'s not who I am underneath, but what I do that defines me.', label: 'Batman Begins (2005)' },
    { text: 'The world is full of obvious things which nobody by any chance ever observes.', label: 'The Hound of the Baskervilles (1902)' },

    // Book Quotes
    { text: 'It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair.', label: 'A Tale of Two Cities — Charles Dickens' },
    { text: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.', label: 'Pride and Prejudice — Jane Austen' },
    { text: 'All happy families are alike; each unhappy family is unhappy in its own way.', label: 'Anna Karenina — Leo Tolstoy' },
    { text: 'It was a bright cold day in April, and the clocks were striking thirteen.', label: '1984 — George Orwell' },
    { text: 'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since. Whenever you feel like criticizing anyone, he told me, just remember that all the people in this world haven\'t had the advantages that you\'ve had.', label: 'The Great Gatsby — F. Scott Fitzgerald' },
    { text: 'All that is gold does not glitter, not all those who wander are lost; the old that is strong does not wither, deep roots are not reached by the frost.', label: 'The Lord of the Rings — J.R.R. Tolkien' },
    { text: 'So we beat on, boats against the current, borne back ceaselessly into the past.', label: 'The Great Gatsby — F. Scott Fitzgerald' },
    { text: 'Who controls the past controls the future. Who controls the present controls the past.', label: '1984 — George Orwell' },
    { text: 'There is nothing either good or bad, but thinking makes it so.', label: 'Hamlet — William Shakespeare' },
    { text: 'To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.', label: 'Ralph Waldo Emerson' },

    // Speech Excerpts
    { text: 'I have a dream that my four little children will one day live in a nation where they will not be judged by the color of their skin but by the content of their character.', label: 'I Have a Dream — Martin Luther King Jr. (1963)' },
    { text: 'The only thing we have to fear is fear itself.', label: 'FDR Inaugural Address (1933)' },
    { text: 'Ask not what your country can do for you; ask what you can do for your country.', label: 'JFK Inaugural Address (1961)' },
    { text: 'We shall fight on the beaches, we shall fight on the landing grounds, we shall fight in the fields and in the streets, we shall fight in the hills; we shall never surrender.', label: 'Winston Churchill (1940)' },
    { text: 'That\'s one small step for man, one giant leap for mankind.', label: 'Neil Armstrong — Moon Landing (1969)' },
    { text: 'Injustice anywhere is a threat to justice everywhere. We are caught in an inescapable network of mutuality, tied in a single garment of destiny.', label: 'Letter from Birmingham Jail — Martin Luther King Jr. (1963)' },
    { text: 'We choose to go to the Moon in this decade and do the other things, not because they are easy, but because they are hard.', label: 'JFK Rice University Speech (1962)' },

    // Philosophy / Wisdom
    { text: 'The unexamined life is not worth living.', label: 'Socrates' },
    { text: 'He who has a why to live can bear almost any how.', label: 'Friedrich Nietzsche' },
    { text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', label: 'Will Durant (summarizing Aristotle)' },
    { text: 'No man ever steps in the same river twice, for it is not the same river and he is not the same man.', label: 'Heraclitus' },
    { text: 'Knowing yourself is the beginning of all wisdom.', label: 'Aristotle' },
    { text: 'Happiness is not something ready-made. It comes from your own actions.', label: 'Dalai Lama' },
    { text: 'In the middle of difficulty lies opportunity.', label: 'Albert Einstein' },
  ],
};

// ─── Gettysburg Address ─────────────────────────────────────────────────────

const gettysburg: DocSeed = {
  name: 'Gettysburg Address',
  filename: 'gettysburg-address.txt',
  fileType: '.txt',
  chunks: [
    {
      text: 'Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.',
      label: 'Gettysburg Address — Paragraph 1',
    },
    {
      text: 'Now we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure. We are met on a great battle-field of that war. We have come to dedicate a portion of that field, as a final resting place for those who here gave their lives that that nation might live. It is altogether fitting and proper that we should do this.',
      label: 'Gettysburg Address — Paragraph 2',
    },
    {
      text: 'But, in a larger sense, we can not dedicate — we can not consecrate — we can not hallow — this ground. The brave men, living and dead, who struggled here, have consecrated it, far above our poor power to add or detract. The world will little note, nor long remember what we say here, but it can never forget what they did here.',
      label: 'Gettysburg Address — Paragraph 3',
    },
    {
      text: 'It is for us the living, rather, to be dedicated here to the unfinished work which they who fought here have thus far so nobly advanced. It is rather for us to be here dedicated to the great task remaining before us — that from these honored dead we take increased devotion to that cause for which they gave the last full measure of devotion — that we here highly resolve that these dead shall not have died in vain — that this nation, under God, shall have a new birth of freedom — and that government of the people, by the people, for the people, shall not perish from the earth.',
      label: 'Gettysburg Address — Paragraph 4',
    },
  ],
};

// ─── Declaration of Independence ────────────────────────────────────────────

const declaration: DocSeed = {
  name: 'Declaration of Independence (Preamble)',
  filename: 'declaration-of-independence.txt',
  fileType: '.txt',
  chunks: [
    {
      text: 'When in the Course of human events, it becomes necessary for one people to dissolve the political bands which have connected them with another, and to assume among the powers of the earth, the separate and equal station to which the Laws of Nature and of Nature\'s God entitle them, a decent respect to the opinions of mankind requires that they should declare the causes which impel them to the separation.',
      label: 'Declaration of Independence — Opening',
    },
    {
      text: 'We hold these truths to be self-evident, that all men are created equal, that they are endowed by their Creator with certain unalienable Rights, that among these are Life, Liberty and the pursuit of Happiness.',
      label: 'Declaration of Independence — Self-Evident Truths',
    },
    {
      text: 'That to secure these rights, Governments are instituted among Men, deriving their just powers from the consent of the governed, — That whenever any Form of Government becomes destructive of these ends, it is the Right of the People to alter or to abolish it, and to institute new Government, laying its foundation on such principles and organizing its powers in such form, as to them shall seem most likely to effect their Safety and Happiness.',
      label: 'Declaration of Independence — Purpose of Government',
    },
  ],
};

// ─── US Constitution Preamble ───────────────────────────────────────────────

const constitution: DocSeed = {
  name: 'US Constitution — Preamble',
  filename: 'us-constitution-preamble.txt',
  fileType: '.txt',
  chunks: [
    {
      text: 'We the People of the United States, in Order to form a more perfect Union, establish Justice, insure domestic Tranquility, provide for the common defence, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and establish this Constitution for the United States of America.',
      label: 'US Constitution — Preamble',
    },
  ],
};

// ─── Bill of Rights ─────────────────────────────────────────────────────────

const billOfRights: DocSeed = {
  name: 'Bill of Rights',
  filename: 'bill-of-rights.txt',
  fileType: '.txt',
  chunks: [
    {
      text: 'Congress shall make no law respecting an establishment of religion, or prohibiting the free exercise thereof; or abridging the freedom of speech, or of the press; or the right of the people peaceably to assemble, and to petition the Government for a redress of grievances.',
      label: 'Amendment I',
    },
    {
      text: 'A well regulated Militia, being necessary to the security of a free State, the right of the people to keep and bear Arms, shall not be infringed.',
      label: 'Amendment II',
    },
    {
      text: 'No Soldier shall, in time of peace be quartered in any house, without the consent of the Owner, nor in time of war, but in a manner to be prescribed by law.',
      label: 'Amendment III',
    },
    {
      text: 'The right of the people to be secure in their persons, houses, papers, and effects, against unreasonable searches and seizures, shall not be violated, and no Warrants shall issue, but upon probable cause, supported by Oath or affirmation, and particularly describing the place to be searched, and the persons or things to be seized.',
      label: 'Amendment IV',
    },
    {
      text: 'No person shall be held to answer for a capital, or otherwise infamous crime, unless on a presentment or indictment of a Grand Jury, except in cases arising in the land or naval forces, or in the Militia, when in actual service in time of War or public danger; nor shall any person be subject for the same offence to be twice put in jeopardy of life or limb; nor shall be compelled in any criminal case to be a witness against himself, nor be deprived of life, liberty, or property, without due process of law; nor shall private property be taken for public use, without just compensation.',
      label: 'Amendment V',
    },
    {
      text: 'In all criminal prosecutions, the accused shall enjoy the right to a speedy and public trial, by an impartial jury of the State and district wherein the crime shall have been committed, which district shall have been previously ascertained by law, and to be informed of the nature and cause of the accusation; to be confronted with the witnesses against him; to have compulsory process for obtaining witnesses in his favor, and to have the Assistance of Counsel for his defence.',
      label: 'Amendment VI',
    },
    {
      text: 'In Suits at common law, where the value in controversy shall exceed twenty dollars, the right of trial by jury shall be preserved, and no fact tried by a jury, shall be otherwise re-examined in any Court of the United States, than according to the rules of the common law.',
      label: 'Amendment VII',
    },
    {
      text: 'Excessive bail shall not be required, nor excessive fines imposed, nor cruel and unusual punishments inflicted.',
      label: 'Amendment VIII',
    },
    {
      text: 'The enumeration in the Constitution, of certain rights, shall not be construed to deny or disparage others retained by the people.',
      label: 'Amendment IX',
    },
    {
      text: 'The powers not delegated to the United States by the Constitution, nor prohibited by it to the States, are reserved to the States respectively, or to the people.',
      label: 'Amendment X',
    },
  ],
};

// ─── I Have a Dream Speech (Key Excerpts) ───────────────────────────────────

const iHaveADream: DocSeed = {
  name: 'I Have a Dream — Martin Luther King Jr.',
  filename: 'i-have-a-dream.txt',
  fileType: '.txt',
  chunks: [
    {
      text: 'I am happy to join with you today in what will go down in history as the greatest demonstration for freedom in the history of our nation.',
      label: 'I Have a Dream — Opening',
    },
    {
      text: 'Five score years ago, a great American, in whose symbolic shadow we stand today, signed the Emancipation Proclamation. This momentous decree came as a great beacon light of hope to millions of Negro slaves who had been seared in the flames of withering injustice. It came as a joyous daybreak to end the long night of their captivity.',
      label: 'I Have a Dream — Five Score Years Ago',
    },
    {
      text: 'But one hundred years later, the Negro still is not free. One hundred years later, the life of the Negro is still sadly crippled by the manacles of segregation and the chains of discrimination. One hundred years later, the Negro lives on a lonely island of poverty in the midst of a vast ocean of material prosperity. One hundred years later, the Negro is still languished in the corners of American society and finds himself an exile in his own land.',
      label: 'I Have a Dream — One Hundred Years Later',
    },
    {
      text: 'I have a dream that one day this nation will rise up and live out the true meaning of its creed: We hold these truths to be self-evident, that all men are created equal.',
      label: 'I Have a Dream — The Dream',
    },
    {
      text: 'I have a dream that my four little children will one day live in a nation where they will not be judged by the color of their skin but by the content of their character. I have a dream today!',
      label: 'I Have a Dream — Content of Character',
    },
    {
      text: 'And when this happens, and when we allow freedom ring, when we let it ring from every village and every hamlet, from every state and every city, we will be able to speed up that day when all of God\'s children, black men and white men, Jews and Gentiles, Protestants and Catholics, will be able to join hands and sing in the words of the old Negro spiritual: Free at last! Free at last! Thank God Almighty, we are free at last!',
      label: 'I Have a Dream — Free at Last',
    },
  ],
};

// ─── JFK Inaugural Address (Key Excerpts) ───────────────────────────────────

const jfkInaugural: DocSeed = {
  name: 'JFK Inaugural Address (1961)',
  filename: 'jfk-inaugural.txt',
  fileType: '.txt',
  chunks: [
    {
      text: 'Let the word go forth from this time and place, to friend and foe alike, that the torch has been passed to a new generation of Americans — born in this century, tempered by war, disciplined by a hard and bitter peace, proud of our ancient heritage — and unwilling to witness or permit the slow undoing of those human rights to which this Nation has always been committed, and to which we are committed today at home and around the world.',
      label: 'JFK Inaugural — The Torch Has Been Passed',
    },
    {
      text: 'Let every nation know, whether it wishes us well or ill, that we shall pay any price, bear any burden, meet any hardship, support any friend, oppose any foe, in order to assure the survival and the success of liberty.',
      label: 'JFK Inaugural — Pay Any Price',
    },
    {
      text: 'And so, my fellow Americans: ask not what your country can do for you — ask what you can do for your country. My fellow citizens of the world: ask not what America will do for you, but what together we can do for the freedom of man.',
      label: 'JFK Inaugural — Ask Not',
    },
  ],
};

// ─── FDR First Inaugural (Key Excerpts) ─────────────────────────────────────

const fdrInaugural: DocSeed = {
  name: 'FDR First Inaugural Address (1933)',
  filename: 'fdr-inaugural.txt',
  fileType: '.txt',
  chunks: [
    {
      text: 'So, first of all, let me assert my firm belief that the only thing we have to fear is fear itself — nameless, unreasoning, unjustified terror which paralyzes needed efforts to convert retreat into advance.',
      label: 'FDR Inaugural — Fear Itself',
    },
    {
      text: 'This great Nation will endure as it has endured, will revive and will prosper. In every dark hour of our national life a leadership of frankness and vigor has met with that understanding and support of the people themselves which is essential to victory.',
      label: 'FDR Inaugural — The Nation Will Endure',
    },
  ],
};

// ─── Lincoln Second Inaugural ───────────────────────────────────────────────

const lincolnSecond: DocSeed = {
  name: 'Lincoln\'s Second Inaugural Address (1865)',
  filename: 'lincoln-second-inaugural.txt',
  fileType: '.txt',
  chunks: [
    {
      text: 'At this second appearing to take the oath of the Presidential office there is less occasion for an extended address than there was at the first. Then a statement somewhat in detail of a course to be pursued seemed fitting and proper. Now, at the expiration of four years, during which public declarations have been constantly called forth on every point and phase of the great contest which still absorbs the attention and engrosses the energies of the nation, little that is new could be presented.',
      label: 'Lincoln Second Inaugural — Opening',
    },
    {
      text: 'With malice toward none, with charity for all, with firmness in the right as God gives us to see the right, let us strive on to finish the work we are in, to bind up the nation\'s wounds, to care for him who shall have borne the battle and for his widow and his orphan, to do all which may achieve and cherish a just and lasting peace among ourselves and with all nations.',
      label: 'Lincoln Second Inaugural — With Malice Toward None',
    },
  ],
};

// ─── Seed Runner ────────────────────────────────────────────────────────────

const allDocs: DocSeed[] = [
  quotes,
  gettysburg,
  declaration,
  constitution,
  billOfRights,
  iHaveADream,
  jfkInaugural,
  fdrInaugural,
  lincolnSecond,
];

async function seed() {
  const pool = new Pool({ connectionString: databaseUrl });

  for (const doc of allDocs) {
    console.log(`Seeding: ${doc.name} (${doc.chunks.length} passages)...`);

    const client = await pool.connect();
    try {
      // Check if this public doc already exists (by name)
      const { rows: existing } = await client.query(
        'SELECT id FROM documents WHERE name = $1 AND user_id IS NULL',
        [doc.name]
      );

      if (existing.length > 0) {
        console.log(`  Already exists (id=${existing[0].id}), skipping.`);
        continue;
      }

      await client.query('BEGIN');

      const { rows } = await client.query(
        'INSERT INTO documents (user_id, name, original_filename, file_type, chunk_count) VALUES (NULL, $1, $2, $3, $4) RETURNING id',
        [doc.name, doc.filename, doc.fileType, doc.chunks.length]
      );
      const docId = rows[0].id;

      for (let i = 0; i < doc.chunks.length; i++) {
        await client.query(
          'INSERT INTO document_chunks (document_id, chunk_index, text, label) VALUES ($1, $2, $3, $4)',
          [docId, i, doc.chunks[i].text, doc.chunks[i].label]
        );
      }

      await client.query('COMMIT');
      console.log(`  Inserted as document id=${docId}`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`  Failed to seed ${doc.name}:`, error);
    } finally {
      client.release();
    }
  }

  await pool.end();
  console.log('\nSeeding complete!');
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
