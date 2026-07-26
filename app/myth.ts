export type Language = "cz" | "en";

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

export function generateMyth(
  language: Language,
  brothers: number,
  survivors: number[],
  generations: number,
) {
  const makeGeneration = language === "cz" ? generationCz : generationEn;
  const maxCharacters = 180_000;
  const parts: string[] = [];
  let length = 0;

  for (let generation = 0; generation <= generations; generation += 1) {
    const part = makeGeneration(brothers, survivors, generation);
    if (length + part.length > maxCharacters) {
      parts.push(
        language === "cz"
          ? `… Text byl zkrácen po ${generation} generacích, aby stránka zůstala rychlá.`
          : `… The text was shortened after ${generation} generations to keep the page responsive.`,
      );
      break;
    }
    parts.push(part);
    length += part.length;
  }
  return parts.join("\n\n");
}
