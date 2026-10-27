import { useState } from "react";
import Weather from "./Weather";

// ── Translations ─────────────────────────────────────────────────────────────

const T = {
  en: {
    title: "Avalanche Reduction Method",
    formula: "O = V / (T1 × T2 × T3)",
    source: "Werner Münter / Vapaalasku (Kustannus Oy Vapaalasku)",
    tabs: ["1. 3×3", "2. Red Flags", "3. Calculator", "4. Tips", "5. Weather"],
    weather: {
      intro: "Example view. Daily values, past 3 days and next 2.",
      loading: "Loading…", error: "Could not load weather",
      today: "Today", day: "Day", snow: "New snow", temp: "Min / max", wind: "Wind (gust)",
      driftNote: "Wind ≥ 6 m/s with sub-zero temperature: light dry snow drifts (FMI). Consider the wind red flag.",
      legend: "Wind and temperature at 10 m / 2 m above ground.",
      fetched: "Fetched", model: "model estimate", source: "Weather data:",
    },
    next: "Continue",
    matrix: {
      intro: "The 3×3 method assesses risk across three phases (planning, check, execution) and three criteria (conditions, terrain, human factor).",
      source: "Source: Werner Münter / Vapaalasku (Kustannus Oy Vapaalasku)",
      phases: [
        {
          label: "I Planning",
          color: "#c0392b",
          sections: [
            { label: "1. Conditions — Snow", items: ["Avalanche bulletin", "Expert assessments", "Own observations", "Other information"] },
            { label: "Weather", items: ["Weather history", "Current conditions", "Forecast", "Own observations"] },
            { label: "2. Terrain", items: ["Map", "Guidebooks", "Photos", "Trip reports", "Other sources", "Route alternatives", "Route card"] },
            { label: "3. Human Factor", items: ["Skill level", "Experience", "Performance capacity", "Leadership", "Communication", "Equipment", "Realistic goal"] },
          ],
        },
        {
          label: "II Check",
          color: "#d35400",
          sections: [
            { label: "1. Conditions — Snow", items: ["Avalanche bulletin", "Recent avalanches", "New snow amount", "Drifting snow", "Wind loading", "Sensitive areas", "Uptrack or ski tracks"] },
            { label: "Weather", items: ["Forecast", "Precipitation", "Wind", "Temperature", "Cloud cover", "Visibility"] },
            { label: "2. Terrain", items: ["Detailed terrain analysis", "Conditions on different route sections", "Route safety in current conditions"] },
            { label: "3. Human Factor", items: ["Group composition", "Group fitness", "Group mood", "Equipment", "Schedule", "Time plan"] },
          ],
        },
        {
          label: "III Execution",
          color: "#b8860b",
          sections: [
            { label: "1. Conditions — Snow", items: ["Avalanche debris", "Snowpack weaknesses", "Snow feel and sounds", "Other observations", "Possible avalanche size and consequences"] },
            { label: "Weather", items: ["Weather development", "Wind effect", "Solar radiation effect", "Air temperature effect"] },
            { label: "2. Terrain", items: ["Identifying avalanche terrain", "Analyzing avalanche paths", "Terrain demands", "Steepness", "Aspect", "Slope features", "Elevation", "Terrain above and below", "Terrain traps & safe zones", "Line selection"] },
            { label: "3. Human Factor", items: ["Decision-making", "Group performance", "Discipline", "Following safety protocols", "Communication openness", "Equipment function", "Weaknesses and problems", "Goal achievability"] },
          ],
        },
      ],
    },
    flags: {
      intro: "Check all red flags before heading out. Each flag increases risk — multiple simultaneous flags are a serious warning.",
      source: "Source: Jeremy Jones, The Art of Shralpinism",
      items: [
        { id: "snow", label: "New snow", desc: "Within 24h of a storm — 90% of avalanches happen during this window." },
        { id: "avy", label: "Signs of recent avalanches", desc: "Crown lines, debris, broken trees, or sluff paths." },
        { id: "collapse", label: "Collapsing or cracking snowpack", desc: "Whumpfing sounds or cracks shooting from ski/board tips — signs of unstable layers." },
        { id: "temp", label: "Rapid rise in temperature", desc: "Snowpack can't adjust to sudden warming. Extra caution on the first warm day after a storm." },
        { id: "wind", label: "Strong winds and drifting snow", desc: "Wind slabs can form without new snow. Watch leeward sides of ridges." },
        { id: "terrain", label: "Terrain selection", desc: "Where do you end up if an avalanche releases or you fall? Gullies, cliffs, trees — terrain amplifies small mistakes." },
      ],
      summary: ["No red flags", "1 red flag — stay alert", "2 red flags — reconsider", " red flags — serious danger"],
      summaryNote: ["Proceed to calculator — red flags don't replace it.", "Proceed to calculator — red flags don't replace it.", "Proceed to calculator — red flags don't replace it.", "Consider staying home."],
    },
    calc: {
      intro: "Result O ≤ 1 = acceptable risk. All fields required.",
      flagHints: {
        snow: "New snow flagged — verify V reflects current bulletin, not just the headline level.",
        avy: "Recent avalanche activity flagged — consider T2 'can't avoid' if activity was widespread.",
        collapse: "Collapsing/cracking flagged — persistent weak layer possible, consider upgrading V.",
        temp: "Rapid warming flagged — wet snow rules may apply, check snow type selection.",
        wind: "Wind loading flagged — wind slabs may not be reflected in bulletin aspect data.",
        terrain: "Terrain flagged — result O considers probability only, not consequence severity.",
      },
      flagHintsTitle: "From your red flags:",
      vLabel: "Avalanche danger level",
      vDesc: "Official bulletin for the area. Check before heading out.",
      dangerDetails: [
        { snowpack: "Generally well bonded and stable", natural: "Unlikely — only small avalanches possible", human: "Possible only with high load on isolated extreme terrain" },
        { snowpack: "Well bonded on most slopes, moderately bonded on some steep slopes", natural: "Large avalanches unlikely", human: "Possible with high load on steep slopes" },
        { snowpack: "Moderately or weakly bonded on many steep slopes", natural: "Medium, sometimes large avalanches possible", human: "Possible with low load on steep slopes" },
        { snowpack: "Weakly bonded on most slopes", natural: "Medium and large avalanches likely", human: "Likely with low load on steep slopes" },
        { snowpack: "Weakly bonded and very unstable throughout", natural: "Large avalanches very likely, even on gentle terrain", human: "Certain even with low load" },
      ],
      snowLabel: "Snow type",
      snowDesc: 'T2 ("2nd class reduction factors") is invalid with wet snow conditions. — Münter, 3×3 Reduction Method (Brooks-Range, 2007)',
      snowTypes: [{ label: "Dry snow", sub: "T2 applies" }, { label: "Wet snow", sub: "T2 does not apply" }],
      wetWarning: { title: "⚠ Wet snow: calculator underestimates risk", body: "T2 drops out of the denominator. A wet snowpack can release full-depth without warning.", note: "The bulletin's written description is the primary source for wet snow — use the calculator as a rough guide only." },
      spookyModerate: { title: '⚠ "Spooky Moderate"', body: "Statistically the most lethal rating — most fatalities occur at this level. If a persistent weak layer is suspected, treat it as Considerable (3).", source: "Jeremy Jones, The Art of Shralpinism" },
      level5: { title: "⛔ Very High — stay home", body: "DP=32. Maximum reduction factors (4×2×3=24) give O≈1.3 — not acceptable with any realistic combination.", source: "Münter, 3×3 Reduction Method (Brooks-Range, 2007)" },
      t1Label: "Steepness",
      t1Desc: "The steepest section of your route. Slab sweet spot: 34°–45°, bull's-eye at 39°. Terrain below 25° is almost always safe. Above 40°: rocky/moraine faces where loose snow avalanches occur; above 40° corniced ridges start.",
      t1Options: [
        { label: "Less than 40°", value: 2, desc: "Within the main slab danger zone (34°–45°). Ski track and snowshoe grip typically insufficient above 30° — usually requires bootpacking. Assess carefully." },
        { label: "Around 35°", value: 3, desc: "Slab probability increases rapidly 30°–39°. Typical steep freeride terrain. Single skier can trigger at this angle." },
        { label: "Less than 35°", value: 4, desc: "Below the main trigger zone. Mellower fell terrain such as Ylläs (<25° is almost always avalanche-safe). Rare slabs only during extreme instability." },
      ],
      t2Label: "Slope & snow",
      t2Desc: "Two independent sub-factors — both required. Values are multiplied together.",
      t2SectorLabel: "Avoidance of sectors",
      t2FreqLabel: "Frequented slopes",
      t2SectorOptions: [
        { label: "Can't avoid — all aspects dangerous", sublabel: "Bulletin declares all aspects at risk", value: 1, neutral: true, forced: true, desc: "When the bulletin names all (or nearly all) aspects as dangerous, no sector reduction factor can be applied. Münter's rule: T2 sector = 1." },
        { label: "No avoidance", value: 1, neutral: true, desc: "Route includes north-facing or bulletin risk slopes, but not all aspects are declared dangerous." },
        { label: "Avoid north sector", sublabel: "NW – N – NE", value: 2, desc: "Cold, shaded north slopes hold dangerous snow longer." },
        { label: "Avoid northern half", sublabel: "WNW – N – ENE", value: 3, desc: "Broader avoidance of all shaded north and west aspects." },
        { label: "Avoid all bulletin risk aspects", sublabel: "All aspects and elevations mentioned in the bulletin", value: 4, desc: "Best protection: route planned entirely outside bulletin risk zones." },
      ],
      t2FreqOptions: [
        { label: "Not frequented", value: 1, neutral: true, desc: "Slope has not been used heavily, or skiers have triggered slabs." },
        { label: "Constantly frequented slope", value: 2, desc: "Slope has been skied heavily all day without releases. Continuous traffic consolidates snow and tests layer bonding." },
      ],
      t3Label: "Group",
      t3Desc: "Safe distances: only one person at a time on a steep section, others wait in a safe spot.",
      t3Options: [
        { label: "More than 4 people, safe distances", value: 2, desc: "Large group spread out — only one person exposed at a time." },
        { label: "2–4 people, no safe distances", value: 2, desc: "Small group moving together without spacing." },
        { label: "2–4 people, safe distances", value: 3, desc: "Small group maintaining safe distances — best protection for a small group." },
      ],
      missingPrefix: "Still needed: ",
      resultOk: "✓ Acceptable risk",
      resultNo: "✕ Risk too high",
      resultNote: "Add more reduction factors (better T2 or T3) or choose a mellower or differently-oriented route.",
    },
    tricks: {
      intro: "From Jeremy Jones, The Art of Shralpinism",
      sections: [
        {
          label: "Beacon Protocol",
          items: [
            "When you put your beacon on, turn it on.",
            "Do a beacon check every time.",
            "Turn off your beacon at the end of the day by going into search mode.",
            "Check others by going into search mode.",
            "Have proper avy gear (shovel and probe) and know how to use it.",
            "Practice avy rescue every year with your partners.",
          ],
        },
        {
          label: "On the Mountain",
          items: [
            "Avoid wind if you can.",
            "Climb the safest way up, especially if there is avy danger.",
            "Look before you leap.",
            "Know your landing.",
            "Beware of the expert halo effect.",
            "Don't sluff your exit.",
            "Expect slopes to slide.",
            "Know your outrun.",
            "Never approach the edge of a corniced ridge blindly.",
            "Cracking snow between your tips while skinning is a serious red flag.",
            "A switchback while skinning is a good spot for a stability test.",
            "Start with the bottom of the line.",
          ],
        },
        {
          label: "Assessing Slope Angle with Ski Poles",
          items: [
            "Slope angle can be estimated quickly with two poles. Place one pole flat on the snow surface (horizontal). Rotate the other pole from the basket end, keeping the handles touching — when the tip touches the snow, the angle between them equals the slope angle.",
            "For a quick 30° check: hold one pole vertical and one along the slope. If the handle of the slope pole touches the midpoint of the vertical pole, the slope is approximately 30°.",
            "For more precision, use a clinometer app on your phone or a dedicated inclinometer.",
            "Skinning uptrack gives you a continuous feel for slope angle — use switchback points to do a quick stability assessment.",
          ],
        },
        {
          label: "Mindset",
          items: [
            "Ride to live another day.",
            "Read the avy report every day.",
            "Ego is not your amigo.",
            "Limit 'you fall, you die' scenarios.",
            "Respect exposure and move through it as fast as possible.",
            "Slow and steady wins the race.",
            "Celebrate turning around.",
            "Mountains speak; wise people listen.",
            "Speak up if you have funny feelings.",
            "Sleep in when the avy danger is high.",
            "Don't get hurt in December.",
            "Send while you can.",
            "Be bold, start out cold.",
            "Don't travel to a snowpack with deep slab instabilities.",
          ],
        },
        {
          label: "Practical",
          items: [
            "No matter how tired you are, you can always keep walking.",
            "Dry your skins and boots every chance you get, especially when camping.",
            "Give yourself extra time; you can always slow down in the mountains, but speeding up takes energy.",
            "Sleeping with a warm water bottle adds 10 degrees to your sleeping bag.",
            "Keep your base waxed and out of the sun.",
            "Slow is fast with rescues.",
            "Don't pee in the skin track or at the change-over spot.",
            "Don't tailgate on the skin track.",
            "Skins need to be kept warm when it is very cold; ride with them in your jacket.",
            "A thousand vertical feet takes roughly an hour to climb.",
            "When possible, put in a track to the base of the climb the day before an alpine start.",
          ],
        },
      ],
    },
  },

  fi: {
    title: "Avalanche Reduction Method",
    formula: "O = V / (T1 × T2 × T3)",
    source: "Werner Münter / Vapaalasku (Kustannus Oy Vapaalasku)",
    tabs: ["1. 3×3", "2. Liput", "3. Laskuri", "4. Vinkit", "5. Sää"],
    weather: {
      intro: "Esimerkkinäkymä. Päiväkohtaiset arvot, edelliset 3 päivää ja seuraavat 2.",
      loading: "Ladataan…", error: "Säätietoja ei saatu",
      today: "Tänään", day: "Päivä", snow: "Uusi lumi", temp: "Min / max", wind: "Tuuli (puuska)",
      driftNote: "Tuuli ≥ 6 m/s pakkasella: kevyt pakkaslumi lähtee liikkeelle (Ilmatieteen laitos). Harkitse tuuli-lippua.",
      legend: "Tuuli 10 m ja lämpötila 2 m maanpinnasta.",
      fetched: "Haettu", model: "malliennuste", source: "Säätiedot:",
    },
    next: "Jatka",
    matrix: {
      intro: "3×3-menetelmä arvioi riskin kolmessa vaiheessa (suunnittelu, tarkistus, toteutus) kolmen kriteerin kautta (olosuhteet, maasto, inhimillinen tekijä).",
      source: "Lähde: Werner Münter / Vapaalasku (Kustannus Oy Vapaalasku)",
      phases: [
        {
          label: "I Suunnittelu",
          color: "#c0392b",
          sections: [
            { label: "1. Olosuhteet — Lumi", items: ["Vyöryriskitiedote", "Asiantuntija-arviot", "Omat havainnot", "Muut tiedot"] },
            { label: "Sää", items: ["Säähistoria", "Säätila", "Sääennuste", "Omat havainnot"] },
            { label: "2. Maasto", items: ["Kartta", "Opaskirjat", "Valokuvat", "Retkiraportit", "Muut lähteet", "Reittivaihtoehdot", "Reittikortti"] },
            { label: "3. Inhimillinen tekijä", items: ["Taitotaso", "Kokemus", "Suorituskyky", "Johtaminen", "Kommunikaatio", "Varusteet", "Järkevä tavoite"] },
          ],
        },
        {
          label: "II Tarkistus",
          color: "#d35400",
          sections: [
            { label: "1. Olosuhteet — Lumi", items: ["Vyöryriskitiedote", "Tuoreet vyöryt", "Uuden lumen määrä", "Liikkuva lumi", "Kinostuminen", "Herkät alueet", "Nousu- tai laskujälkiä"] },
            { label: "Sää", items: ["Sääennuste", "Sateet", "Tuuli", "Lämpötila", "Pilvisyys", "Näkyvyys"] },
            { label: "2. Maasto", items: ["Tarkempi maastoanalyysi", "Olosuhteet reitin eri osissa", "Reitin turvallisuus vallitsevissa olosuhteissa"] },
            { label: "3. Inhimillinen tekijä", items: ["Ryhmän kokoonpano", "Ryhmän kunto", "Tunnelma", "Välineet", "Aikataulu", "Aikataulu"] },
          ],
        },
        {
          label: "III Toteutus",
          color: "#b8860b",
          sections: [
            { label: "1. Olosuhteet — Lumi", items: ["Vyöryjäljet", "Lumipeitteen heikkoudet", "Lumen tuntu ja äänet", "Muut havainnot", "Mahdollisen vyöryn koko ja seuraukset"] },
            { label: "Sää", items: ["Säätilan kehittyminen", "Tuulen vaikutus", "Auringon lämpövaikutus", "Ilman lämmön vaikutus"] },
            { label: "2. Maasto", items: ["Vyörymaaston tunnistaminen", "Vyöryväylien analysointi", "Maaston vaativuus", "Jyrkkyys", "Ilmansuunta", "Rinteen muodot", "Korkeus", "Maasto ylä- ja alapuolella", "Maastoansat & turvasaarekkeet", "Linjavalinta"] },
            { label: "3. Inhimillinen tekijä", items: ["Päätöksenteko", "Ryhmänä suoriutuminen", "Toiminnan kurinalaisuus", "Turvatoimien noudattaminen", "Kommunikaation avoimuus", "Välineiden toimivuus", "Heikkoudet ja ongelmat", "Tavoitteen saavutettavuus"] },
          ],
        },
      ],
    },
    flags: {
      intro: "Tarkista punaiset liput ennen lähtöä. Jokainen lippu kasvattaa riskiä — useampi samanaikaisesti on vakava varoitusmerkki.",
      source: "Lähde: Jeremy Jones, The Art of Shralpinism",
      items: [
        { id: "snow", label: "Tuore lumi", desc: "Myrskyä edeltävän 24h aikana tai sen aikana — 90 % vyöryistä tapahtuu tänä ikkunana." },
        { id: "avy", label: "Merkit viimeaikaisista vyöryistä", desc: "Kruunuviivat, vyöryromu, katkenneet puut tai lautaslumijäljet." },
        { id: "collapse", label: "Lumipeitteen halkeilu tai romahtaminen", desc: "Whumpf-ääni tai halkeamat suksen/laudan kärjissä — merkki epävakaista kerroksista." },
        { id: "temp", label: "Nopea lämpötilan nousu", desc: "Lumipeite ei ehdi sopeutua äkilliseen lämpenemiseen. Erityinen vaara ensimmäisenä lämpimänä päivänä." },
        { id: "wind", label: "Kova tuuli ja tuulikuljetteinen lumi", desc: "Tuulilaattoja voi syntyä ilman uutta lumisadetta. Vaara harjanteiden tuulensuojaisilla puolilla." },
        { id: "terrain", label: "Maaston valinta", desc: "Mihin ajaudut jos vyöry lähtee tai kaadut? Rotko, kallio, puut — maasto vahvistaa pienetkin virheet." },
      ],
      summary: ["Ei punaisia lippuja", "1 punainen lippu — ole tarkkana", "2 punaista lippua — harkitse uudelleen", " punaista lippua — vakava vaara"],
      summaryNote: ["Jatka laskuriin.", "Jatka laskuriin.", "Jatka laskuriin.", "Harkitse kotiin jäämistä."],
    },
    calc: {
      intro: "Tulos O ≤ 1 = riski hyväksyttävä. Kaikki kohdat pakollisia.",
      flagHints: {
        snow: "Tuore lumi rastitettu — varmista että V heijastaa nykyistä tiedotetta, ei pelkkää otsikkotasoa.",
        avy: "Viimeaikaiset vyöryt rastitettu — harkitse T2 'ei voida välttää' jos vyöryaktiviteetti oli laajaa.",
        collapse: "Halkeilu/romahtaminen rastitettu — piilevä heikko kerros mahdollinen, harkitse V:n nostamista.",
        temp: "Nopea lämpeneminen rastitettu — märän lumen säännöt voivat päteä, tarkista lumityyppi.",
        wind: "Tuulikuormitus rastitettu — tuulilaattoja voi esiintyä vaikka tiedote ei niitä mainitse.",
        terrain: "Maasto rastitettu — O kuvaa todennäköisyyttä, ei seurausten vakavuutta.",
      },
      flagHintsTitle: "Punaisista lipuistasi:",
      vLabel: "Vyöryvaaran taso",
      vDesc: "Virallinen tiedote alueelta. Tarkista ennen retkeä.",
      dangerDetails: [
        { snowpack: "Kauttaaltaan hyvin sitoutunut ja vakaa", natural: "Epätodennäköisiä — vain pienet vyöryt mahdollisia", human: "Mahdollisia vain suurella kuormituksella erittäin jyrkillä vyöryalttiiilla rinteillä" },
        { snowpack: "Useimmilla rinteillä hyvin sitoutunut, joillakin jyrkillä rinteillä vain kohtalaisesti sitoutunut", natural: "Suuret vyöryt epätodennäköisiä", human: "Mahdollisia suurella kuormituksella jyrkillä rinteillä" },
        { snowpack: "Kohtalaisesti tai heikosti sitoutunut monilla jyrkillä rinteillä", natural: "Keskikokoiset ja joissain olosuhteissa suuretkin vyöryt mahdollisia", human: "Mahdollisia jo vähäisellä lisäkuormituksella jyrkillä rinteillä" },
        { snowpack: "Heikosti sitoutunut useimmilla rinteillä", natural: "Keskikokoiset sekä suuret vyöryt todennäköisiä", human: "Todennäköisiä jo vähäisellä lisäkuormituksella jyrkillä rinteillä" },
        { snowpack: "Kauttaaltaan heikosti sitoutunut ja erittäin epävakaa", natural: "Suuret vyöryt erittäin todennäköisiä, mahdollisia jopa loivilla rinteillä", human: "Varmoja jo vähäisellä lisäkuormituksella jopa loivilla rinteillä" },
      ],
      snowLabel: "Lumen tyyppi",
      snowDesc: 'T2 ("2nd class reduction factors") ei ole voimassa märällä lumella. — Münter, 3×3 Reduction Method (Brooks-Range, 2007)',
      snowTypes: [{ label: "Kuiva lumi", sub: "T2 käytössä" }, { label: "Märkä lumi", sub: "T2 ei päde" }],
      wetWarning: { title: "⚠ Märällä lumella laskuri aliarvioi riskin", body: "T2 putoaa pois nimittäjästä. Sulava lumipeite voi laueta koko paksuudeltaan ilman varoitusmerkkejä.", note: "Tiedotteen sanallinen kuvaus on ensisijainen lähde märällä lumella — käytä laskuria vain suuntaa antavana." },
      spookyModerate: { title: '⚠ "Spooky Moderate"', body: "Tilastojen mukaan tappava taso — eniten kuolemia tapahtuu tällä luokituksella. Jos piilevä heikko kerros on mahdollinen, käsittele tasona Huomattava (3).", source: "Jeremy Jones, The Art of Shralpinism" },
      level5: { title: "⛔ Erittäin suuri — jää kotiin", body: "DP=32. Turvatoimien maksimituote (4×2×3=24) antaa O≈1.3 — ei hyväksyttävä millään realistisella yhdistelmällä.", source: "Münter, 3×3 Reduction Method (Brooks-Range, 2007)" },
      t1Label: "Jyrkkyys",
      t1Desc: "Reitin jyrkin kohta. Laattavyöryjen pääalue 34°–45°, huippu 39°. Alle 25° maasto on lähes aina vyöryturvallista. Yli 39°: jyrkkiä kivikko- ja moreenirinteitä joissa irtolumivyöryjä; yli 40° harjanteen rinteet alkavat olla huimatakin.",
      t1Options: [
        { label: "alle 40°", value: 2, desc: "Päävyöryvaaravyöhykkeellä (34°–45°). Lumikenkien ja nousukaarten pito ei yleensä enää riitä yli 30° rinteessä — bootpack yleensä tarpeen. Arvioi huolellisesti." },
        { label: "suurin n. 35°", value: 3, desc: "Laattavyörytodennäköisyys kasvaa nopeasti 30°–39°. Tyypillinen jyrkkä freeride-maasto. Yksittäinen laskija voi laukaista vyöryn." },
        { label: "suurin alle 35°", value: 4, desc: "Päälaukaisuvyöhykkeen alapuolella. Alle 25° on lähes aina turvallista — loiva tunturimaasto kuten Ylläs. Harvinaisia laattoja vain äärimmäisessä epävakaudessa." },
      ],
      t2Label: "Rinne ja lumi",
      t2Desc: "Kaksi itsenäistä tekijää — molemmat pakollisia. Arvot kerrotaan keskenään.",
      t2SectorLabel: "Riskisuuntien välttäminen",
      t2FreqLabel: "Liikennöity rinne",
      t2SectorOptions: [
        { label: "Ei voida välttää — kaikki suunnat vaarallisia", sublabel: "Tiedote ilmoittaa kaikki suunnat riskialueiksi", value: 1, neutral: true, forced: true, desc: "Kun tiedote nimeää kaikki (tai lähes kaikki) ilmansuunnat vaarallisiksi, sektoriturvatoimea ei voi soveltaa. Münter: T2 suunta = 1." },
        { label: "Ei välttämistä", value: 1, neutral: true, desc: "Reitti kulkee myös pohjoiseen suuntautuvilla tai tiedotteen riskirinteillä, mutta kaikkia suuntia ei ole nimetty vaarallisiksi." },
        { label: "Vältetään pohjoista sektoria", sublabel: "Luode – Pohjoinen – Koillinen", value: 2, desc: "Varjoisat, kylmät pohjoisrinteet — vaarallinen lumi säilyy niillä pidempään." },
        { label: "Vältetään pohjoista puoliympyrää", sublabel: "Länsiluode – Pohjoinen – Itäkoillinen", value: 3, desc: "Laajempi välttäminen: kaikki pohjois- ja länsipuolen varjoisat rinteet." },
        { label: "Vältetään tiedotteen riskisuunnat", sublabel: "Kaikki tiedotteessa mainitut suunnat ja korkeudet", value: 4, desc: "Paras suoja: reitti täysin tiedotteen riskikohteiden ulkopuolella." },
      ],
      t2FreqOptions: [
        { label: "Ei liikennöity", value: 1, neutral: true, desc: "Rinteellä ei ole kuljettu tiheästi tai kulkijat ovat laukaisseet lumilaattoja." },
        { label: "Jatkuvasti liikennöity rinne", value: 2, desc: "Tiheästi käytetty koko päivän ilman laukeamia. Liikenne tiivistää lunta ja testaa kerrosten sitoutumista." },
      ],
      t3Label: "Ryhmä",
      t3Desc: "Turvavälit: kerralla vain yksi henkilö jyrkällä kohdalla, muut odottavat turvallisessa paikassa.",
      t3Options: [
        { label: "Yli 4 henkilöä, turvavälit", value: 2, desc: "Suuri ryhmä hajaantuneena — kerralla vain yksi jyrkällä kohdalla." },
        { label: "2–4 henkilöä, ei turvavälejä", value: 2, desc: "Pieni ryhmä liikkuu yhdessä ilman turvaetäisyyksiä." },
        { label: "2–4 henkilöä, turvavälit", value: 3, desc: "Pieni ryhmä pitää turvavälit — paras suoja pienelle ryhmälle." },
      ],
      missingPrefix: "Puuttuu vielä: ",
      resultOk: "✓ Riski hyväksyttävä",
      resultNo: "✕ Riski liian suuri",
      resultNote: "Lisää turvatoimia (parempi T2 tai T3) tai valitse loivempi tai eri suuntainen reitti.",
    },
    tricks: {
      intro: "Jeremy Jones, The Art of Shralpinism",
      sections: [
        {
          label: "Vyörylähetinprotokolla",
          items: [
            "Kun puet vyörylähettimesi, laita se päälle.",
            "Tee lähetintarkistus joka kerta.",
            "Sammuta lähetin päivän päätteeksi siirtymällä hakutilaan.",
            "Tarkista muiden laitteet siirtymällä hakutilaan.",
            "Pidä mukana lapio ja sondi ja osaa käyttää niitä.",
            "Harjoittele vyörypelastamista joka vuosi kumppaniesi kanssa.",
          ],
        },
        {
          label: "Maastossa",
          items: [
            "Vältä tuulta jos mahdollista.",
            "Nousta turvallisinta reittiä, erityisesti jos on vyöryvaaraa.",
            "Katso ennen hyppäämistä.",
            "Tunne laskusi loppu.",
            "Varo asiantuntijan sädekehävaikutusta.",
            "Älä jätä uloskäyntiäsi lumilautaselle.",
            "Odota rinteen liukuvan.",
            "Tunne ulosajoalueesi.",
            "Älä lähesty räystäsharjanteen reunaa sokeasti.",
            "Halkeilu suksen kärjessä skinnatessa on vakava punainen lippu.",
            "Mutkakohta skinnatessa on hyvä paikka vakaustestille.",
            "Aloita linjan alta.",
          ],
        },
        {
          label: "Rinnejyrkkyyden arviointi sauvakikoilla",
          items: [
            "Rinnejyrkkyyttä voi mitata nopeasti kahdella sauvalla. Aseta toinen sauva vaakasuoraan lumen pinnalle. Roikuta toista sauvaa rannelenkistä niin, että kahvat koskettavat toisiaan — kun kärki koskettaa lunta, sauvojen välinen kulma vastaa rinteen kaltevuutta.",
            "Nopea 30°-tarkistus: pidä toinen sauva pystysuorassa. Roikuta toista sauvaa rannelenkistä alimman puolen rannelenkistä lumeen painetun jäljen alamman pään kohdakkain. Jos alarinteen puoleisen rannelenkistä roikkuvan sauvan kärki on kohdakkain lumeen painetun jäljen alapuolella, on rinne 30°. Sauvakärjen osuessa lumeen jäljen alapuolella on rinne jyrkempi kuin 30° — jokainen kymmenen sentin ylitys merkitsee kolmea lisäastetta rinnejyrkkyyteen.",
            "Tarkkuutta saa pienellä vesivaa'alla, jolla varmistetaan että vaakasuora sauva todella on vaakasuorassa.",
            "Skinnauskohdan mutkakohdat ovat hyviä paikkoja nopealle vakaustestille.",
          ],
        },
        {
          label: "Asenne",
          items: [
            "Laske elääksesi toisen päivän.",
            "Lue vyörytiedote joka päivä.",
            "Ego ei ole ystäväsi.",
            "Vältä 'kaadut, kuolet' -tilanteita.",
            "Kunnioita altistumista ja liiku sen läpi mahdollisimman nopeasti.",
            "Rauhallinen ja tasainen voittaa kilpailun.",
            "Juhli kääntymistä takaisin.",
            "Vuoret puhuvat — viisaat kuuntelevat.",
            "Puhu ääneen jos sinulla on outoja tuntemuksia.",
            "Nuku pitkään kun vyöryvaara on korkea.",
            "Älä loukkaannu joulukuussa.",
          ],
        },
        {
          label: "Käytännöllistä",
          items: [
            "Riippumatta väsymyksestäsi, voit aina jatkaa kävelemistä.",
            "Kuivaa skinit ja saappaat aina kun mahdollista, erityisesti telttaillessasi.",
            "Anna itsellesi ylimääräistä aikaa — voit aina hidastaa, mutta nopeutuminen kuluttaa energiaa.",
            "Lämmin vesipullo makuupussissa lisää 10 astetta lämpöä.",
            "Pidä lauta voideltuna ja poissa auringosta.",
            "Pelastamisessa hidas on nopea.",
            "Älä pissaa nousureitille tai vaihtokohdalle.",
            "Älä aja perässä nousureitillä.",
            "Pidä skinit lämpiminä kovassa pakkasessa — kanna niitä takissasi.",
            "Tuhat pystymetriä vie noin tunnin kiivetä.",
          ],
        },
      ],
    },
  },
};

const DANGER_LEVELS = [
  { label: { en: "1 — Low",           fi: "1 — Pieni" },          value: 2,  color: "#2d7d2d" },
  { label: { en: "2 — Moderate",      fi: "2 — Kohtalainen" },    value: 4,  color: "#b8900a" },
  { label: { en: "3 — Considerable",  fi: "3 — Huomattava" },     value: 8,  color: "#c85a00" },
  { label: { en: "4 — High",          fi: "4 — Suuri" },          value: 16, color: "#cc1f1f" },
  { label: { en: "5 — Very High",     fi: "5 — Erittäin suuri" }, value: 32, color: "#1a1a1a" },
];

// ── Sub-components ───────────────────────────────────────────────────────────

function Section({ id, label, desc, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        {id && <span style={{ background: "#1c1c1c", color: "#f4f0e6", fontSize: 10, fontWeight: 800, letterSpacing: 1.5, padding: "2px 7px", borderRadius: 2, fontFamily: "monospace", flexShrink: 0 }}>{id}</span>}
        <span style={{ fontSize: 14, fontWeight: 700, color: "#1c1c1c" }}>{label}</span>
      </div>
      {desc && <p style={{ fontSize: 12, color: "#777", margin: "0 0 10px", lineHeight: 1.5 }}>{desc}</p>}
      {children}
    </div>
  );
}

function OptionBtn({ label, sublabel, desc, value, active, neutral, forced, onClick }) {
  const bg = active ? (forced ? "#5a1a1a" : neutral ? "#555" : "#1c1c1c") : "transparent";
  const border = active ? (forced ? "#8b2020" : neutral ? "#555" : "#1c1c1c") : "#ccc";
  return (
    <button onClick={onClick} style={{
      width: "100%",
      background: bg,
      color: active ? "#f4f0e6" : "#333",
      border: `1.5px solid ${border}`,
      borderRadius: 4, padding: "10px 12px", textAlign: "left",
      cursor: "pointer", fontFamily: "inherit", marginBottom: 5, transition: "all 0.1s",
      ...(forced && !active ? { borderStyle: "dashed", borderColor: "#c0392b", color: "#c0392b" } : {}),
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
          {sublabel && <div style={{ fontSize: 11, opacity: 0.55, marginTop: 1 }}>{sublabel}</div>}
          <div style={{ fontSize: 11, opacity: active ? 0.7 : 0.45, marginTop: 4, lineHeight: 1.4 }}>{desc}</div>
        </div>
        {value > 1 && (
          <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 13, opacity: active ? 1 : 0.2, marginLeft: 12, flexShrink: 0, paddingTop: 2 }}>×{value}</span>
        )}
      </div>
    </button>
  );
}

function Warning({ color, textColor, children }) {
  return (
    <div style={{ marginTop: 10, padding: "10px 12px", background: color, color: textColor, borderRadius: 4, fontSize: 12, lineHeight: 1.5 }}>
      {children}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [lang, setLang] = useState("en");
  const [step, setStep] = useState("3x3");
  const [flags, setFlags] = useState({});
  const [danger, setDanger] = useState(null);
  const [snow, setSnow] = useState(null);
  const [t1, setT1] = useState(null);
  const [t2sector, setT2sector] = useState(null);
  const [t2freq, setT2freq] = useState(null);
  const [t3, setT3] = useState(null);

  const tx = T[lang];
  const c = tx.calc;

  const toggleFlag = (id) => setFlags(f => ({ ...f, [id]: !f[id] }));
  const flagCount = Object.values(flags).filter(Boolean).length;

  const wetSnow = snow === 1;
  const V   = danger !== null ? DANGER_LEVELS[danger].value : null;
  const rf1 = t1 !== null ? c.t1Options[t1].value : null;
  const rfSector = t2sector !== null ? c.t2SectorOptions[t2sector].value : null;
  const rfFreq   = t2freq   !== null ? c.t2FreqOptions[t2freq].value   : null;
  const rf3 = t3 !== null ? c.t3Options[t3].value : null;
  const rf2 = (!wetSnow && rfSector !== null && rfFreq !== null) ? rfSector * rfFreq : 1;
  const ready = V !== null && snow !== null && rf1 !== null && rf3 !== null &&
    (wetSnow || (rfSector !== null && rfFreq !== null));
  const denom = ready ? rf1 * (wetSnow ? 1 : rf2) * rf3 : null;
  const O = ready ? V / denom : null;
  const safe = O !== null && O <= 1;

  const missing = [];
  if (danger === null) missing.push("V");
  if (snow === null) missing.push(lang === "en" ? "Snow" : "Lumi");
  if (rf1 === null) missing.push("T1");
  if (!wetSnow && rfSector === null) missing.push("T2 " + (lang === "en" ? "sector" : "suunta"));
  if (!wetSnow && rfFreq === null) missing.push("T2 " + (lang === "en" ? "freq." : "liikennöinti"));
  if (rf3 === null) missing.push("T3");

  const formulaParts = ready
    ? [rf1, !wetSnow && rf2 > 1 ? rf2 : null, rf3].filter(Boolean).join(" × ")
    : null;

  const TABS = ["3x3", "flags", "calc", "tricks", "weather"];

  return (
    <div style={{ minHeight: "100vh", background: "#f4f0e6", fontFamily: "'Georgia', 'Times New Roman', serif", padding: "24px 16px 60px", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>

        {/* Header */}
        <div style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#aaa", textTransform: "uppercase", marginBottom: 4 }}>Werner Munter</div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1c1c1c", lineHeight: 1.15 }}>{tx.title}</h1>
            <div style={{ marginTop: 7, fontFamily: "monospace", fontSize: 11, color: "#888", background: "#ebe5d8", display: "inline-block", padding: "3px 9px", borderRadius: 3 }}>{tx.formula}</div>
          </div>
          {/* Language toggle */}
          <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
            {["en", "fi"].map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                padding: "4px 10px", fontSize: 11, fontWeight: lang === l ? 800 : 400,
                background: lang === l ? "#1c1c1c" : "transparent",
                color: lang === l ? "#f4f0e6" : "#888",
                border: `1.5px solid ${lang === l ? "#1c1c1c" : "#ccc"}`,
                borderRadius: 3, cursor: "pointer", fontFamily: "monospace", textTransform: "uppercase",
              }}>{l}</button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", marginBottom: 22, borderBottom: "2px solid #1c1c1c" }}>
          {TABS.map((key, i) => (
            <button key={key} onClick={() => setStep(key)} style={{
              flex: 1, padding: "7px 2px",
              background: step === key ? "#1c1c1c" : "transparent",
              color: step === key ? "#f4f0e6" : "#888",
              border: "none", cursor: "pointer", fontFamily: "inherit",
              fontSize: 11, fontWeight: step === key ? 700 : 400, transition: "all 0.1s",
            }}>{tx.tabs[i]}</button>
          ))}
        </div>

        {/* ── 3×3 ── */}
        {step === "3x3" && (
          <>
            <p style={{ fontSize: 12, color: "#777", margin: "0 0 4px", lineHeight: 1.6 }}>{tx.matrix.intro}</p>
            <p style={{ fontSize: 11, color: "#aaa", margin: "0 0 16px", fontStyle: "italic" }}>{tx.matrix.source}</p>
            {tx.matrix.phases.map((phase) => (
              <div key={phase.label} style={{ marginBottom: 18 }}>
                <div style={{ background: phase.color, color: "#fff", fontSize: 12, fontWeight: 700, padding: "6px 10px", borderRadius: "4px 4px 0 0" }}>{phase.label}</div>
                <div style={{ border: `1.5px solid ${phase.color}`, borderTop: "none", borderRadius: "0 0 4px 4px", padding: "10px 12px" }}>
                  {phase.sections.map((sec) => (
                    <div key={sec.label} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#444", marginBottom: 4 }}>{sec.label}</div>
                      {sec.items.map((item) => (
                        <div key={item} style={{ display: "flex", gap: 6, marginBottom: 3 }}>
                          <span style={{ fontSize: 10, color: "#bbb", flexShrink: 0, marginTop: 2 }}>☐</span>
                          <span style={{ fontSize: 12, color: "#333" }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={() => setStep("flags")} style={{ width: "100%", padding: "10px 0", background: "#1c1c1c", color: "#f4f0e6", border: "none", borderRadius: 4, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700 }}>
              {tx.next} →
            </button>
          </>
        )}

        {/* ── Red Flags ── */}
        {step === "flags" && (
          <>
            <p style={{ fontSize: 12, color: "#777", margin: "0 0 4px", lineHeight: 1.6 }}>{tx.flags.intro}</p>
            <p style={{ fontSize: 11, color: "#aaa", margin: "0 0 14px", fontStyle: "italic" }}>{tx.flags.source}</p>
            {tx.flags.items.map((f) => {
              const checked = !!flags[f.id];
              return (
                <button key={f.id} onClick={() => toggleFlag(f.id)} style={{
                  width: "100%", textAlign: "left", cursor: "pointer",
                  background: checked ? "#3d1818" : "transparent",
                  color: checked ? "#f4f0e6" : "#333",
                  border: `1.5px solid ${checked ? "#3d1818" : "#ccc"}`,
                  borderRadius: 4, padding: "10px 12px", marginBottom: 6,
                  fontFamily: "inherit", transition: "all 0.1s",
                  display: "flex", alignItems: "flex-start", gap: 10,
                }}>
                  <span style={{ fontSize: 14, lineHeight: 1, marginTop: 1, flexShrink: 0, color: checked ? "#ff6b6b" : "#ccc" }}>{checked ? "⚑" : "⚐"}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{f.label}</div>
                    <div style={{ fontSize: 11, opacity: checked ? 0.75 : 0.45, marginTop: 3, lineHeight: 1.4 }}>{f.desc}</div>
                  </div>
                </button>
              );
            })}
            <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 4, background: flagCount === 0 ? "#1a401a" : flagCount <= 2 ? "#3d3300" : "#3d1818", color: "#fff" }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {flagCount === 0 ? tx.flags.summary[0] : flagCount === 1 ? tx.flags.summary[1] : flagCount === 2 ? tx.flags.summary[2] : `${flagCount}${tx.flags.summary[3]}`}
              </div>
              <div style={{ fontSize: 11, opacity: 0.65, marginTop: 3 }}>
                {flagCount < 3 ? tx.flags.summaryNote[0] : tx.flags.summaryNote[3]}
              </div>
            </div>
            <button onClick={() => setStep("calc")} style={{ width: "100%", marginTop: 10, padding: "10px 0", background: "#1c1c1c", color: "#f4f0e6", border: "none", borderRadius: 4, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700 }}>
              {tx.next} →
            </button>
          </>
        )}

        {/* ── Calculator ── */}
        {step === "calc" && (
          <>
            <p style={{ fontSize: 12, color: "#777", margin: "0 0 18px", lineHeight: 1.5 }}>{c.intro}</p>

            {/* Flag hints */}
            {flagCount > 0 && (
              <div style={{ marginBottom: 20, padding: "10px 12px", background: "#ebe5d8", borderRadius: 4, borderLeft: "3px solid #888" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#555", marginBottom: 6 }}>{c.flagHintsTitle}</div>
                {Object.entries(flags).filter(([, v]) => v).map(([id]) => (
                  <div key={id} style={{ display: "flex", gap: 7, marginBottom: 4, alignItems: "flex-start" }}>
                    <span style={{ color: "#c0392b", flexShrink: 0, fontSize: 11, marginTop: 1 }}>⚑</span>
                    <span style={{ fontSize: 11, color: "#555", lineHeight: 1.4 }}>{c.flagHints[id]}</span>
                  </div>
                ))}
              </div>
            )}

            <Section id="V" label={c.vLabel} desc={c.vDesc}>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {DANGER_LEVELS.map((d, i) => (
                  <button key={i} onClick={() => setDanger(danger === i ? null : i)} style={{
                    background: danger === i ? d.color : "transparent", color: danger === i ? "#fff" : "#555",
                    border: `1.5px solid ${danger === i ? d.color : "#ccc"}`,
                    borderRadius: 4, padding: "9px 12px", textAlign: "left", cursor: "pointer",
                    fontFamily: "inherit", fontSize: 13, fontWeight: danger === i ? 700 : 400,
                    display: "flex", justifyContent: "space-between", transition: "all 0.1s",
                  }}>
                    <span>{d.label[lang]}</span>
                    <span style={{ fontFamily: "monospace", fontWeight: 700, opacity: danger === i ? 1 : 0.3 }}>V={d.value}</span>
                  </button>
                ))}
              </div>
              {danger !== null && (
                <div style={{ marginTop: 10, padding: "10px 12px", background: "#ebe5d8", borderRadius: 4, fontSize: 11, lineHeight: 1.5 }}>
                  {[
                    { label: lang === "en" ? "Snowpack" : "Lumipeite", value: c.dangerDetails[danger].snowpack },
                    { label: lang === "en" ? "Natural avalanches" : "Luonnolliset vyöryt", value: c.dangerDetails[danger].natural },
                    { label: lang === "en" ? "Human-triggered" : "Ihmisen laukaisemat", value: c.dangerDetails[danger].human },
                  ].map(row => (
                    <div key={row.label} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: "#555", flexShrink: 0, minWidth: 110 }}>{row.label}:</span>
                      <span style={{ color: "#444" }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              )}
              {danger === 1 && (
                <Warning color="#3d2e00" textColor="#f5d97a">
                  <strong>{c.spookyModerate.title}</strong>
                  <p style={{ margin: "5px 0 0" }}>{c.spookyModerate.body}</p>
                  <p style={{ margin: "6px 0 0", opacity: 0.7, fontStyle: "italic" }}>{c.spookyModerate.source}</p>
                </Warning>
              )}
              {danger === 4 && (
                <Warning color="#1a1a1a" textColor="#f4f0e6">
                  <strong>{c.level5.title}</strong>
                  <p style={{ margin: "5px 0 0" }}>{c.level5.body}</p>
                  <p style={{ margin: "6px 0 0", opacity: 0.55, fontStyle: "italic" }}>{c.level5.source}</p>
                </Warning>
              )}
            </Section>

            <div style={{ borderTop: "1px solid #d5cfc3", margin: "4px 0 20px" }} />

            <Section id="SNOW" label={c.snowLabel} desc={c.snowDesc}>
              <div style={{ display: "flex", gap: 6 }}>
                {c.snowTypes.map((s, i) => (
                  <button key={i} onClick={() => { setSnow(snow === i ? null : i); setT2sector(null); setT2freq(null); }} style={{
                    flex: 1, background: snow === i ? "#1c1c1c" : "transparent", color: snow === i ? "#f4f0e6" : "#555",
                    border: `1.5px solid ${snow === i ? "#1c1c1c" : "#ccc"}`,
                    borderRadius: 4, padding: "9px 8px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.1s",
                  }}>
                    <div style={{ fontSize: 13, fontWeight: snow === i ? 700 : 400 }}>{s.label}</div>
                    <div style={{ fontSize: 10, opacity: 0.5, marginTop: 3 }}>{s.sub}</div>
                  </button>
                ))}
              </div>
              {snow === 1 && (
                <Warning color="#2a1a00" textColor="#ffcc66">
                  <strong>{c.wetWarning.title}</strong>
                  <p style={{ margin: "5px 0 0" }}>{c.wetWarning.body}</p>
                  <p style={{ margin: "6px 0 0" }}><strong>{c.wetWarning.note}</strong></p>
                </Warning>
              )}
            </Section>

            <div style={{ borderTop: "1px solid #d5cfc3", margin: "4px 0 20px" }} />

            <Section id="T1" label={c.t1Label} desc={c.t1Desc}>
              {c.t1Options.map((opt, i) => (
                <OptionBtn key={i} {...opt} active={t1 === i} onClick={() => setT1(t1 === i ? null : i)} />
              ))}
            </Section>

            {!wetSnow && (
              <Section id="T2" label={c.t2Label} desc={c.t2Desc}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#555", marginBottom: 6 }}>{c.t2SectorLabel}</div>
                {c.t2SectorOptions.map((opt, i) => (
                  <OptionBtn key={i} {...opt} active={t2sector === i} onClick={() => setT2sector(t2sector === i ? null : i)} />
                ))}
                <div style={{ fontSize: 11, fontWeight: 700, color: "#555", margin: "10px 0 6px" }}>{c.t2FreqLabel}</div>
                {c.t2FreqOptions.map((opt, i) => (
                  <OptionBtn key={i} {...opt} active={t2freq === i} onClick={() => setT2freq(t2freq === i ? null : i)} />
                ))}
                {rfSector !== null && rfFreq !== null && (
                  <div style={{ fontSize: 11, color: "#888", marginTop: 6, fontFamily: "monospace" }}>
                    T2 = {rfSector} × {rfFreq} = <strong>{rf2}</strong>
                  </div>
                )}
              </Section>
            )}

            <Section id="T3" label={c.t3Label} desc={c.t3Desc}>
              {c.t3Options.map((opt, i) => (
                <OptionBtn key={i} {...opt} active={t3 === i} onClick={() => setT3(t3 === i ? null : i)} />
              ))}
            </Section>

            <div style={{ borderTop: "2px solid #1c1c1c", paddingTop: 20, marginTop: 4 }}>
              {ready ? (
                <>
                  <div style={{ fontFamily: "monospace", fontSize: 12, color: "#888", marginBottom: 10 }}>
                    {V} / ({formulaParts}) = {V} / {denom} = <strong style={{ color: "#1c1c1c" }}>{O.toFixed(2)}</strong>
                  </div>
                  <div style={{ borderRadius: 5, padding: "16px 18px", background: safe ? "#183d18" : "#3d1818", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 18 }}>{safe ? c.resultOk : c.resultNo}</div>
                      <div style={{ fontSize: 12, opacity: 0.65, marginTop: 3 }}>O = {O.toFixed(2)} {safe ? "≤ 1" : "> 1"}</div>
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: 38, fontWeight: 900, opacity: 0.15 }}>{O.toFixed(1)}</div>
                  </div>
                  {!safe && <p style={{ fontSize: 12, color: "#666", marginTop: 8, lineHeight: 1.5 }}>{c.resultNote}</p>}
                </>
              ) : (
                <div style={{ fontSize: 12, color: "#aaa" }}>{c.missingPrefix}<strong style={{ color: "#888" }}>{missing.join(", ")}</strong></div>
              )}
            </div>
          </>
        )}

        {/* ── Tricks of the Trade ── */}
        {step === "tricks" && (
          <>
            <p style={{ fontSize: 11, color: "#aaa", margin: "0 0 18px", fontStyle: "italic" }}>{tx.tricks.intro}</p>
            {tx.tricks.sections.map((sec) => (
              <div key={sec.label} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1c1c1c", borderBottom: "1.5px solid #1c1c1c", paddingBottom: 5, marginBottom: 10 }}>{sec.label}</div>
                {sec.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 10, color: "#bbb", flexShrink: 0, marginTop: 3, fontFamily: "monospace" }}>»</span>
                    <span style={{ fontSize: 13, color: "#333", lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}

        {/* ── Weather ── */}
        {step === "weather" && <Weather w={tx.weather} lang={lang} />}

      </div>
    </div>
  );
}
