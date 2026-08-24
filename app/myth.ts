export type Language = "cz" | "en" | "de" | "fr";

const angle = (index: number, brothers: number) =>
  Number((((index - 1) * 360) / brothers).toFixed(2));

const repeated = (text: string, count: number) =>
  Array.from({ length: Math.max(0, count) }, () => text).join("");

const powerLabel = (base: number, exponent: number) => {
  const digits = exponent * Math.log10(Math.max(base, 1));
  if (digits < 14) return String(base ** exponent);
  return `${base}^${exponent}`;
};

function failureGroups(brothers: number, survivors: number[]) {
  const survivorSet = new Set(survivors);
  const failures = Array.from({ length: brothers }, (_, index) => index + 1).filter(
    (index) => !survivorSet.has(index),
  );
  return {
    failures,
    first: failures[0],
    even: failures.filter((_, index) => index % 2 === 1),
    odd: failures.filter((_, index) => index >= 2 && index % 2 === 0),
  };
}

function generationEn(b: number, s: number[], g: number) {
  if (g === 0) return "There stands a castle in the middle of the world.";

  const { failures, first, even, odd } = failureGroups(b, s);
  const firstCycle = s.length === 1 || g === 1;
  const lines: string[] = [];

  lines.push(
    firstCycle
      ? `From that castle, ${b} identical paths lead in ${b} identical cardinal directions. At the ends of those paths, there are ${b} identical cities. There live a king and his ${b} identical sons in the central castle.`
      : `From each of these castles, ${b} identical paths lead in ${b} identical cardinal directions. At the ends of those paths, there are ${b} identical cities for each castle. There live a king and his ${b} identical sons in each central castle.`,
  );
  lines.push(
    firstCycle
      ? "All the princes set out for a quest simultaneously, each to one of the identical cities. They all have the same task. He who can fulfil it satisfactorily may return to his father's castle and become king. Whoever is unable to complete the task must remain in the assigned city forever."
      : "All the princes set out for a quest simultaneously, each to one of the identical cities reachable from their birthplace. They all have the same task. He who can fulfil it satisfactorily may return to his father's castle and become king. Whoever is unable to complete the task must remain in the assigned city forever.",
  );
  lines.push(
    "The task is to fail uniquely and spectacularly in a city that has many lookalikes.",
  );

  const failureText = new Map<number, string>();
  if (first !== undefined) {
    const route = first === 1
      ? firstCycle
        ? "Prince number 1 travels directly north of his father's world to city number 1, where"
        : "Princes number 1 travel directly north of their fathers' worlds to respective cities number 1, where"
      : firstCycle
        ? `Prince number ${first} travels to his own north, which forms an angle of ${angle(first, b)} degrees with his father's world's north, to city number ${first}, where`
        : `Princes number ${first} travel to their own norths, which form an angle of ${angle(first, b)} degrees with their fathers' worlds' norths, to respective cities number ${first}, where`;
    failureText.set(
      first,
      `${route} ${firstCycle ? "he embarrasses himself extraordinarily. Thus succeeding in the king's assignment, he does not effectively fail and cannot return to his father's house." : "they embarrass themselves extraordinarily. Thus succeeding in the respective kings' assignments, they do not effectively fail and cannot return to their fathers' houses."}`,
    );
  }

  even.forEach((i, index) => {
    failureText.set(
      i,
      firstCycle
        ? `Prince number ${i} travels to his own north, which forms an angle of ${angle(i, b)} degrees with his father's world's north, to city number ${i}. Here he manages to succeed spectacularly, which means that he failed to complete the task, which means that he succeeded${repeated(", which means that he failed, which means that he succeeded", index)} and cannot return to his father's house.`
        : `Princes number ${i} travel to their own norths, which form an angle of ${angle(i, b)} degrees with their fathers' worlds' norths, to respective cities number ${i}. Here they manage to succeed spectacularly, which means that they failed to complete the task, which means that they succeeded${repeated(", which means that they failed, which means that they succeeded", index)} and cannot return to their fathers' houses.`,
    );
  });

  odd.forEach((i, index) => {
    failureText.set(
      i,
      firstCycle
        ? `Prince number ${i} travels to his own north, which forms an angle of ${angle(i, b)} degrees with his father's world's north, to city number ${i}. Here he manages to fail spectacularly, which means that he succeeded to complete the task${repeated(", which means that he failed, which means that he succeeded", index + 1)} and cannot return to his father's house.`
        : `Princes number ${i} travel to their own norths, which form an angle of ${angle(i, b)} degrees with their fathers' worlds' norths, to respective cities number ${i}. Here they manage to fail spectacularly, which means that they succeeded to complete the task${repeated(", which means that they failed, which means that they succeeded", index + 1)} and cannot return to their fathers' houses.`,
    );
  });

  failures.forEach((i) => lines.push(failureText.get(i) ?? ""));

  s.forEach((i, index) => {
    if (firstCycle) {
      lines.push(
        `${s.length === 1 ? "Only prince" : "Prince"} number ${i} ${index === 0 ? "forgets" : "also forgets"} about his father's house. ${
          i === 1
            ? "He travels directly north of his father's world to city number 1,"
            : `He travels to his own north, which forms an angle of ${angle(i, b)} degrees with his father's world's north. He arrives in city number ${i},`
        } from which he makes a faithful replica of his home with the central castle, where he settles. The colonists set off in all ${b} cardinal directions and repair the area's desolate settlements. In a few years, they build ${b} identical thriving cities. The prince marries his own mother's double and becomes a king. One day, the queen gives birth to ${b} beautiful sons.`,
      );
    } else {
      lines.push(
        `${index === 0 ? "Each prince" : "Likewise, each prince"} number ${i} forgets about his father's house. ${
          i === 1
            ? "They travel directly north of their father's world to respective cities number 1,"
            : `They travel to their own norths, which form angles of ${angle(i, b)} degrees with their respective father's world's norths. They arrive in respective cities number ${i},`
        } from which they make faithful replicas of their homes with central castles, where they settle. The colonists set off in all ${b} cardinal directions from each of these cities. In a few years, they build ${b} identical thriving cities around each new centre. Each prince number ${i} marries his own mother's double and becomes a king. One day, each queen gives birth to ${b} beautiful sons.`,
      );
    }
  });

  const worlds = powerLabel(s.length, g);
  lines.push(
    s.length === 1
      ? "There stands a castle in the middle of the world."
      : `There stand ${worlds} castles in the middle of ${worlds} worlds.`,
  );
  return lines.join("\n");
}

function generationCz(b: number, s: number[], g: number) {
  if (g === 0) return "Uprostřed světa stojí hrad.";

  const { failures, first, even, odd } = failureGroups(b, s);
  const firstCycle = s.length === 1 || g === 1;
  const lines: string[] = [];

  lines.push(
    firstCycle
      ? `Z toho hradu ${b < 5 ? "vedou" : "vede"} ${b} ${b < 5 ? "stejné cesty" : "stejných cest"} na ${b} ${b < 5 ? "stejné světové strany" : "stejných světových stran"}. Na koncích těch cest stojí ${b} ${b < 5 ? "identická města" : "identických měst"}. Na hradě bydlí král a jeho ${b} ${b < 5 ? "identičtí synové" : "identických synů"}.`
      : `Z každého toho hradu ${b < 5 ? "vedou" : "vede"} ${b} ${b < 5 ? "stejné cesty" : "stejných cest"} na ${b} ${b < 5 ? "stejné světové strany" : "stejných světových stran"}. Na koncích těch cest stojí pokaždé ${b} ${b < 5 ? "identická města" : "identických měst"}. Na každém hradě bydlí král a jeho ${b} ${b < 5 ? "identičtí synové" : "identických synů"}.`,
  );
  lines.push(
    firstCycle
      ? "Všichni princové se vydávají v ten samý okamžik na zkoušenou, každý do jednoho z identických měst. Všichni mají tentýž úkol. Kdo jej dokáže uspokojivě splnit, stane se králem. Kdo úkol splnit nedokáže, musí zůstat v přiděleném městě navždy."
      : "Všichni princové se vydávají v ten samý okamžik na zkoušenou, každý do jednoho z identických měst, kam vede cesta z hradu, kde se narodili. Všichni mají tentýž úkol. Kdo jej dokáže uspokojivě splnit, stane se králem. Kdo úkol splnit nedokáže, musí zůstat v přiděleném městě navždy.",
  );
  lines.push(
    firstCycle
      ? "Každý z identických bratrů má za úkol ve svém identickém městě unikátním způsobem naprosto spektakulárně selhat."
      : "Každý z identických kraleviců má za úkol ve svém identickém městě unikátním způsobem naprosto spektakulárně selhat.",
  );

  const failureText = new Map<number, string>();
  if (first !== undefined) {
    const route = first === 1
      ? firstCycle
        ? "Princ číslo 1 se vydá přímo na sever otcovského světa do města číslo 1, kde"
        : "Princ, který má v rámci příslušné sady bratrů číslo 1, se vydá přímo na sever svého otcovského světa do příslušného města číslo 1, kde"
      : firstCycle
        ? `Princ číslo ${first} se vydá na svůj vlastní sever, který svírá se severem otcovského světa úhel ${angle(first, b)} stupňů, do města číslo ${first}. Zde`
        : `Princ, který má v rámci příslušné sady bratrů číslo ${first}, se vydá na svůj vlastní sever, který svírá se severem jeho otcovského světa úhel ${angle(first, b)} stupňů, do příslušného města číslo ${first}. Zde`;
    failureText.set(
      first,
      `${route} se neuvěřitelným způsobem znemožní, čímž úspěšně splní ${firstCycle ? "královo zadání" : "zadání příslušného krále"}, takže ve skutečnosti neselže a nemůže se stát králem.`,
    );
  }

  even.forEach((i, index) => {
    failureText.set(
      i,
      `${firstCycle ? `Princ číslo ${i}` : `Každý princ, který má v rámci příslušné sady bratrů číslo ${i},`} se vydá na svůj vlastní sever, který svírá se severem ${firstCycle ? "otcovského" : "jeho otcovského"} světa úhel ${angle(i, b)} stupňů, a dorazí do ${firstCycle ? "města" : "příslušného města"} číslo ${i}. Zde se mu podaří spektakulárně uspět, což znamená, že při plnění zadaného úkolu selhal, což znamená, že uspěl${repeated(", což znamená, že selhal, což znamená, že uspěl", index)} a nemůže se stát králem.`,
    );
  });

  odd.forEach((i, index) => {
    failureText.set(
      i,
      `${firstCycle ? `Princ číslo ${i}` : `Každý princ, který má v rámci příslušné sady bratrů číslo ${i},`} se vydá na svůj vlastní sever, který svírá se severem ${firstCycle ? "otcovského" : "jeho otcovského"} světa úhel ${angle(i, b)} stupňů, a dorazí do ${firstCycle ? "města" : "příslušného města"} číslo ${i}. Zde se mu podaří spektakulárně selhat, což znamená, že při plnění zadaného úkolu uspěl${repeated(", což znamená, že selhal, což znamená, že uspěl", index + 1)} a nemůže se stát králem.`,
    );
  });

  failures.forEach((i) => lines.push(failureText.get(i) ?? ""));

  s.forEach((i, index) => {
    if (firstCycle) {
      lines.push(
        `${s.length === 1 ? "Pouze princ" : index === 0 ? "Princ" : "Rovněž princ"} číslo ${i} se zcela oprostí od otcovského domu. ${
          i === 1
            ? "Vydá se přímo na sever otcovského světa do města číslo 1,"
            : `Vydá se na svůj vlastní sever, který svírá se severem otcovského světa úhel ${angle(i, b)} stupňů. Dorazí do města číslo ${i},`
        } ze kterého učiní věrnou repliku domova i s centrálním hradem, kde se usadí. ${b < 5 ? "Na všechny" : "Na všech"} ${b} ${b < 5 ? "světové strany" : "světových stran"} se rozjíždějí kolonisté a opravují zpustlé osady v okolí. Za několik let vybudují ${b} ${b < 5 ? "identická vzkvétající města" : "identických vzkvétajících měst"}. Princ se ožení s dvojnicí vlastní matky a stane se králem. Královna mu jednoho dne porodí ${b} ${b < 5 ? "krásné syny" : "krásných synů"}.`,
      );
    } else {
      lines.push(
        `${index === 0 ? "Každý princ" : "Rovněž každý princ"}, který má v rámci příslušné sady bratrů číslo ${i}, se zcela oprostí od svého otcovského domu. ${
          i === 1
            ? "Vydá se přímo na sever svého otcovského světa do příslušného města číslo 1,"
            : `Vydá se na svůj vlastní sever, který svírá se severem jeho otcovského světa úhel ${angle(i, b)} stupňů. Dorazí do příslušného města číslo ${i},`
        } ze kterého učiní věrnou repliku svého domova i s centrálním hradem, kde se usadí. ${b < 5 ? "Na všechny" : "Na všech"} ${b} ${b < 5 ? "světové strany" : "světových stran"} od jeho města se rozjíždějí kolonisté. Za několik let vybudují kolem každého centra ${b} ${b < 5 ? "identická vzkvétající města" : "identických vzkvétajících měst"}. Každý princ číslo ${i} se ožení s dvojnicí vlastní matky a stane se králem. Příslušná královna každému z nich jednoho dne porodí ${b} ${b < 5 ? "krásné syny" : "krásných synů"}.`,
      );
    }
  });

  const worlds = powerLabel(s.length, g);
  lines.push(
    s.length === 1
      ? "Uprostřed světa stojí hrad."
      : `Uprostřed ${worlds} světů stojí ${worlds} ${Number(worlds) < 5 ? "hrady" : "hradů"}.`,
  );
  return lines.join("\n");
}

function generationDe(b: number, s: number[], g: number) {
  if (g === 0) return "In der Mitte der Welt steht ein Schloss.";

  const { failures, first, even, odd } = failureGroups(b, s);
  const firstCycle = s.length === 1 || g === 1;
  const lines: string[] = [];

  lines.push(
    firstCycle
      ? `Von diesem Schloss führen ${b} identische Wege in ${b} identische Himmelsrichtungen. An ihren Enden stehen ${b} identische Städte. Im zentralen Schloss leben ein König und seine ${b} identischen Söhne.`
      : `Von jedem dieser Schlösser führen ${b} identische Wege in ${b} identische Himmelsrichtungen. An ihren Enden stehen jeweils ${b} identische Städte. In jedem Schloss leben ein König und seine ${b} identischen Söhne.`,
  );
  lines.push(
    firstCycle
      ? "Alle Prinzen brechen im selben Augenblick zur Prüfung auf, jeder in eine der identischen Städte. Sie haben alle dieselbe Aufgabe. Wer sie zufriedenstellend erfüllt, wird König. Wer sie nicht erfüllt, muss für immer in der zugewiesenen Stadt bleiben."
      : "Alle Prinzen brechen im selben Augenblick zur Prüfung auf, jeder in eine der identischen Städte, die vom Schloss seiner Geburt aus erreichbar sind. Sie haben alle dieselbe Aufgabe. Wer sie zufriedenstellend erfüllt, wird König. Wer sie nicht erfüllt, muss für immer in der zugewiesenen Stadt bleiben.",
  );
  lines.push(
    "Jeder der identischen Brüder soll in seiner identischen Stadt auf einzigartige und vollkommen spektakuläre Weise scheitern.",
  );

  const failureText = new Map<number, string>();
  if (first !== undefined) {
    const prince = firstCycle ? "Prinz" : "Jeder Prinz";
    const route = first === 1
      ? `${prince} Nummer 1 zieht genau nach Norden ${firstCycle ? "der väterlichen Welt" : "seiner väterlichen Welt"} in Stadt Nummer 1, wo`
      : `${prince} Nummer ${first} zieht zu seinem eigenen Norden, der mit dem Norden seiner väterlichen Welt einen Winkel von ${angle(first, b)} Grad bildet, und erreicht Stadt Nummer ${first}. Dort`;
    failureText.set(
      first,
      `${route} blamiert er sich auf unglaubliche Weise. Damit erfüllt er die Aufgabe des Königs erfolgreich, scheitert in Wahrheit nicht und kann nicht König werden.`,
    );
  }

  even.forEach((i, index) => {
    failureText.set(
      i,
      `${firstCycle ? "Prinz" : "Jeder Prinz"} Nummer ${i} zieht zu seinem eigenen Norden, der mit dem Norden seiner väterlichen Welt einen Winkel von ${angle(i, b)} Grad bildet, und erreicht Stadt Nummer ${i}. Dort gelingt es ihm spektakulär, erfolgreich zu sein, was bedeutet, dass er an der Aufgabe gescheitert ist, was bedeutet, dass er erfolgreich war${repeated(", was bedeutet, dass er gescheitert ist, was bedeutet, dass er erfolgreich war", index)} und nicht König werden kann.`,
    );
  });

  odd.forEach((i, index) => {
    failureText.set(
      i,
      `${firstCycle ? "Prinz" : "Jeder Prinz"} Nummer ${i} zieht zu seinem eigenen Norden, der mit dem Norden seiner väterlichen Welt einen Winkel von ${angle(i, b)} Grad bildet, und erreicht Stadt Nummer ${i}. Dort gelingt es ihm spektakulär zu scheitern, was bedeutet, dass er die Aufgabe erfüllt hat${repeated(", was bedeutet, dass er gescheitert ist, was bedeutet, dass er erfolgreich war", index + 1)} und nicht König werden kann.`,
    );
  });

  failures.forEach((i) => lines.push(failureText.get(i) ?? ""));

  s.forEach((i, index) => {
    lines.push(
      `${s.length === 1 ? "Nur Prinz" : firstCycle ? (index === 0 ? "Prinz" : "Auch Prinz") : (index === 0 ? "Jeder Prinz" : "Ebenso jeder Prinz")} Nummer ${i} löst sich völlig vom Haus seines Vaters. ${
        i === 1
          ? "Er zieht genau nach Norden der väterlichen Welt in Stadt Nummer 1,"
          : `Er zieht zu seinem eigenen Norden, der mit dem Norden seiner väterlichen Welt einen Winkel von ${angle(i, b)} Grad bildet. Er erreicht Stadt Nummer ${i},`
      } aus der er eine getreue Nachbildung seiner Heimat samt zentralem Schloss macht und sich dort niederlässt. In alle ${b} Himmelsrichtungen ziehen Kolonisten aus und setzen die verfallenen Siedlungen der Umgebung instand. Nach einigen Jahren bauen sie ${b} identische blühende Städte. Der Prinz heiratet das Ebenbild seiner Mutter und wird König. Eines Tages gebiert ihm die Königin ${b} schöne Söhne.`,
    );
  });

  const worlds = powerLabel(s.length, g);
  lines.push(
    s.length === 1
      ? "In der Mitte der Welt steht ein Schloss."
      : `In der Mitte von ${worlds} Welten stehen ${worlds} Schlösser.`,
  );
  return lines.join("\n");
}

function generationFr(b: number, s: number[], g: number) {
  if (g === 0) return "Au milieu du monde se dresse un château.";

  const { failures, first, even, odd } = failureGroups(b, s);
  const firstCycle = s.length === 1 || g === 1;
  const lines: string[] = [];

  lines.push(
    firstCycle
      ? `De ce château partent ${b} chemins identiques vers ${b} directions cardinales identiques. À leur extrémité se trouvent ${b} villes identiques. Dans le château central vivent un roi et ses ${b} fils identiques.`
      : `De chacun de ces châteaux partent ${b} chemins identiques vers ${b} directions cardinales identiques. À leur extrémité se trouvent chaque fois ${b} villes identiques. Dans chaque château vivent un roi et ses ${b} fils identiques.`,
  );
  lines.push(
    firstCycle
      ? "Tous les princes partent au même instant pour subir l’épreuve, chacun vers l’une des villes identiques. Tous ont la même tâche. Celui qui l’accomplit de manière satisfaisante devient roi. Celui qui échoue doit rester pour toujours dans la ville qui lui a été attribuée."
      : "Tous les princes partent au même instant pour subir l’épreuve, chacun vers l’une des villes identiques reliées au château où il est né. Tous ont la même tâche. Celui qui l’accomplit de manière satisfaisante devient roi. Celui qui échoue doit rester pour toujours dans la ville qui lui a été attribuée.",
  );
  lines.push(
    "Chacun des frères identiques doit échouer d’une manière unique et absolument spectaculaire dans sa ville identique.",
  );

  const failureText = new Map<number, string>();
  if (first !== undefined) {
    const prince = firstCycle ? "Le prince" : "Chaque prince";
    const route = first === 1
      ? `${prince} numéro 1 part droit vers le nord du monde paternel jusqu’à la ville numéro 1, où`
      : `${prince} numéro ${first} part vers son propre nord, qui forme un angle de ${angle(first, b)} degrés avec le nord du monde paternel, et atteint la ville numéro ${first}. Là`;
    failureText.set(
      first,
      `${route} il se ridiculise d’une façon incroyable. Il accomplit ainsi avec succès la mission du roi, de sorte qu’en réalité il n’échoue pas et ne peut devenir roi.`,
    );
  }

  even.forEach((i, index) => {
    failureText.set(
      i,
      `${firstCycle ? "Le prince" : "Chaque prince"} numéro ${i} part vers son propre nord, qui forme un angle de ${angle(i, b)} degrés avec le nord du monde paternel, et atteint la ville numéro ${i}. Là, il réussit spectaculairement, ce qui signifie qu’il a échoué dans sa tâche, ce qui signifie qu’il a réussi${repeated(", ce qui signifie qu’il a échoué, ce qui signifie qu’il a réussi", index)} et ne peut devenir roi.`,
    );
  });

  odd.forEach((i, index) => {
    failureText.set(
      i,
      `${firstCycle ? "Le prince" : "Chaque prince"} numéro ${i} part vers son propre nord, qui forme un angle de ${angle(i, b)} degrés avec le nord du monde paternel, et atteint la ville numéro ${i}. Là, il parvient à échouer spectaculairement, ce qui signifie qu’il a accompli sa tâche${repeated(", ce qui signifie qu’il a échoué, ce qui signifie qu’il a réussi", index + 1)} et ne peut devenir roi.`,
    );
  });

  failures.forEach((i) => lines.push(failureText.get(i) ?? ""));

  s.forEach((i, index) => {
    lines.push(
      `${s.length === 1 ? "Seul le prince" : firstCycle ? (index === 0 ? "Le prince" : "Le prince aussi") : (index === 0 ? "Chaque prince" : "De même, chaque prince")} numéro ${i} se détache entièrement de la maison de son père. ${
        i === 1
          ? "Il part droit vers le nord du monde paternel jusqu’à la ville numéro 1,"
          : `Il part vers son propre nord, qui forme un angle de ${angle(i, b)} degrés avec le nord du monde paternel. Il atteint la ville numéro ${i},`
      } dont il fait une fidèle réplique de son foyer avec son château central, où il s’installe. Des colons partent dans les ${b} directions cardinales et restaurent les établissements abandonnés des environs. En quelques années, ils bâtissent ${b} villes identiques et florissantes. Le prince épouse le double de sa propre mère et devient roi. Un jour, la reine lui donne ${b} beaux fils.`,
    );
  });

  const worlds = powerLabel(s.length, g);
  lines.push(
    s.length === 1
      ? "Au milieu du monde se dresse un château."
      : `Au milieu de ${worlds} mondes se dressent ${worlds} châteaux.`,
  );
  return lines.join("\n");
}

const integerToLetters = (input: bigint) => {
  let value = input;
  let output = "";
  do {
    output = String.fromCharCode(65 + Number(value % BigInt(26))) + output;
    value /= BigInt(26);
  } while (value > BigInt(0));
  return output;
};

const rationalToLetters = (
  numerator: bigint,
  denominator: bigint,
  maxFractionDigits = 12,
) => {
  const whole = numerator / denominator;
  let remainder = numerator % denominator;
  const wholeLetters = integerToLetters(whole);
  if (remainder === BigInt(0)) return wholeLetters;

  let fraction = "";
  for (let index = 0; index < maxFractionDigits; index += 1) {
    remainder *= BigInt(26);
    fraction += String.fromCharCode(65 + Number(remainder / denominator));
    remainder %= denominator;
    if (remainder === BigInt(0)) break;
  }
  return `${wholeLetters} ${fraction}`;
};

const numberToLetters = (input: string) => {
  const normalized = input.replace(",", ".");
  const [whole, fraction] = normalized.split(".");
  if (fraction === undefined) return integerToLetters(BigInt(whole));
  const denominator = BigInt(10) ** BigInt(fraction.length);
  const numerator = BigInt(whole) * denominator + BigInt(fraction);
  return rationalToLetters(numerator, denominator);
};

const labelPattern = /(číslo|number|Nummer|numéro)\s+(\d+)/giu;
const labelLinePattern = /(číslo|number|Nummer|numéro)\s+(\d+)/iu;
const anglePattern = /(úhel\s+|angle(?:s)?\s+of\s+|Winkel(?:n)?\s+von\s+|angle(?:s)?\s+de\s+)\d+(?:[.,]\d+)?(?=\s+(?:stupňů|degrees|Grad|degrés))/giu;

export function encodeMyth(text: string, _language: Language, brothers: number) {
  const exactAngles = text
    .split("\n")
    .map((line) => {
      const match = line.match(labelLinePattern);
      if (!match) return line;
      const prince = BigInt(match[2]);
      const encodedAngle = rationalToLetters(
        (prince - BigInt(1)) * BigInt(360),
        BigInt(brothers),
      );
      return line.replace(anglePattern, (value) =>
        value.replace(/\d+(?:[.,]\d+)?/, encodedAngle),
      );
    })
    .join("\n");

  const labelled = exactAngles.replace(
    labelPattern,
    (_value, prefix: string, number: string) =>
      `${prefix} ${integerToLetters(BigInt(number) - BigInt(1))}`,
  );
  const converted = labelled.replace(/\d+(?:[.,]\d+)?/g, numberToLetters);

  return converted
    .replace(/ß/g, "ss")
    .replace(/ẞ/g, "SS")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "OE")
    .replace(/æ/g, "ae")
    .replace(/Æ/g, "AE")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z\n]+/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .trim();
}

export function generateMyth(
  language: Language,
  brothers: number,
  survivors: number[],
  generations: number,
) {
  const makeGeneration = {
    cz: generationCz,
    en: generationEn,
    de: generationDe,
    fr: generationFr,
  }[language];
  const shortened = {
    cz: (generation: number) =>
      `… Text byl zkrácen po ${generation} generacích, aby stránka zůstala rychlá.`,
    en: (generation: number) =>
      `… The text was shortened after ${generation} generations to keep the page responsive.`,
    de: (generation: number) =>
      `… Der Text wurde nach ${generation} Generationen gekürzt, damit die Seite schnell bleibt.`,
    fr: (generation: number) =>
      `… Le texte a été abrégé après ${generation} générations afin que la page reste réactive.`,
  }[language];
  const maxCharacters = 180_000;
  const parts: string[] = [];
  let length = 0;

  for (let generation = 0; generation <= generations; generation += 1) {
    const part = makeGeneration(brothers, survivors, generation);
    if (length + part.length > maxCharacters) {
      parts.push(shortened(generation));
      break;
    }
    parts.push(part);
    length += part.length;
  }
  return parts.join("\n\n");
}
