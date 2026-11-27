// English Lab · shared data: structure map, student plans and game content.
// Used by lab.html (teacher) and progreso.html (student view). Edit content here.
(function () {
  "use strict";
  // ---------------------------------------------------------------- structure map (structureId -> [name, level])
  var ST = {
    "a1.be": ["Verb to be (am / is / are)", "A1"],
    "a1.poss": ["Possessives (my, your, his, her)", "A1"],
    "a1.ps": ["Present simple (I / you / we)", "A1"],
    "a1.ps3": ["Present simple he / she (-s)", "A1"],
    "a1.psq": ["Questions with do / does", "A1"],
    "a1.qw": ["Question words (what, where, how...)", "A1"],
    "a1.there": ["There is / there are", "A1"],
    "a1.prep": ["In / on / at / next to", "A1"],
    "a1.like": ["Like / love / hate + noun or -ing", "A1"],
    "a1.art": ["A / an / some", "A1"],
    "a1.can": ["Can / can't", "A1"],
    "a1.pc": ["Present continuous (right now)", "A1"],
    "a1.was": ["Was / were", "A1"],
    "a1.past": ["Past simple (worked, went)", "A2"],
    "a1.going": ["Going to (plans)", "A2"],
    "b1.base": ["Present simple vs continuous", "A2"],
    "b1.state": ["State verbs (I know, not I'm knowing)", "B1"],
    "b1.past": ["Past simple for stories", "A2"],
    "b1.pastc": ["Past continuous (was doing... when)", "B1"],
    "b1.usedto": ["Used to", "B1"],
    "b1.fut": ["Future: will / going to / present continuous", "B1"],
    "b1.ppexp": ["Present perfect: experiences (ever / never)", "B1"],
    "b1.ppvs": ["Present perfect vs past simple", "B1"],
    "b1.ppjust": ["Just / already / yet", "B1"],
    "b1.since": ["Since / for", "B1"],
    "b1.ppc": ["Present perfect continuous", "B1"],
    "b1.pastp": ["Past perfect", "B1"],
    "b1.contrast": ["Although / however / even though", "B1"],
    "b1.cause": ["Because / so / that's why", "B1"],
    "b1.hedge": ["Polite opinion and disagreement", "B1"],
    "b1.compar": ["Comparatives and superlatives", "A2"],
    "b1.advice": ["Should / have to / must", "B1"],
    "b1.gerinf": ["Gerund vs infinitive", "B1"],
    "b1.deduce": ["Must be / might be / can't be", "B1"],
    "b1.rel": ["Relative clauses (who / which / that)", "B1"],
    "b1.cond1": ["First conditional", "B1"],
    "b1.cond2": ["Second conditional", "B1"],
    "b1.passive": ["Passive voice", "B1"],
    "b1.report": ["Reported speech", "B1"],
    "b1.phrasal": ["Work phrasal verbs", "B1"],
    "es.subj": ["Spanish trap: the subject is never missing (It is...)", "trap"],
    "es.age": ["Spanish trap: I'm 30 (not I have 30)", "trap"],
    "es.agree": ["Spanish trap: I agree (not I am agree)", "trap"],
    "es.people": ["Spanish trap: people are (plural)", "trap"],
    "es.adj": ["Spanish trap: adjective before noun", "trap"],
    "es.art": ["Spanish trap: a / an / the", "trap"],
    "es.dep": ["Spanish trap: depends on (not of)", "trap"],
    "es.actually": ["Spanish trap: actually vs currently", "trap"],
    "es.makedo": ["Spanish trap: make vs do", "trap"],
    "es.false": ["Spanish trap: false friends (assist, realize...)", "trap"]
  };

  // ---------------------------------------------------------------- students, plans and content
  // t: [structureId, target]
  var STUDENTS = {
    PA: {
      name: "Paula", level: "B1", sub: "B1 → B2 · 3 classes a week · 60 min",
      units: [
        { n: "My story today", s: ["b1.base", "b1.state", "b1.past", "es.subj", "es.agree"], g: "Baseline: everything she already does well gets on the map." },
        { n: "Stories from the past", s: ["b1.past", "b1.pastc", "b1.usedto", "es.actually"] },
        { n: "Plans and predictions", s: ["b1.fut", "es.dep", "es.makedo"], g: "End of cycle 0: Boss round (Jeopardy with all units so far)." },
        { n: "Have you ever...?", s: ["b1.ppexp", "b1.ppvs"] },
        { n: "News and updates", s: ["b1.ppjust", "b1.ppvs"] },
        { n: "How long?", s: ["b1.since", "b1.ppc"] },
        { n: "Before that...", s: ["b1.pastp", "b1.pastc"], g: "End of cycle 1 (perfects): Boss round." },
        { n: "My opinion", s: ["b1.contrast", "b1.cause", "b1.hedge"] },
        { n: "Compare and advise", s: ["b1.compar", "b1.advice", "b1.gerinf"] },
        { n: "Detective work", s: ["b1.deduce", "b1.rel"], g: "End of cycle 2: Boss round." },
        { n: "What if...?", s: ["b1.cond1", "b1.cond2"] },
        { n: "The project report", s: ["b1.passive", "b1.report", "b1.phrasal"], g: "Final Boss round." }
      ],
      run: [
        ["0-5", "Welcome + the map", "Open Progress: every structure starts as New. Tell her: today we find out what you already master."],
        ["5-15", "Spin & Speak", "2-3 spins. Play Two Truths and a Lie if it comes out (you guess the lie). Notebook open from minute 1."],
        ["15-40", "Jeopardy (baseline board)", "She picks the tiles. The 'Have you ever?' column is the diagnostic for the perfect tenses."],
        ["40-48", "Mystery Box", "1 or 2 boxes. The point is to laugh and break the routine."],
        ["48-58", "Error Court", "Her wins first, then 3-5 cases from her notebook. She finds the bug before you reveal."],
        ["58-60", "Progress", "Show the map again: what turned yellow or green today."]
      ],
      topics: ["Your career story", "Medellín then and now", "An innovation you admire", "Your perfect weekend", "A goal for 2027", "The best and worst of your job"],
      spin: [
        { u: 0, k: "Two truths, a lie", p: "Two truths and a lie: tell me 3 facts about your work week. I guess the lie.", t: [["b1.base", "A routine (I usually...)"], ["b1.base", "Something temporary (These days I'm...)"], ["es.subj", "Every sentence has a subject"]] },
        { u: 0, k: "Monday", p: "Describe a typical Monday at your job, and then what is different this month.", t: [["b1.base", "I usually / I normally..."], ["b1.base", "This month I'm ...-ing"], ["b1.state", "A state verb (I know / I need / I prefer)"]] },
        { u: 0, k: "Learned", p: "Tell me about the last time you learned something new.", t: [["b1.past", "Three verbs in past simple"], ["b1.past", "One irregular verb (went, took, met...)"], ["es.subj", "Every sentence has a subject"]] },
        { u: 0, k: "Agree?", p: "Do you agree? \"Medellín is the best city in Colombia to start a business.\"", t: [["es.agree", "I agree / I don't agree"], ["b1.state", "I think / I believe"], ["b1.base", "A fact in present simple"]] },
        { u: 1, k: "On the way", p: "Tell me a funny or strange thing that happened to you on the way to work.", t: [["b1.pastc", "I was ...-ing when..."], ["b1.past", "3+ verbs in past simple"], ["es.subj", "Every sentence has a subject"]] },
        { u: 1, k: "Childhood", p: "Your childhood: what did you use to do on Saturdays?", t: [["b1.usedto", "I used to..."], ["b1.usedto", "I didn't use to..."], ["b1.past", "One specific memory (One day, I...)"]] },
        { u: 1, k: "Actually", p: "What are you currently working on? And one thing people believe about your job that actually isn't true.", t: [["es.actually", "currently = actualmente"], ["es.actually", "actually = en realidad"], ["b1.base", "Present continuous for now"]] },
        { u: 1, k: "Bad meeting", p: "Describe a time a meeting went wrong.", t: [["b1.pastc", "While we were ..., ..."], ["b1.past", "What happened next (then, after that)"], ["b1.past", "One irregular verb"]] },
        { u: 2, k: "Weekend", p: "Your plans for next weekend.", t: [["b1.fut", "I'm going to... (intention)"], ["b1.fut", "I'm meeting... (fixed arrangement)"], ["b1.fut", "I think I'll... (not sure)"]] },
        { u: 2, k: "2040", p: "Predict: what will Medellín look like in 2040?", t: [["b1.fut", "will / won't for predictions"], ["es.dep", "It depends on..."], ["b1.fut", "probably / definitely in the right place"]] },
        { u: 2, k: "Make / do", p: "Tell me 3 things you have to make or do this week.", t: [["es.makedo", "make + a decision / a plan / a call"], ["es.makedo", "do + a task / research / homework"], ["b1.fut", "A future form"]] },
        { u: 3, k: "Have you ever", p: "Ask me 3 \"Have you ever...?\" questions. Then I ask you 3.", t: [["b1.ppexp", "Have you ever...?"], ["b1.ppexp", "I have never..."], ["b1.ppvs", "Follow-up in past: When did you...?"]] },
        { u: 3, k: "Best place", p: "The most interesting place you have ever visited.", t: [["b1.ppexp", "the most ... I've ever ..."], ["b1.ppvs", "I went there in... (past simple + time)"], ["b1.past", "Details in past simple"]] },
        { u: 3, k: "Career", p: "Your career so far: 3 things you have done, and when.", t: [["b1.ppexp", "I have worked / have learned..."], ["b1.ppvs", "Past simple with a time (in 2019...)"], ["b1.ppvs", "No present perfect with a finished time"]] },
        { u: 4, k: "Update", p: "Work update: what have you done this week, and what haven't you done yet?", t: [["b1.ppjust", "already"], ["b1.ppjust", "yet (negative or question)"], ["b1.ppjust", "just"]] },
        { u: 4, k: "Headlines", p: "Breaking news! Invent 3 headlines about your city and give them like a news anchor.", t: [["b1.ppjust", "... has just ..."], ["b1.ppvs", "Details in past simple (It happened at...)"], ["b1.ppexp", "for the first time / never before"]] },
        { u: 4, k: "To-do", p: "Your to-do list for this month: what's done, what's not.", t: [["b1.ppjust", "I've already..."], ["b1.ppjust", "I haven't ... yet"], ["b1.ppvs", "I finished it on Monday (past + time)"]] },
        { u: 5, k: "How long", p: "Tell me about 3 things in your life and how long they have been part of it.", t: [["b1.since", "for + a period"], ["b1.since", "since + a point in time"], ["b1.ppc", "I've been ...-ing"]] },
        { u: 5, k: "Tired?", p: "How do you feel today? Explain it with what you have been doing lately.", t: [["b1.ppc", "I've been ...-ing (recent activity)"], ["b1.since", "for / since"], ["b1.ppvs", "One finished thing in past simple"]] },
        { u: 5, k: "Journalist", p: "I'm a journalist. Interview time: your work and your life in Medellín.", t: [["b1.since", "How long have you...? answered right"], ["b1.ppc", "I've been working..."], ["b1.ppexp", "An experience (I've never...)"]] },
        { u: 6, k: "Too late", p: "Tell a story that starts: \"When I arrived, the meeting had already...\"", t: [["b1.pastp", "had + participle"], ["b1.pastc", "was / were ...-ing"], ["b1.past", "Sequence (then, after that, finally)"]] },
        { u: 6, k: "Bad day", p: "A day when everything went wrong.", t: [["b1.pastp", "I had forgotten / I had left..."], ["b1.pastc", "I was ...-ing when..."], ["b1.past", "3+ past simple verbs"]] },
        { u: 6, k: "Before", p: "Before you started your current job, what had you done?", t: [["b1.pastp", "I had worked / studied..."], ["b1.past", "Then I started..."], ["b1.ppvs", "Present perfect for now (I've been here...)"]] },
        { u: 7, k: "Remote", p: "Opinion: remote work is better than office work.", t: [["b1.hedge", "I'd say / In my opinion"], ["b1.contrast", "although / however"], ["b1.cause", "that's why / so"]] },
        { u: 7, k: "Coffee", p: "Disagree with me, politely: \"Coffee is overrated.\"", t: [["b1.hedge", "I see your point, but..."], ["b1.contrast", "even though / however"], ["es.agree", "I don't agree (not I'm not agree)"]] },
        { u: 7, k: "Pros & cons", p: "Pros and cons of living in Medellín.", t: [["b1.contrast", "On the other hand / however"], ["b1.cause", "because of / that's why"], ["b1.hedge", "It seems that / I'd say"]] },
        { u: 8, k: "Compare", p: "Compare two jobs you have had (or two cities you know).", t: [["b1.compar", "-er than / more ... than"], ["b1.compar", "the best / the most..."], ["b1.compar", "not as ... as"]] },
        { u: 8, k: "Advice", p: "Give advice to a new person on your team.", t: [["b1.advice", "You should..."], ["b1.advice", "You have to..."], ["b1.advice", "You don't have to..."]] },
        { u: 8, k: "Enjoy", p: "Things you enjoy, things you avoid, and things you want to do this year.", t: [["b1.gerinf", "enjoy / avoid + -ing"], ["b1.gerinf", "want / decide / plan + to"], ["b1.gerinf", "stop / remember with the right form"]] },
        { u: 9, k: "Detective", p: "Be a detective: look at my background (or a photo) and deduce things about me.", t: [["b1.deduce", "must be"], ["b1.deduce", "can't be"], ["b1.deduce", "might / could be"]] },
        { u: 9, k: "Team", p: "Describe 3 people on your team without saying their names.", t: [["b1.rel", "the person who..."], ["b1.rel", "the project which / that..."], ["b1.compar", "a comparison"]] },
        { u: 9, k: "Mystery", p: "Mystery: your boss didn't come to work today. Why? Give 3 theories.", t: [["b1.deduce", "He / She must have... or must be..."], ["b1.deduce", "might be"], ["b1.deduce", "can't be"]] },
        { u: 10, k: "If...", p: "Next year: what will you do if things go well? And if they don't?", t: [["b1.cond1", "If + present, will"], ["b1.cond1", "unless"], ["b1.fut", "a plan with going to"]] },
        { u: 10, k: "Lottery", p: "If you won the lottery tomorrow...", t: [["b1.cond2", "If I won / had..., I would..."], ["b1.cond2", "If I were..."], ["b1.contrast", "but / although"]] },
        { u: 10, k: "Mayor", p: "If you were the mayor of Medellín for one day.", t: [["b1.cond2", "If I were the mayor, I would..."], ["b1.cond2", "I wouldn't..."], ["b1.cause", "because / so"]] },
        { u: 11, k: "Project", p: "Tell me about a project at work: how it is done, step by step.", t: [["b1.passive", "is / are + participle"], ["b1.passive", "was / were + participle"], ["b1.phrasal", "set up / carry out / follow up"]] },
        { u: 11, k: "Report", p: "Report a conversation you had this week.", t: [["b1.report", "She said (that)..."], ["b1.report", "He asked me if..."], ["b1.report", "Tense change (is → was)"]] },
        { u: 11, k: "Meetings", p: "Your best tips for a good meeting.", t: [["b1.phrasal", "follow up / set up"], ["b1.phrasal", "come up with / figure out"], ["b1.advice", "should / have to"]] }
      ],
      jeo: [{ n: "Baseline", u: 0,
        cats: ["Now & usually", "Back then", "Have you ever?", "What's next?", "Spanglish fix"],
        tiles: [
          [
            { p: "What do you usually do on Friday nights?", t: [["b1.base", "I usually..."], ["es.subj", "Subject in every sentence"]] },
            { p: "What are you working on this month?", t: [["b1.base", "I'm working on..."], ["b1.state", "I need / I want / I know"]] },
            { p: "Describe the place where you are right now.", t: [["b1.base", "Present continuous for now"], ["es.adj", "Adjective before noun"], ["b1.state", "It looks / It seems"]] },
            { p: "Explain your job to a 7-year-old.", t: [["b1.base", "I help / I work with..."], ["b1.cause", "because / so"], ["es.subj", "Subject in every sentence"]] },
            { p: "A day in your life in 60 seconds, no stopping.", t: [["b1.base", "Routine (present simple)"], ["b1.base", "Something temporary (these days...)"], ["b1.state", "A state verb right"], ["es.subj", "Subject in every sentence"]] }
          ],
          [
            { p: "What did you do last weekend?", t: [["b1.past", "Regular verb in -ed"], ["b1.past", "Irregular verb"]] },
            { p: "What did you use to love when you were a kid?", t: [["b1.usedto", "I used to..."], ["b1.past", "A specific memory"]] },
            { p: "Tell me about your first job.", t: [["b1.past", "3+ past simple verbs"], ["b1.usedto", "I used to..."], ["b1.pastc", "I was ...-ing when..."]] },
            { p: "The worst trip of your life.", t: [["b1.past", "Irregular verbs right"], ["b1.pastc", "I was ...-ing when..."], ["b1.past", "Sequence words (then, finally)"]] },
            { p: "Tell me a story with: a phone, the rain, and a stranger.", t: [["b1.pastc", "Background in past continuous"], ["b1.past", "Action in past simple"], ["b1.past", "Sequence words"], ["es.subj", "Subject in every sentence"]] }
          ],
          [
            { p: "Have you ever eaten something really strange?", t: [["b1.ppexp", "I have / I've never..."], ["b1.ppvs", "Details in past simple"]] },
            { p: "Name 2 places you have visited and 1 you never have.", t: [["b1.ppexp", "I've visited / been to..."], ["b1.ppexp", "I've never been to..."]] },
            { p: "How long have you lived in your home?", t: [["b1.since", "for / since"], ["b1.ppexp", "I have lived..."], ["b1.ppvs", "I moved there in... (past)"]] },
            { p: "What have you achieved this year?", t: [["b1.ppexp", "I have + participle"], ["b1.ppjust", "already / yet"], ["b1.ppvs", "One thing in past simple + time"]] },
            { p: "Interview me: 4 \"Have you ever...?\" questions with follow-ups.", t: [["b1.ppexp", "Have you ever...?"], ["b1.ppvs", "When / Where did you...?"], ["b1.ppexp", "Right participles (been, eaten, seen)"], ["b1.ppvs", "No 'ago' with present perfect"]] }
          ],
          [
            { p: "What are you doing tomorrow?", t: [["b1.fut", "I'm ...-ing (arrangement)"], ["b1.fut", "I'm going to..."]] },
            { p: "Predict the weather and the traffic tomorrow.", t: [["b1.fut", "will / won't"], ["es.dep", "It depends on..."]] },
            { p: "Your plan for this English course.", t: [["b1.fut", "going to"], ["b1.fut", "will (decision now)"], ["b1.cond1", "If I..., I will..."]] },
            { p: "What will happen if Medellín builds a second metro line?", t: [["b1.cond1", "If + present, will"], ["b1.fut", "will for prediction"], ["es.dep", "It depends on..."]] },
            { p: "Your life 5 years from now: work, home, travel.", t: [["b1.fut", "going to"], ["b1.fut", "will / might"], ["b1.cond1", "If..., I will..."], ["es.subj", "Subject in every sentence"]] }
          ],
          [
            { p: "Fix it: \"I have 34 years.\"", t: [["es.age", "I'm 34 (years old)"], ["es.age", "Explains: be, not have"]] },
            { p: "Fix it: \"Is very important the meeting.\"", t: [["es.subj", "The meeting is very important."], ["es.subj", "Explains: subject first"]] },
            { p: "Fix it: \"Actually I work in a innovation center.\"", t: [["es.actually", "Currently..."], ["es.art", "an innovation center"], ["es.actually", "Explains actually vs currently"]] },
            { p: "Fix it: \"The people is very friendly but depends of the day.\"", t: [["es.people", "People are..."], ["es.dep", "depends on"], ["es.subj", "it depends on..."]] },
            { p: "Fix it: \"I am agree, we need to do a decision since two weeks.\"", t: [["es.agree", "I agree"], ["es.makedo", "make a decision"], ["b1.since", "for two weeks"], ["b1.ppvs", "We have needed / We've been trying..."]] }
          ]
        ]
      }, { n: "Perfect tenses", u: 3,
        cats: ["Ever & never", "Just / yet", "How long?", "Before that", "Perfect fix"],
        tiles: [
          [
            { p: "Have you ever met a famous person?", t: [["b1.ppexp", "Yes, I have / No, I haven't"], ["b1.ppvs", "Details in past simple"]] },
            { p: "Something you have never done but want to do.", t: [["b1.ppexp", "I've never..."], ["b1.fut", "I'd like to / I'm going to..."]] },
            { p: "The best food you have ever tried in Colombia.", t: [["b1.ppexp", "the best ... I've ever ..."], ["b1.ppvs", "When / where you tried it (past)"], ["b1.compar", "better than / the best"]] },
            { p: "Three things you have done that your family doesn't know.", t: [["b1.ppexp", "I have + participle"], ["b1.ppvs", "Past simple for the story"], ["b1.ppexp", "Right participles (been, done, seen)"]] },
            { p: "Interview me about my travels: 4 questions, then a summary.", t: [["b1.ppexp", "Have you ever...?"], ["b1.ppvs", "When did you...?"], ["b1.ppexp", "Summary: He has been to..."], ["es.subj", "Subject in every sentence"]] }
          ],
          [
            { p: "What have you just done before this class?", t: [["b1.ppjust", "I've just..."], ["es.subj", "Subject in every sentence"]] },
            { p: "What haven't you done yet this week?", t: [["b1.ppjust", "haven't ... yet"], ["b1.ppjust", "already"]] },
            { p: "Give me a project update in 30 seconds.", t: [["b1.ppjust", "already"], ["b1.ppjust", "yet"], ["b1.ppjust", "just"]] },
            { p: "Your team chat: what has happened today?", t: [["b1.ppjust", "X has just..."], ["b1.ppvs", "At 9 this morning, X said... (past + time)"], ["b1.ppjust", "yet in a question"]] },
            { p: "Good news, bad news: two of each about your week.", t: [["b1.ppjust", "just"], ["b1.ppjust", "yet"], ["b1.ppvs", "Past simple + time"], ["b1.contrast", "however / but"]] }
          ],
          [
            { p: "How long have you had your phone?", t: [["b1.since", "for / since"], ["b1.ppexp", "I have had..."]] },
            { p: "How long have you known your best friend?", t: [["b1.since", "for / since"], ["b1.state", "known (not been knowing)"]] },
            { p: "What have you been doing lately?", t: [["b1.ppc", "I've been ...-ing"], ["b1.since", "for / since"], ["b1.ppc", "lately / recently"]] },
            { p: "How long have you been working on your current project?", t: [["b1.ppc", "I've been working..."], ["b1.since", "for / since"], ["b1.ppvs", "It started in... (past)"]] },
            { p: "Your life in 'how long': home, job, a hobby, a friendship.", t: [["b1.since", "for + period"], ["b1.since", "since + point"], ["b1.ppc", "have been ...-ing"], ["b1.state", "known / had (state verbs)"]] }
          ],
          [
            { p: "What had you done before 8 a.m. today?", t: [["b1.pastp", "I had already..."], ["b1.past", "Then I..."]] },
            { p: "The last time you arrived late: what had happened?", t: [["b1.pastp", "had + participle"], ["b1.past", "past simple for the main story"]] },
            { p: "Before you started your current job, had you ever...?", t: [["b1.pastp", "I had never / I had ever..."], ["b1.past", "Then I started..."], ["b1.ppvs", "Now: I've been here for..."]] },
            { p: "A movie or series where someone discovered a secret.", t: [["b1.pastp", "had hidden / had lied"], ["b1.pastc", "was ...-ing when"], ["b1.past", "discovered / found out"]] },
            { p: "How you got your job: tell it from the end to the beginning.", t: [["b1.pastp", "Before that, I had..."], ["b1.past", "past simple"], ["b1.pastc", "I was ...-ing when"], ["b1.cause", "that's why / so"]] }
          ],
          [
            { p: "Fix it: \"I have seen her yesterday.\"", t: [["b1.ppvs", "I saw her yesterday."], ["b1.ppvs", "Explains: finished time = past simple"]] },
            { p: "Fix it: \"I live here since 2015.\"", t: [["b1.since", "I've lived here since 2015."], ["b1.since", "Explains: from the past until now"]] },
            { p: "Fix it: \"I am waiting for you since one hour.\"", t: [["b1.ppc", "I've been waiting"], ["b1.since", "for an hour"], ["b1.ppc", "Explains: started in the past, still now"]] },
            { p: "Fix it: \"When I arrived the train left, so I took a taxi.\" (it left before)", t: [["b1.pastp", "the train had left"], ["b1.past", "I took a taxi"], ["b1.pastp", "Explains: which action came first"]] },
            { p: "Fix it: \"I know him since we were kids and we are friends during 20 years.\"", t: [["b1.since", "I've known him since..."], ["b1.state", "known (state verb)"], ["b1.since", "for 20 years (not during)"], ["b1.ppvs", "We've been friends (present perfect)"]] }
          ]
        ]
      }, { n: "Opinions & ideas", u: 7,
        cats: ["Hot takes", "Compare it", "Advice desk", "Detective", "Who or which?"],
        tiles: [
          [
            { p: "Pineapple on pizza: yes or no?", t: [["b1.hedge", "In my opinion / I'd say"], ["b1.cause", "because"]] },
            { p: "Is social media good for business?", t: [["b1.hedge", "I think / It seems to me"], ["b1.contrast", "however"]] },
            { p: "Should companies have a 4-day week?", t: [["b1.hedge", "I'd say / I'm not sure, but"], ["b1.contrast", "although"], ["b1.cause", "that's why"]] },
            { p: "Disagree with me: \"Medellín has the best weather in the world.\"", t: [["b1.hedge", "I see your point, but..."], ["b1.contrast", "although / even though"], ["es.agree", "I don't agree (not I'm not agree)"]] },
            { p: "60-second speech: the biggest problem in your city and one solution.", t: [["b1.hedge", "In my view"], ["b1.contrast", "however"], ["b1.cause", "so / that's why"], ["b1.advice", "we should..."]] }
          ],
          [
            { p: "Coffee or tea?", t: [["b1.compar", "-er / more ... than"], ["b1.cause", "because"]] },
            { p: "Your city vs another city you know.", t: [["b1.compar", "comparative"], ["b1.compar", "superlative"]] },
            { p: "Your first job vs your job now.", t: [["b1.compar", "comparative"], ["b1.compar", "not as ... as"], ["b1.past", "past simple for the first job"]] },
            { p: "Three apps you use: the best, the worst, the most useful.", t: [["b1.compar", "the best / the worst"], ["b1.compar", "the most useful"], ["b1.cause", "because"]] },
            { p: "Rank 4 Colombian foods and defend your ranking.", t: [["b1.compar", "superlative"], ["b1.compar", "comparative"], ["b1.compar", "much / a bit + comparative"], ["b1.hedge", "I'd say"]] }
          ],
          [
            { p: "Your friend can't sleep. Advice?", t: [["b1.advice", "You should..."], ["b1.advice", "You shouldn't..."]] },
            { p: "A new employee asks about the dress code.", t: [["b1.advice", "have to / don't have to"], ["b1.advice", "should"]] },
            { p: "Someone is moving to Medellín. Rules and tips.", t: [["b1.advice", "must / have to"], ["b1.advice", "don't have to"], ["b1.advice", "should"]] },
            { p: "Your boss wants to quit sugar. Help him.", t: [["b1.advice", "should / ought to"], ["b1.gerinf", "stop eating / try to"], ["b1.cause", "because / so"]] },
            { p: "Advice for someone who wants to start a business, from your experience.", t: [["b1.advice", "should"], ["b1.advice", "have to"], ["b1.ppexp", "I've learned that..."], ["b1.gerinf", "avoid / consider + -ing"]] }
          ],
          [
            { p: "Someone is knocking at your door at 2 a.m. Who is it?", t: [["b1.deduce", "It must be / might be"], ["b1.deduce", "It can't be"]] },
            { p: "Your colleague is smiling a lot today. Why?", t: [["b1.deduce", "She must be..."], ["b1.deduce", "She might..."]] },
            { p: "Look at my face: how am I feeling? Why?", t: [["b1.deduce", "You must be..."], ["b1.deduce", "You might be..."], ["b1.deduce", "You can't be..."]] },
            { p: "The office is empty at 10 a.m. on a Tuesday. What's going on?", t: [["b1.deduce", "They must be..."], ["b1.deduce", "It can't be..."], ["b1.cause", "because"]] },
            { p: "On a desk: a phone, a cold coffee and a ticket to Bogotá. Tell the story.", t: [["b1.deduce", "must"], ["b1.deduce", "might"], ["b1.deduce", "can't"], ["b1.past", "past simple story"]] }
          ],
          [
            { p: "Describe your best friend in one sentence with 'who'.", t: [["b1.rel", "a person who..."], ["es.subj", "Subject in every sentence"]] },
            { p: "Describe an app with 'which' or 'that'.", t: [["b1.rel", "an app which / that..."], ["b1.base", "present simple"]] },
            { p: "Define 3 objects. I guess what they are.", t: [["b1.rel", "It's something that..."], ["b1.rel", "It's a thing which..."], ["b1.rel", "a place where..."]] },
            { p: "Describe 3 people at work without names.", t: [["b1.rel", "the person who..."], ["b1.rel", "the one that..."], ["b1.compar", "a comparison"]] },
            { p: "Riddle: describe a Colombian city with 3 relative clauses. I guess.", t: [["b1.rel", "who"], ["b1.rel", "which / that"], ["b1.rel", "where"], ["es.adj", "adjective before noun"]] }
          ]
        ]
      }, { n: "What if", u: 10,
        cats: ["If...", "Dreams", "How it's made", "They said...", "Office talk"],
        tiles: [
          [
            { p: "What will you do if it rains this weekend?", t: [["b1.cond1", "If it rains, I'll..."], ["es.subj", "it rains (subject)"]] },
            { p: "What happens if you don't sleep enough?", t: [["b1.cond1", "If I don't..., I..."], ["b1.cause", "so / that's why"]] },
            { p: "Your plan if the internet goes down tomorrow at work.", t: [["b1.cond1", "If..., we'll..."], ["b1.cond1", "a second if"], ["b1.cond1", "unless / as soon as"]] },
            { p: "Negotiate with me: \"If you give me X, I'll give you Y.\"", t: [["b1.cond1", "If you..., I'll..."], ["b1.cond1", "unless"], ["b1.hedge", "polite language"]] },
            { p: "Plan B, C and D for your next holiday.", t: [["b1.cond1", "If..., we'll..."], ["b1.cond1", "unless"], ["b1.fut", "going to"], ["b1.contrast", "although / however"]] }
          ],
          [
            { p: "If you could live anywhere, where?", t: [["b1.cond2", "If I could..., I would..."], ["b1.cause", "because"]] },
            { p: "If you were an animal, what would you be?", t: [["b1.cond2", "If I were..."], ["b1.cond2", "I would... because"]] },
            { p: "If you had one more hour every day...", t: [["b1.cond2", "If I had..., I'd..."], ["b1.cond2", "I wouldn't..."], ["b1.gerinf", "spend time + -ing"]] },
            { p: "If you were the CEO of your company for a week.", t: [["b1.cond2", "If I were the CEO, I'd..."], ["b1.cond2", "I wouldn't..."], ["b1.cause", "so that / because"]] },
            { p: "Interview me: 4 \"What would you do if...?\" questions.", t: [["b1.cond2", "What would you do if...?"], ["b1.cond2", "Follow-up with would"], ["b1.cond2", "If I were you, I'd..."], ["es.subj", "Subject in every sentence"]] }
          ],
          [
            { p: "Where is coffee grown in Colombia?", t: [["b1.passive", "It's grown in..."], ["es.subj", "It is (subject)"]] },
            { p: "How is an arepa made?", t: [["b1.passive", "is mixed / is cooked"], ["b1.passive", "a second passive"]] },
            { p: "Your company: what is done there every day?", t: [["b1.passive", "is done / is checked"], ["b1.passive", "are + participle"], ["b1.phrasal", "a work phrasal verb"]] },
            { p: "A famous building: when was it built, by whom, why?", t: [["b1.passive", "was built"], ["b1.passive", "by + person"], ["b1.cause", "because / so that"]] },
            { p: "Explain a process at your job, step by step, in passive.", t: [["b1.passive", "present passive"], ["b1.passive", "past passive"], ["b1.phrasal", "set up / carry out"], ["es.subj", "Subject in every sentence"]] }
          ],
          [
            { p: "What did your boss say this week?", t: [["b1.report", "He said (that)..."], ["b1.report", "Tense change"]] },
            { p: "Report a question someone asked you today.", t: [["b1.report", "She asked me if / what..."], ["b1.report", "Word order: what I wanted (not what did I want)"]] },
            { p: "Report a funny conversation with a family member.", t: [["b1.report", "said"], ["b1.report", "told me"], ["b1.report", "asked"]] },
            { p: "Report a news story you read this week.", t: [["b1.report", "They said that..."], ["b1.passive", "It was reported that..."], ["b1.report", "Tense change"]] },
            { p: "Gossip time: report 3 things 3 different people said (invented).", t: [["b1.report", "said"], ["b1.report", "told"], ["b1.report", "asked"], ["b1.report", "explained / suggested"]] }
          ],
          [
            { p: "What do you need to follow up on this week?", t: [["b1.phrasal", "follow up on"], ["b1.fut", "I'm going to..."]] },
            { p: "Who came up with the best idea on your team?", t: [["b1.phrasal", "came up with"], ["b1.past", "past simple"]] },
            { p: "A problem you had to figure out.", t: [["b1.phrasal", "figure out"], ["b1.past", "past simple"], ["b1.cause", "so / that's why"]] },
            { p: "Set up a meeting with me now: day, time, topic.", t: [["b1.phrasal", "set up"], ["b1.fut", "Are you free on...? / I'm meeting..."], ["b1.hedge", "Would it be possible...?"]] },
            { p: "Run a 1-minute meeting: open, agenda, close.", t: [["b1.phrasal", "go over"], ["b1.phrasal", "wrap up"], ["b1.hedge", "polite language"], ["b1.fut", "will / going to"]] }
          ]
        ]
      }],
      bugs: [
        ["I am agree with you.", "I agree with you.", "es.agree", "'Agree' is a verb. No 'am'."],
        ["It depends of the budget.", "It depends on the budget.", "es.dep", "depend + on."],
        ["Actually I am working in a new project.", "Currently, I'm working on a new project.", "es.actually", "Actualmente = currently. Actually = en realidad. And: work ON a project."],
        ["Is very difficult to find parking.", "It is very difficult to find parking.", "es.subj", "English needs a subject: It is..."],
        ["The people in my team is very creative.", "The people on my team are very creative.", "es.people", "People is plural: people are."],
        ["We have a office very big.", "We have a very big office.", "es.adj", "Adjective before the noun, and 'a very' (a + consonant sound)."],
        ["We need to do a decision today.", "We need to make a decision today.", "es.makedo", "make a decision / make a plan / make a call."],
        ["I am knowing the answer.", "I know the answer.", "b1.state", "Know is a state verb: no -ing."],
        ["I was cooking when my phone was ringing.", "I was cooking when my phone rang.", "b1.pastc", "Long action: past continuous. The interruption: past simple."],
        ["I use to go to the gym when I was in college.", "I used to go to the gym when I was in college.", "b1.usedto", "Affirmative: used to."],
        ["Tomorrow I go to Bogotá for a meeting.", "Tomorrow I'm going to Bogotá for a meeting.", "b1.fut", "A fixed plan with a time: present continuous."],
        ["I have visited Cartagena in 2022.", "I visited Cartagena in 2022.", "b1.ppvs", "Finished time (in 2022) = past simple."],
        ["Did you ever been to Bogotá?", "Have you ever been to Bogotá?", "b1.ppexp", "Experience question: Have you ever + participle."],
        ["I didn't finish the report already.", "I haven't finished the report yet.", "b1.ppjust", "Negative: haven't ... yet."],
        ["I have worked there since three years.", "I have worked there for three years.", "b1.since", "for + a period, since + a point in time."],
        ["I'm working here since 2020.", "I've been working here since 2020.", "b1.ppc", "From the past until now: have been + -ing."],
        ["When I arrived, the meeting already started.", "When I arrived, the meeting had already started.", "b1.pastp", "The earlier action: had + participle."],
        ["Although it was raining, but we went out.", "Although it was raining, we went out.", "b1.contrast", "Although and but don't go together."],
        ["This project is more easy than the last one.", "This project is easier than the last one.", "b1.compar", "Short adjectives: -er than."],
        ["You must to send the email today.", "You must send the email today.", "b1.advice", "Modals take the verb without 'to'."],
        ["I enjoy to work with startups.", "I enjoy working with startups.", "b1.gerinf", "enjoy + -ing."],
        ["He can be at the office, his lights are on.", "He must be at the office, his lights are on.", "b1.deduce", "Strong evidence = must be."],
        ["The person which leads the team is my friend.", "The person who leads the team is my friend.", "b1.rel", "People: who. Things: which / that."],
        ["If it will rain, we will stay home.", "If it rains, we will stay home.", "b1.cond1", "After 'if': present simple."],
        ["If I would have more time, I would travel.", "If I had more time, I would travel.", "b1.cond2", "If + past, would + verb."],
        ["The report was write by my team.", "The report was written by my team.", "b1.passive", "Passive: be + participle (written)."],
        ["She said me that she was tired.", "She told me that she was tired.", "b1.report", "say something / tell someone."]
      ],
      box: [
        { p: "Talk for 45 seconds about your job. Forbidden words: \"very\" and \"good\".", sec: 45, t: [["b1.base", "Present simple + continuous"], ["es.subj", "No missing subject"]] },
        { p: "Your week in 40 seconds: 2 sentences in present perfect and 1 in past simple with a time.", sec: 40, t: [["b1.ppexp", "Two present perfect sentences"], ["b1.ppvs", "Past simple + a time"]] },
        { p: "Convince me to visit your city. You must use \"although\" and \"that's why\".", sec: 45, t: [["b1.contrast", "although"], ["b1.cause", "that's why"]] },
        { p: "A 30-second story that starts with \"I had never...\"", sec: 30, t: [["b1.pastp", "I had never..."], ["b1.past", "Past simple for the action"]] },
        { p: "Talk about your hobbies. Forbidden: \"like\" and \"love\".", sec: 40, t: [["b1.gerinf", "enjoy / be into + -ing"], ["b1.base", "Routine (I usually...)"]] },
        { p: "Describe your boss (real or imaginary) with 2 deductions.", sec: 40, t: [["b1.deduce", "must be"], ["b1.deduce", "might / can't be"]] },
        { p: "A problem at work + 3 pieces of advice: should, have to, don't have to.", sec: 50, t: [["b1.advice", "should"], ["b1.advice", "have to / don't have to"]] },
        { p: "3 things you have been doing lately, with 3 different verbs.", sec: 30, t: [["b1.ppc", "I've been ...-ing"], ["b1.since", "for / since"]] },
        { p: "If you could change one thing at your job... 40 seconds, 2 second conditionals.", sec: 40, t: [["b1.cond2", "If I could..., I would..."], ["b1.cond2", "a second one"]] },
        { p: "Report a conversation without using \"said\" (use told, asked, explained).", sec: 45, t: [["b1.report", "told me / asked me if"], ["b1.report", "Tense change"]] },
        { p: "Explain how coffee is produced in Colombia with 3 passives.", sec: 45, t: [["b1.passive", "is grown / is picked"], ["b1.passive", "is exported / is sold"]] },
        { p: "Talk for 45 seconds and use \"used to\" twice and \"since\" once.", sec: 45, t: [["b1.usedto", "used to"], ["b1.since", "since"]] }
      ],
      // Rapid Transform: [unit, sentence, order, answer, structureId]
      rapid: [
        [0, "She works from home.", "→ negative", "She doesn't work from home.", "b1.base"],
        [0, "They are in a meeting.", "→ question", "Are they in a meeting?", "b1.base"],
        [0, "I usually drink coffee at 10.", "→ right now", "I'm drinking coffee right now.", "b1.base"],
        [0, "I go to the gym.", "→ yesterday", "I went to the gym yesterday.", "b1.past"],
        [0, "We take the metro.", "→ last week", "We took the metro last week.", "b1.past"],
        [0, "It is very important.", "→ fix the Spanglish: 'Is very important.'", "It is very important.", "es.subj"],
        [1, "I played tennis every Sunday as a kid.", "→ used to", "I used to play tennis every Sunday.", "b1.usedto"],
        [1, "I cooked dinner. The phone rang.", "→ one sentence with 'when'", "I was cooking dinner when the phone rang.", "b1.pastc"],
        [1, "We walked home. It started to rain.", "→ one sentence with 'while'", "While we were walking home, it started to rain.", "b1.pastc"],
        [2, "I plan to call him tomorrow.", "→ going to", "I'm going to call him tomorrow.", "b1.fut"],
        [2, "Meeting with Ana tomorrow at 3 (it's in the calendar).", "→ present continuous", "I'm meeting Ana tomorrow at 3.", "b1.fut"],
        [2, "It depends of the client.", "→ fix it", "It depends on the client.", "es.dep"],
        [3, "You visited Japan.", "→ 'ever' question", "Have you ever visited Japan?", "b1.ppexp"],
        [3, "I don't eat sushi (never in my life).", "→ present perfect", "I've never eaten sushi.", "b1.ppexp"],
        [3, "I've been to Cali.", "→ add 'last year'", "I went to Cali last year.", "b1.ppvs"],
        [4, "I finished the report (a moment ago).", "→ just", "I've just finished the report.", "b1.ppjust"],
        [4, "I didn't send the email (but I will).", "→ yet", "I haven't sent the email yet.", "b1.ppjust"],
        [4, "Did you call the client?", "→ already, present perfect", "Have you already called the client?", "b1.ppjust"],
        [5, "I live here. I started in 2018.", "→ since", "I've lived here since 2018.", "b1.since"],
        [5, "I know her. 10 years.", "→ for", "I've known her for 10 years.", "b1.since"],
        [5, "I'm studying English. I started two months ago.", "→ perfect continuous", "I've been studying English for two months.", "b1.ppc"],
        [5, "It rained all morning. The street is wet.", "→ perfect continuous", "It's been raining all morning.", "b1.ppc"],
        [6, "The movie started. Then we arrived.", "→ past perfect with 'when'", "When we arrived, the movie had already started.", "b1.pastp"],
        [6, "I didn't see snow before that trip.", "→ past perfect", "I had never seen snow before that trip.", "b1.pastp"],
        [7, "It was expensive. We bought it.", "→ although", "Although it was expensive, we bought it.", "b1.contrast"],
        [7, "The plan is good. It's risky.", "→ however", "The plan is good. However, it's risky.", "b1.contrast"],
        [7, "I was tired. I went to bed early.", "→ so", "I was tired, so I went to bed early.", "b1.cause"],
        [7, "You're wrong.", "→ make it polite", "I see your point, but I'm not sure I agree.", "b1.hedge"],
        [8, "Bogotá is cold. Medellín is warm.", "→ comparative", "Bogotá is colder than Medellín.", "b1.compar"],
        [8, "No restaurant in town is better than this one.", "→ superlative", "This is the best restaurant in town.", "b1.compar"],
        [8, "It's a good idea to rest.", "→ should", "You should rest.", "b1.advice"],
        [8, "It's not necessary to wear a suit.", "→ don't have to", "You don't have to wear a suit.", "b1.advice"],
        [8, "I like to work with startups.", "→ enjoy", "I enjoy working with startups.", "b1.gerinf"],
        [9, "I'm sure he is at home.", "→ must", "He must be at home.", "b1.deduce"],
        [9, "I'm sure it isn't true.", "→ can't", "It can't be true.", "b1.deduce"],
        [9, "This is the woman. She speaks 4 languages.", "→ who", "This is the woman who speaks 4 languages.", "b1.rel"],
        [10, "Maybe it will rain. Then we'll stay home.", "→ first conditional", "If it rains, we'll stay home.", "b1.cond1"],
        [10, "We won't finish if we don't start now.", "→ unless", "We won't finish unless we start now.", "b1.cond1"],
        [10, "I don't have money, so I don't travel.", "→ second conditional", "If I had money, I would travel.", "b1.cond2"],
        [10, "My advice: call her.", "→ If I were you...", "If I were you, I'd call her.", "b1.cond2"],
        [11, "They build houses here.", "→ passive", "Houses are built here.", "b1.passive"],
        [11, "Someone stole my bike.", "→ passive", "My bike was stolen.", "b1.passive"],
        [11, "\"I'm tired,\" she said.", "→ reported speech", "She said (that) she was tired.", "b1.report"],
        [11, "\"Do you like coffee?\" he asked me.", "→ reported speech", "He asked me if I liked coffee.", "b1.report"],
        [11, "I'll contact the client again tomorrow.", "→ follow up", "I'll follow up with the client tomorrow.", "b1.phrasal"]
      ],
      // Translation Duel: [unit, Spanish, English, structureId, the trap]
      duel: [
        [0, "Estoy de acuerdo contigo.", "I agree with you.", "es.agree", "'Estar' does not become 'be' here."],
        [0, "Es importante llegar temprano.", "It's important to arrive early.", "es.subj", "English needs 'It'."],
        [0, "La gente aquí es muy amable.", "People here are very friendly.", "es.people", "People = plural: are."],
        [0, "Tenemos una oficina muy moderna.", "We have a very modern office.", "es.adj", "Adjective before the noun."],
        [0, "Sé la respuesta.", "I know the answer.", "b1.state", "Know: no -ing."],
        [1, "Actualmente trabajo en un proyecto de innovación.", "I'm currently working on an innovation project.", "es.actually", "Actualmente = currently. And 'work ON'."],
        [1, "Solía vivir en Bogotá.", "I used to live in Bogotá.", "b1.usedto", "Solía = used to."],
        [1, "Estaba manejando cuando me llamaste.", "I was driving when you called me.", "b1.pastc", "Long action + interruption."],
        [1, "Asistí a una conferencia en Bogotá.", "I attended a conference in Bogotá.", "es.false", "Asistir = attend. Assist = ayudar."],
        [1, "Me di cuenta de que era tarde.", "I realized (that) it was late.", "es.false", "Darse cuenta = realize."],
        [2, "Depende del clima.", "It depends on the weather.", "es.dep", "depends ON, and 'It'."],
        [2, "Tengo que tomar una decisión.", "I have to make a decision.", "es.makedo", "Tomar una decisión = make a decision."],
        [2, "Te voy a hacer una pregunta.", "I'm going to ask you a question.", "es.makedo", "Hacer una pregunta = ask a question."],
        [3, "¿Alguna vez has estado en Europa?", "Have you ever been to Europe?", "b1.ppexp", "been TO a place."],
        [3, "Nunca he visto la nieve.", "I've never seen snow.", "b1.ppexp", "No 'the' for snow in general."],
        [4, "Ya terminé el informe.", "I've already finished the report. (US also: I already finished the report.)", "b1.ppjust", "already goes before the participle."],
        [4, "Todavía no he enviado el correo.", "I haven't sent the email yet.", "b1.ppjust", "Todavía no = not ... yet (at the end)."],
        [5, "Trabajo aquí hace tres años.", "I've worked here for three years.", "b1.since", "Hace + present = present perfect + for."],
        [5, "Llevo dos horas esperando.", "I've been waiting for two hours.", "b1.ppc", "Llevar + gerundio = have been + -ing."],
        [6, "Cuando llegué, la reunión ya había empezado.", "When I arrived, the meeting had already started.", "b1.pastp", "Había empezado = had started."],
        [7, "Aunque estaba cansada, terminé el trabajo.", "Although I was tired, I finished the work.", "b1.contrast", "Although: no 'but' after it."],
        [7, "Por eso decidimos cambiar el plan.", "That's why we decided to change the plan.", "b1.cause", "Por eso = that's why."],
        [8, "Disfruto trabajar con equipos internacionales.", "I enjoy working with international teams.", "b1.gerinf", "enjoy + -ing."],
        [8, "Es más fácil de lo que pensaba.", "It's easier than I thought.", "b1.compar", "de lo que = than."],
        [9, "Debe estar en una reunión.", "She must be in a meeting.", "b1.deduce", "Debe estar (deduction) = must be."],
        [9, "La persona que me ayudó es de Cali.", "The person who helped me is from Cali.", "b1.rel", "People: who."],
        [10, "Si tuviera más tiempo, viajaría más.", "If I had more time, I'd travel more.", "b1.cond2", "Tuviera = had (not would have)."],
        [10, "Si llueve, nos quedamos en casa.", "If it rains, we'll stay home. (also: we stay home)", "b1.cond1", "After 'if': present."],
        [11, "El evento fue organizado por mi equipo.", "The event was organized by my team.", "b1.passive", "fue organizado = was organized."],
        [11, "Me dijo que estaba ocupado.", "He told me (that) he was busy.", "b1.report", "Me dijo = told me (said to me)."]
      ],
      // Hidden Mission: role-play, secret targets, a twist halfway
      mission: [
        { u: 0, n: "The delegation", you: "You host a team from Germany that is visiting Medellín's innovation scene. Show them the city and your work.", me: "I'm the German visitor: curious, a bit tired, full of questions.", twist: "My flight changed. I only have 2 hours left. What do we do?", t: [["b1.base", "Describe what you do (present simple)"], ["b1.fut", "We're going to / We'll..."], ["b1.compar", "the most interesting / better than"]] },
        { u: 1, n: "The reunion", you: "You meet an old colleague you haven't seen in years.", me: "I'm your old colleague. I want to know everything.", twist: "I tell you I work for your company's competitor now.", t: [["b1.usedto", "We used to..."], ["b1.past", "Remember when we...?"], ["b1.hedge", "React politely to the twist"]] },
        { u: 2, n: "The team party", you: "You organize the end-of-year party for your team. Plan it with me.", me: "I'm your co-organizer. I have very different ideas.", twist: "The budget is cut by half.", t: [["b1.fut", "We're going to / I'll..."], ["es.makedo", "make a plan / do the shopping"], ["es.dep", "It depends on..."]] },
        { u: 3, n: "The interview", you: "You apply for an international innovation project.", me: "I'm the interviewer. Friendly, but I ask hard questions.", twist: "Tell me about a time you failed.", t: [["b1.ppexp", "I have worked / I've led..."], ["b1.ppvs", "Details in past simple"], ["b1.since", "for X years"]] },
        { u: 4, n: "The angry client", you: "You work with a client who is not happy: the platform failed during their event.", me: "I'm the client. I'm angry and I want answers.", twist: "I want my money back. Today.", t: [["b1.ppjust", "We've already... / We haven't ... yet"], ["b1.hedge", "I understand, but..."], ["b1.cond1", "If..., we'll..."]] },
        { u: 5, n: "The podcast", you: "You are a guest on a podcast about innovation in Medellín.", me: "I'm the host. I want stories and numbers.", twist: "A listener calls in and disagrees with you.", t: [["b1.since", "for / since"], ["b1.ppc", "We've been working on..."], ["b1.hedge", "Polite disagreement"]] },
        { u: 6, n: "Lost luggage", you: "You land in New York. Your suitcase didn't arrive.", me: "I'm the airline agent. Very calm, very slow.", twist: "The system says your bag never left Bogotá.", t: [["b1.pastp", "I had packed / had checked..."], ["b1.pastc", "While I was waiting..."], ["b1.hedge", "Would it be possible...?"]] },
        { u: 7, n: "The supplier deal", you: "You buy software for your company. Your budget is limited.", me: "I'm the supplier. My price is high and I'm proud of it.", twist: "I offer a discount, but only if you sign today.", t: [["b1.hedge", "Polite disagreement"], ["b1.contrast", "although / however"], ["b1.cause", "that's why / so"]] },
        { u: 8, n: "The new hire", you: "You train a new person on your team on their first day.", me: "I'm the new hire. Nervous, and I ask a lot.", twist: "I tell you I'm thinking of leaving after one day.", t: [["b1.advice", "You should / You have to..."], ["b1.advice", "You don't have to..."], ["b1.gerinf", "avoid / try + right form"]] },
        { u: 9, n: "The hotel mystery", you: "Your hotel room in Miami is not the one you booked.", me: "I'm the receptionist. I don't understand the problem.", twist: "The hotel is full tonight.", t: [["b1.deduce", "There must be a mistake"], ["b1.rel", "the room which / that I booked"], ["b1.hedge", "Would it be possible...?"]] },
        { u: 10, n: "The investor pitch", you: "Pitch a startup idea to me in 60 seconds, then answer questions.", me: "I'm an investor. I've seen 100 pitches this year.", twist: "\"Why would I invest in you and not in the others?\"", t: [["b1.cond2", "If we had..., we would..."], ["b1.cond1", "If you invest, we'll..."], ["b1.compar", "faster / cheaper than"]] },
        { u: 11, n: "The board report", you: "Report to the board what happened in a project this year.", me: "I'm the board president. I want facts, and I interrupt.", twist: "\"Who made that decision, and why wasn't I told?\"", t: [["b1.passive", "It was decided / was done..."], ["b1.report", "The team said / told us..."], ["b1.phrasal", "carry out / follow up"]] }
      ],
      // Story Chain: [unit, connector, structureId]
      chain: {
        seeds: ["It was a normal Monday at the office, until...", "The CEO walked into the meeting with a strange box.", "My phone started ringing at 3 a.m.", "Nobody knew why the elevator stopped.", "The email said: \"Don't open the attachment.\"", "We landed in Tokyo, but our bags didn't.", "The new intern found a key under the desk."],
        conn: [[0, "and then", "b1.past"], [0, "suddenly", "b1.past"], [1, "while", "b1.pastc"], [1, "when", "b1.pastc"], [1, "used to", "b1.usedto"], [2, "is going to", "b1.fut"],
          [3, "has never", "b1.ppexp"], [4, "had just", "b1.pastp"], [6, "had already", "b1.pastp"], [7, "although", "b1.contrast"], [7, "however", "b1.contrast"], [7, "even though", "b1.contrast"],
          [7, "so", "b1.cause"], [7, "that's why", "b1.cause"], [9, "who", "b1.rel"], [9, "which", "b1.rel"], [9, "must have been", "b1.deduce"], [10, "unless", "b1.cond1"], [10, "if only... would", "b1.cond2"], [11, "was told", "b1.passive"]]
      },
      // Escape Room: 4 locks, 4 digits
      rooms: [
        { u: 0, n: "The Midnight Train", intro: "You fell asleep on the night train. It stopped in the middle of nowhere and the door has a 4-digit code.", code: "5280",
          locks: [["Tell what you were doing when the lights went off.", "I was ...-ing when the lights went off.", "b1.pastc"],
            ["Fix the ticket: \"I use to take this train every Friday.\"", "I used to take this train every Friday.", "b1.usedto"],
            ["A mini story about the train with 3 irregular past verbs.", "e.g. I got on, I fell asleep, I woke up...", "b1.past"],
            ["Predict what will happen next: use 'will' and 'going to'.", "I think we'll... / We're going to...", "b1.fut"]] },
        { u: 3, n: "The Locked Office", intro: "You stayed late. The office door is locked and the code is on 4 sticky notes. Each note opens with the right English.", code: "7391",
          locks: [["Say 3 things you have done this week.", "I've finished / I've met / I've sent...", "b1.ppexp"],
            ["Fix the note: \"I work here since 2019.\"", "I've worked here since 2019.", "b1.since"],
            ["Transform: \"The guard left. Then I arrived.\" (past perfect)", "When I arrived, the guard had already left.", "b1.pastp"],
            ["The guard calls: \"Why are you still here?\" Answer with 'I've been ...-ing for...'", "I've been working on a report for 3 hours.", "b1.ppc"]] },
        { u: 7, n: "The Investor's Safe", intro: "An investor left the safe open for 12 minutes. Your startup's contract is inside. 4 locks.", code: "4608",
          locks: [["Convince the safe with one sentence: \"Although..., ...\"", "Although we're small, we're fast.", "b1.contrast"],
            ["Deduce: the safe is warm and smells of coffee. Who was here?", "Someone must have been here. It can't be...", "b1.deduce"],
            ["Transform: \"I don't have the code, so I can't open it.\" (second conditional)", "If I had the code, I could open it.", "b1.cond2"],
            ["Passive: \"Someone changed the code last night.\"", "The code was changed last night.", "b1.passive"]] }
      ]
    },

    LU: {
      name: "Luisa", level: "A1", sub: "A1 → A2 · 1 class a week (then 2) · 60 min",
      units: [
        { n: "Hello, it's me", s: ["a1.be", "a1.poss", "es.age", "es.subj"], g: "Low pressure: you model every answer first." },
        { n: "My day", s: ["a1.ps", "a1.prep"] },
        { n: "People I love", s: ["a1.ps3", "a1.poss"] },
        { n: "Ask me!", s: ["a1.psq", "a1.qw"] },
        { n: "My place", s: ["a1.there", "a1.prep", "es.adj"] },
        { n: "Food and likes", s: ["a1.like", "a1.art"] },
        { n: "I can!", s: ["a1.can", "a1.ps3"] },
        { n: "Right now", s: ["a1.pc"] },
        { n: "Yesterday (1)", s: ["a1.was"] },
        { n: "Yesterday (2)", s: ["a1.past"] },
        { n: "My plans", s: ["a1.going"] },
        { n: "My life in English", s: ["a1.be", "a1.ps", "a1.past", "a1.going", "es.people", "es.agree"], g: "Boss round: a 3-minute talk about her life." }
      ],
      run: [
        ["0-5", "Welcome, calm and clear", "In Spanish: mistakes are welcome here, and today we count first what you do well. Show the map: everything is New."],
        ["5-20", "Spin & Speak (unit 1)", "You answer the card first as a model, then she does it. Short answers count."],
        ["20-35", "Structure Bingo", "Free chat about her family or her favorite things. Every square that lights up is a win she sees."],
        ["35-45", "Jeopardy (only $100-$300)", "She chooses. Rows $400-$500 stay for another day."],
        ["45-55", "Error Court, gentle", "Wins first (all of them). Then 2 or 3 cases at most."],
        ["55-60", "Progress", "Show what she already did today. End with something she said well."]
      ],
      topics: ["Your family", "Your favorite food", "Your city", "Your weekend", "Animals you like", "Your favorite music"],
      spin: [
        { u: 0, k: "Hello!", p: "Hello! Say your name, your age and where you are from.", t: [["a1.be", "I'm ..."], ["es.age", "I'm ... years old"], ["a1.be", "I'm from ..."]] },
        { u: 0, k: "Photo", p: "Show me a photo of a person you love. Who is it?", t: [["a1.be", "He is / She is ..."], ["a1.poss", "my / his / her"], ["es.subj", "Every sentence has a subject"]] },
        { u: 0, k: "Favorites", p: "Your favorite things: color, food, place.", t: [["a1.poss", "My favorite ... is ..."], ["a1.be", "It is ..."], ["es.subj", "Every sentence has a subject"]] },
        { u: 1, k: "Morning", p: "Tell me about your morning.", t: [["a1.ps", "I wake up / I have breakfast"], ["a1.prep", "at + time"], ["a1.ps", "then / after that"]] },
        { u: 1, k: "Mon / Sun", p: "Monday or Sunday: what do you do?", t: [["a1.ps", "On Monday I ..."], ["a1.ps", "On Sunday I ..."], ["a1.prep", "on + day"]] },
        { u: 1, k: "What time?", p: "What time do you...? Answer 3 questions.", t: [["a1.prep", "at 7 o'clock"], ["a1.ps", "I + verb"], ["es.subj", "Every sentence has a subject"]] },
        { u: 2, k: "Family", p: "One person in your family: what does he or she do?", t: [["a1.ps3", "He works / She lives"], ["a1.poss", "his / her"], ["a1.ps3", "He doesn't ..."]] },
        { u: 2, k: "Best friend", p: "Your best friend.", t: [["a1.ps3", "She likes / He plays"], ["a1.be", "She is ..."], ["a1.poss", "Her name is ..."]] },
        { u: 2, k: "Famous", p: "A famous person you like.", t: [["a1.ps3", "He sings / She acts"], ["a1.be", "He is from ..."], ["a1.poss", "his / her"]] },
        { u: 3, k: "Ask me", p: "Ask me 3 questions about my day.", t: [["a1.psq", "Do you ...?"], ["a1.qw", "What / Where / When ...?"], ["a1.psq", "What time do you ...?"]] },
        { u: 3, k: "Interview", p: "Interview me! 4 questions.", t: [["a1.qw", "Where do you live?"], ["a1.qw", "How ...?"], ["a1.psq", "Does your ... ?"]] },
        { u: 3, k: "Yes / No", p: "Short answers game: answer only with \"Yes, I do\" or \"No, I don't\".", t: [["a1.psq", "Yes, I do / No, I don't"], ["a1.psq", "Yes, she does / No, he doesn't"]] },
        { u: 4, k: "House", p: "Describe your house.", t: [["a1.there", "There is a ..."], ["a1.there", "There are two ..."], ["es.adj", "a big kitchen (adjective first)"]] },
        { u: 4, k: "Neighborhood", p: "Your neighborhood: what is there?", t: [["a1.there", "There is / there are"], ["a1.prep", "next to / near"], ["es.adj", "a small park"]] },
        { u: 4, k: "Where is it?", p: "Your room: where are your things?", t: [["a1.prep", "on the table / in the box"], ["a1.there", "There is ..."], ["a1.be", "It is / They are"]] },
        { u: 5, k: "Food", p: "Food you love and food you hate.", t: [["a1.like", "I love / I like"], ["a1.like", "I don't like"], ["a1.art", "a / an / some"]] },
        { u: 5, k: "Breakfast", p: "Your perfect breakfast.", t: [["a1.art", "an egg / some coffee"], ["a1.like", "I like ..."], ["a1.ps", "I eat / I drink"]] },
        { u: 5, k: "Hobbies", p: "Hobbies: what do you like doing?", t: [["a1.like", "I like + -ing"], ["a1.ps", "I ... on weekends"], ["a1.prep", "on Saturdays"]] },
        { u: 6, k: "Can / can't", p: "Things you can and can't do.", t: [["a1.can", "I can ..."], ["a1.can", "I can't ..."], ["a1.can", "Can you ...?"]] },
        { u: 6, k: "Superpowers", p: "What can people in your family do well?", t: [["a1.can", "He can / She can"], ["a1.ps3", "She cooks / He plays"], ["a1.poss", "my / his / her"]] },
        { u: 7, k: "Window", p: "Look out the window: what are people doing right now?", t: [["a1.pc", "He is ...-ing"], ["a1.pc", "They are ...-ing"], ["a1.there", "There is / there are"]] },
        { u: 7, k: "Guess", p: "Guess: what is your family doing right now?", t: [["a1.pc", "My mom is ...-ing"], ["a1.pc", "They are ...-ing"], ["a1.poss", "my / his / her"]] },
        { u: 8, k: "Last night", p: "Where were you yesterday at 8 p.m.?", t: [["a1.was", "I was at ..."], ["a1.was", "It was (fun / quiet)"], ["a1.was", "Were you ...?"]] },
        { u: 8, k: "Birthday", p: "Your last birthday.", t: [["a1.was", "It was ..."], ["a1.was", "There were ... people"], ["a1.past", "One verb in past"]] },
        { u: 9, k: "Yesterday", p: "Yesterday: tell me 4 things you did.", t: [["a1.past", "Regular -ed (worked, cooked)"], ["a1.past", "Irregular (went, had, ate)"], ["a1.past", "I didn't ..."]] },
        { u: 9, k: "Weekend", p: "Your last weekend.", t: [["a1.past", "I went / I visited"], ["a1.was", "It was ..."], ["a1.past", "I didn't ..."]] },
        { u: 10, k: "Next weekend", p: "Plans for next weekend.", t: [["a1.going", "I'm going to ..."], ["a1.going", "I'm not going to ..."], ["a1.going", "Are you going to ...?"]] },
        { u: 10, k: "December", p: "Plans for December.", t: [["a1.going", "I'm going to ..."], ["a1.prep", "in December"], ["a1.going", "My family is going to ..."]] },
        { u: 11, k: "My life", p: "One-minute show: my life in English.", t: [["a1.be", "I'm ..."], ["a1.ps", "Every day I ..."], ["a1.past", "Last year I ..."], ["a1.going", "Next year I'm going to ..."]] },
        { u: 11, k: "People", p: "People in Medellín: describe them.", t: [["es.people", "People are ... / People like ..."], ["a1.ps", "They + verb"], ["es.adj", "friendly people (adjective first)"]] },
        { u: 11, k: "Agree?", p: "Do you agree? \"Mondays are terrible.\"", t: [["es.agree", "I agree / I don't agree"], ["a1.like", "I like / I don't like"], ["es.subj", "Every sentence has a subject"]] }
      ],
      jeo: [{ n: "All about me", u: 0,
        cats: ["All about me", "My day", "Other people", "Where is it?", "Questions"],
        tiles: [
          [
            { p: "What's your name? Spell it.", t: [["a1.be", "My name is / I'm ..."], ["a1.be", "Spells the letters"]] },
            { p: "How old are you? Where are you from?", t: [["es.age", "I'm ... years old"], ["a1.be", "I'm from ..."]] },
            { p: "Describe yourself in 3 words.", t: [["a1.be", "I'm ..."], ["es.adj", "a happy person (adjective first)"], ["es.subj", "Every sentence has a subject"]] },
            { p: "Your family: names and ages.", t: [["a1.poss", "my / his / her"], ["a1.be", "He is / She is"], ["es.age", "He is ... years old"]] },
            { p: "Present yourself for 1 minute.", t: [["a1.be", "I'm ..."], ["a1.poss", "my ..."], ["a1.ps", "I live / I work"], ["es.subj", "Every sentence has a subject"]] }
          ],
          [
            { p: "What time do you wake up?", t: [["a1.ps", "I wake up ..."], ["a1.prep", "at + time"]] },
            { p: "What do you eat for breakfast?", t: [["a1.ps", "I eat / I drink"], ["a1.art", "a / an / some"]] },
            { p: "What do you do on Sundays?", t: [["a1.ps", "Activity 1"], ["a1.ps", "Activity 2"], ["a1.prep", "on Sundays"]] },
            { p: "Your work or study day.", t: [["a1.ps", "I + verb"], ["a1.ps", "I don't ..."], ["a1.prep", "in the morning / at night"]] },
            { p: "Morning, afternoon and night: your day in 1 minute.", t: [["a1.ps", "I + verb"], ["a1.prep", "in the morning"], ["a1.ps", "then / after that"], ["es.subj", "Every sentence has a subject"]] }
          ],
          [
            { p: "Your mom: where does she live?", t: [["a1.ps3", "She lives ..."], ["a1.prep", "in ..."]] },
            { p: "What does your best friend do?", t: [["a1.ps3", "He / She works ..."], ["a1.poss", "his / her"]] },
            { p: "A person you admire.", t: [["a1.ps3", "She helps / He works"], ["a1.be", "He is / She is"], ["a1.poss", "his / her"]] },
            { p: "Someone in your family who doesn't like mornings.", t: [["a1.ps3", "doesn't like"], ["a1.ps3", "-s / -es (gets up, watches)"], ["a1.like", "likes / loves"]] },
            { p: "A neighbor: name, job, routine and likes.", t: [["a1.ps3", "He works / She lives"], ["a1.ps3", "doesn't ..."], ["a1.like", "likes ..."], ["a1.poss", "his / her"]] }
          ],
          [
            { p: "Is there a park near your house?", t: [["a1.there", "Yes, there is / No, there isn't"], ["a1.prep", "near / next to"]] },
            { p: "What is there in your kitchen?", t: [["a1.there", "There is ..."], ["a1.there", "There are ..."]] },
            { p: "Where is your phone right now?", t: [["a1.prep", "on / in / next to"], ["a1.be", "It is ..."], ["es.subj", "It is (subject)"]] },
            { p: "Your favorite place in Medellín.", t: [["a1.there", "There is / there are"], ["es.adj", "a beautiful park"], ["a1.like", "I like ..."]] },
            { p: "Describe your house, room by room.", t: [["a1.there", "There is ..."], ["a1.there", "There are ..."], ["a1.prep", "next to / in"], ["es.adj", "adjective first"]] }
          ],
          [
            { p: "Ask me: where do I live?", t: [["a1.psq", "Where do you live?"], ["a1.qw", "Right question word"]] },
            { p: "Ask me about my job.", t: [["a1.psq", "What do you do?"], ["a1.qw", "Where / What ...?"]] },
            { p: "Ask me 3 questions about my family.", t: [["a1.psq", "Do you have ...?"], ["a1.qw", "How many ...?"], ["a1.psq", "Does he / she ...?"]] },
            { p: "Ask me about my weekend.", t: [["a1.psq", "Do you ...?"], ["a1.qw", "What / Where ...?"], ["a1.qw", "When / Who ...?"]] },
            { p: "Interview me for 1 minute.", t: [["a1.psq", "Do you ...?"], ["a1.psq", "Does ...?"], ["a1.qw", "3 different question words"], ["a1.be", "Are you ...?"]] }
          ]
        ]
      }, { n: "My world", u: 5,
        cats: ["Food & likes", "I can", "Right now", "Yesterday", "My plans"],
        tiles: [
          [
            { p: "Do you like coffee?", t: [["a1.like", "I like / I don't like"], ["a1.psq", "Yes, I do / No, I don't"]] },
            { p: "Your favorite fruit and a fruit you don't like.", t: [["a1.like", "I love / I don't like"], ["a1.art", "an apple / a banana"]] },
            { p: "What is in your fridge?", t: [["a1.there", "There is / there are"], ["a1.art", "some / a / an"], ["a1.like", "I like..."]] },
            { p: "Your favorite restaurant.", t: [["a1.there", "There is..."], ["a1.like", "I like / I love"], ["es.adj", "a nice place (adjective first)"]] },
            { p: "Plan lunch for 4 people: what do you buy?", t: [["a1.art", "some"], ["a1.art", "a / an"], ["a1.like", "they like..."], ["a1.going", "I'm going to buy..."]] }
          ],
          [
            { p: "Can you cook?", t: [["a1.can", "Yes, I can / No, I can't"], ["a1.can", "I can cook..."]] },
            { p: "Two things you can do well.", t: [["a1.can", "I can..."], ["a1.can", "I can... very well"]] },
            { p: "What can you do in Medellín on a Sunday?", t: [["a1.can", "You can..."], ["a1.there", "There is..."], ["a1.prep", "on Sunday / in the park"]] },
            { p: "Your family: who can do what?", t: [["a1.can", "He can / She can"], ["a1.ps3", "She cooks / He plays"], ["a1.poss", "my / his / her"]] },
            { p: "Teach me something you can do, in 4 steps.", t: [["a1.can", "I can..."], ["a1.ps", "First you... then you..."], ["a1.prep", "in / on / at"], ["es.subj", "Every sentence has a subject"]] }
          ],
          [
            { p: "What are you doing right now?", t: [["a1.pc", "I'm ...-ing"], ["a1.pc", "I'm not ...-ing"]] },
            { p: "What is your mom doing right now? Guess.", t: [["a1.pc", "She is ...-ing"], ["a1.poss", "my / her"]] },
            { p: "Look around: what are 2 people doing?", t: [["a1.pc", "He / She is ...-ing"], ["a1.pc", "They are ...-ing"], ["a1.there", "There is / are"]] },
            { p: "Every day or right now? Tell me 2 of each.", t: [["a1.ps", "Every day I..."], ["a1.pc", "Right now I'm..."], ["a1.prep", "in the morning / at night"]] },
            { p: "Describe a photo on your phone.", t: [["a1.pc", "They are ...-ing"], ["a1.there", "There is / are"], ["es.adj", "adjective first"], ["a1.poss", "my / his / her"]] }
          ],
          [
            { p: "Where were you yesterday at 10 a.m.?", t: [["a1.was", "I was at..."], ["a1.prep", "at / in"]] },
            { p: "What did you eat yesterday?", t: [["a1.past", "I ate / I had"], ["a1.art", "a / an / some"]] },
            { p: "Three things you did last weekend.", t: [["a1.past", "regular -ed"], ["a1.past", "irregular (went, had)"], ["a1.was", "It was..."]] },
            { p: "Your last trip.", t: [["a1.past", "I went / I visited"], ["a1.was", "It was..."], ["a1.past", "I didn't..."]] },
            { p: "Your best day this year.", t: [["a1.past", "past verbs"], ["a1.was", "It was..."], ["a1.past", "I didn't..."], ["a1.like", "I loved / I liked"]] }
          ],
          [
            { p: "What are you going to do tonight?", t: [["a1.going", "I'm going to..."], ["a1.going", "I'm not going to..."]] },
            { p: "Plans for Saturday.", t: [["a1.going", "I'm going to..."], ["a1.prep", "on Saturday / in the morning"]] },
            { p: "Your next trip: where, when, with who?", t: [["a1.going", "I'm going to..."], ["a1.prep", "in / on"], ["a1.going", "We're going to..."]] },
            { p: "Your plans for December.", t: [["a1.going", "I'm going to..."], ["a1.going", "I'm not going to..."], ["a1.prep", "in December"]] },
            { p: "Ask me 3 questions about my plans.", t: [["a1.going", "Are you going to...?"], ["a1.qw", "What...?"], ["a1.qw", "Where / When...?"], ["es.subj", "Every sentence has a subject"]] }
          ]
        ]
      }],
      bugs: [
        ["I have 30 years.", "I'm 30 years old.", "es.age", "Age uses 'be': I'm 30."],
        ["Is my sister.", "She is my sister.", "es.subj", "English always has a subject."],
        ["I am live in Medellín.", "I live in Medellín.", "a1.ps", "Present simple: I live (no 'am')."],
        ["She work in a bank.", "She works in a bank.", "a1.ps3", "He / she / it: verb + s."],
        ["Her name is Juan, he is my brother.", "His name is Juan. He is my brother.", "a1.poss", "Man: his. Woman: her."],
        ["Do she like coffee?", "Does she like coffee?", "a1.psq", "He / she: does."],
        ["Where you live?", "Where do you live?", "a1.qw", "Question word + do + you."],
        ["There is two parks near my house.", "There are two parks near my house.", "a1.there", "Plural: there are."],
        ["I wake up in 6 o'clock.", "I wake up at 6 o'clock.", "a1.prep", "Time: at 6."],
        ["I have a car red.", "I have a red car.", "es.adj", "Adjective before the noun."],
        ["I like play soccer.", "I like playing soccer.", "a1.like", "like + -ing."],
        ["I want a apple.", "I want an apple.", "a1.art", "an + vowel sound."],
        ["I can to swim.", "I can swim.", "a1.can", "can + verb (no 'to')."],
        ["She is cook now.", "She is cooking now.", "a1.pc", "Now: is + -ing."],
        ["I were at home last night.", "I was at home last night.", "a1.was", "I / he / she: was."],
        ["Yesterday I go to the park.", "Yesterday I went to the park.", "a1.past", "Yesterday = past: went."],
        ["I going to travel in December.", "I'm going to travel in December.", "a1.going", "I'm going to + verb."],
        ["The people is nice here.", "People are nice here.", "es.people", "People is plural: people are."]
      ],
      box: [
        { p: "Say 5 things about you. Every sentence starts with \"I\".", sec: 60, t: [["a1.be", "I'm ..."], ["es.subj", "Every sentence has a subject"]] },
        { p: "Talk about your family. Forbidden: \"mother\" and \"father\".", sec: 60, t: [["a1.poss", "my / his / her"], ["a1.ps3", "She works / He lives"]] },
        { p: "Describe your street with \"there is\" and \"there are\".", sec: 50, t: [["a1.there", "There is ..."], ["a1.there", "There are ..."]] },
        { p: "3 things you can do and 2 things you can't.", sec: 50, t: [["a1.can", "I can ..."], ["a1.can", "I can't ..."]] },
        { p: "Talk about food: use \"I love\", \"I like\" and \"I don't like\".", sec: 50, t: [["a1.like", "I love / I like"], ["a1.like", "I don't like"]] },
        { p: "Say what 3 people are doing right now.", sec: 45, t: [["a1.pc", "He / She is ...-ing"], ["a1.pc", "They are ...-ing"]] },
        { p: "Tell me 3 things you did yesterday.", sec: 50, t: [["a1.past", "Past verb 1"], ["a1.past", "Past verb 2"]] },
        { p: "Ask me 3 questions with 3 different question words.", sec: 50, t: [["a1.qw", "3 question words"], ["a1.psq", "do / does"]] },
        { p: "What is in your bag? Tell me.", sec: 45, t: [["a1.there", "There is / there are"], ["a1.art", "a / an / some"]] },
        { p: "Plans for this weekend: 2 sentences with \"going to\".", sec: 45, t: [["a1.going", "I'm going to ..."], ["a1.going", "a second plan"]] }
      ],
      rapid: [
        [0, "I am a teacher.", "→ he", "He is a teacher.", "a1.be"],
        [0, "You are from Cali.", "→ question", "Are you from Cali?", "a1.be"],
        [0, "I am tired.", "→ negative", "I'm not tired.", "a1.be"],
        [0, "I have 30 years.", "→ fix it", "I'm 30 (years old).", "es.age"],
        [1, "I like coffee.", "→ negative", "I don't like coffee.", "a1.ps"],
        [1, "I get up. 6 o'clock.", "→ one sentence", "I get up at 6 o'clock.", "a1.prep"],
        [2, "I work in a bank.", "→ she", "She works in a bank.", "a1.ps3"],
        [2, "She plays tennis.", "→ negative", "She doesn't play tennis.", "a1.ps3"],
        [2, "This is the book of Ana.", "→ Ana's", "This is Ana's book.", "a1.poss"],
        [3, "You live here.", "→ question", "Do you live here?", "a1.psq"],
        [3, "He watches TV.", "→ question", "Does he watch TV?", "a1.psq"],
        [3, "You live in Envigado.", "→ question with 'where'", "Where do you live?", "a1.qw"],
        [4, "There is one park.", "→ three parks", "There are three parks.", "a1.there"],
        [4, "I have a car. It's red.", "→ one sentence", "I have a red car.", "es.adj"],
        [5, "I eat (apple).", "→ add a / an", "I eat an apple.", "a1.art"],
        [5, "I like music.", "→ like + dancing", "I like dancing.", "a1.like"],
        [6, "I swim.", "→ can", "I can swim.", "a1.can"],
        [6, "I can drive.", "→ negative", "I can't drive.", "a1.can"],
        [7, "I cook every day.", "→ right now", "I'm cooking right now.", "a1.pc"],
        [7, "They watch TV.", "→ right now", "They're watching TV right now.", "a1.pc"],
        [8, "I am at home.", "→ yesterday", "I was at home yesterday.", "a1.was"],
        [8, "They are happy.", "→ yesterday", "They were happy yesterday.", "a1.was"],
        [9, "I work.", "→ yesterday", "I worked yesterday.", "a1.past"],
        [9, "I go to the park.", "→ yesterday", "I went to the park yesterday.", "a1.past"],
        [10, "I travel.", "→ tomorrow (going to)", "I'm going to travel tomorrow.", "a1.going"]
      ],
      duel: [
        [0, "Tengo 30 años.", "I'm 30 (years old).", "es.age", "Age uses 'be'."],
        [0, "Es mi hermana.", "She's my sister.", "es.subj", "English needs a subject: she."],
        [0, "Soy de Medellín.", "I'm from Medellín.", "a1.be", "from = de (origin)."],
        [1, "Vivo en Medellín.", "I live in Medellín.", "a1.ps", "No 'am' before live."],
        [1, "Me levanto a las seis.", "I get up at six.", "a1.prep", "Time: at."],
        [2, "Mi hermano trabaja en un banco.", "My brother works in a bank.", "a1.ps3", "He: works (+s)."],
        [3, "¿Dónde vives?", "Where do you live?", "a1.qw", "Where + do + you."],
        [3, "¿Te gusta el café?", "Do you like coffee?", "a1.psq", "No 'the' for coffee in general."],
        [4, "Hay dos parques cerca de mi casa.", "There are two parks near my house.", "a1.there", "Hay (plural) = there are."],
        [4, "Tengo un carro rojo.", "I have a red car.", "es.adj", "Adjective first."],
        [5, "Me gusta bailar.", "I like dancing. / I like to dance.", "a1.like", "like + -ing (or to + verb)."],
        [5, "Quiero una manzana.", "I want an apple.", "a1.art", "an + vowel sound."],
        [6, "Puedo nadar.", "I can swim.", "a1.can", "can + verb (no 'to')."],
        [7, "Estoy cocinando.", "I'm cooking.", "a1.pc", "be + -ing."],
        [8, "Ayer estuve en casa.", "I was at home yesterday.", "a1.was", "at home."],
        [9, "Ayer fui al parque.", "I went to the park yesterday.", "a1.past", "go → went."],
        [10, "Voy a viajar en diciembre.", "I'm going to travel in December.", "a1.going", "Months: in."],
        [11, "La gente es amable.", "People are friendly.", "es.people", "People = plural."]
      ],
      mission: [
        { u: 0, n: "New neighbor", you: "You meet your new neighbor in the elevator.", me: "I'm your new neighbor. I'm from another country.", twist: "I have 3 big dogs!", t: [["a1.be", "I'm... / Are you...?"], ["a1.poss", "my / your"], ["es.subj", "Every sentence has a subject"]] },
        { u: 3, n: "At the café", you: "You order breakfast in a café in Miami.", me: "I'm the waiter. I speak a little fast.", twist: "We don't have coffee today!", t: [["a1.psq", "Do you have...?"], ["a1.art", "a / an / some"], ["a1.qw", "How much...?"]] },
        { u: 4, n: "Hotel check-in", you: "You arrive at a hotel in New York.", me: "I'm the receptionist.", twist: "Your room is not ready. Wait 2 hours.", t: [["a1.be", "My name is..."], ["a1.there", "Is there a...?"], ["a1.prep", "at / on / next to"]] },
        { u: 6, n: "At the store", you: "You buy clothes for a party.", me: "I'm the sales person. I love everything.", twist: "The shirt you like is very expensive.", t: [["a1.like", "I like / I don't like"], ["es.adj", "a blue shirt"], ["a1.can", "Can I...?"]] },
        { u: 7, n: "Video call", you: "You talk on a video call with a cousin in Miami.", me: "I'm your cousin. I want news.", twist: "My camera stops working. Describe your room to me.", t: [["a1.pc", "I'm ...-ing"], ["a1.ps3", "My mom works / lives..."], ["a1.there", "There is / are..."]] },
        { u: 10, n: "Weekend plans", you: "Plan a weekend with a friend from another city.", me: "I'm your friend. I'm coming to Medellín.", twist: "It's going to rain all weekend.", t: [["a1.going", "We're going to..."], ["a1.can", "We can..."], ["a1.qw", "What / Where...?"]] }
      ],
      chain: {
        seeds: ["Ana lives in a small house.", "My cat is very funny.", "Today is my birthday.", "It is Saturday morning.", "There is a new café near my house."],
        conn: [[0, "and", "a1.be"], [0, "but", "a1.be"], [1, "every day", "a1.ps"], [1, "then", "a1.ps"], [2, "she", "a1.ps3"], [3, "because", "a1.ps"], [4, "there is", "a1.there"],
          [5, "likes", "a1.like"], [6, "can", "a1.can"], [7, "right now", "a1.pc"], [8, "was", "a1.was"], [9, "yesterday", "a1.past"], [10, "is going to", "a1.going"]]
      },
      rooms: [
        { u: 0, n: "The Locked House", intro: "You are inside a house and the door has a 4-digit code. Every lock opens with English.", code: "2468",
          locks: [["Say your name, your age and your city.", "I'm... I'm ... years old. I'm from...", "a1.be"],
            ["Fix it: \"She work in a hospital.\"", "She works in a hospital.", "a1.ps3"],
            ["Ask me 2 questions with do / does.", "Do you...? Does your...?", "a1.psq"],
            ["Describe this room: there is / there are.", "There is a... There are two...", "a1.there"]] },
        { u: 5, n: "The Magic Kitchen", intro: "A magic kitchen! The fridge is locked. 4 locks, 4 numbers.", code: "1357",
          locks: [["Say 2 foods you like and 1 you don't.", "I like... I don't like...", "a1.like"],
            ["Fix it: \"I want a egg.\"", "I want an egg.", "a1.art"],
            ["Look at me and guess: what is the chef doing?", "The chef is ...-ing.", "a1.pc"],
            ["What did you eat yesterday?", "I ate / I had...", "a1.past"]] }
      ]
    }
  };

  var MASTER = { pct: 0.8, sessions: 3 };
  function isClear(e) { return e.kind === "round" && e.data && e.data.game === "jeoclear"; }
  // every scored target and notebook note as [{s, ok, session}]
  function attemptsOf(events) {
    var out = [];
    events.forEach(function (e) {
      if (e.kind === "round") (e.data.targets || []).forEach(function (t) { if (t.s) out.push({ s: t.s, ok: !!t.ok, session: e.session }); });
      else if (e.kind === "note" && e.data.s) out.push({ s: e.data.s, ok: e.data.type === "good", session: e.session });
    });
    return out;
  }
  // new | prac | dom (mastered = MASTER.pct or more in MASTER.sessions different classes)
  function statusOf(list) {
    if (!list.length) return "new";
    var per = {}; list.forEach(function (a) { var p = per[a.session] || (per[a.session] = { ok: 0, n: 0 }); p.n++; if (a.ok) p.ok++; });
    var good = Object.keys(per).filter(function (d) { return per[d].ok / per[d].n >= MASTER.pct; }).length;
    return good >= MASTER.sessions ? "dom" : "prac";
  }
  // every structure in a student's plan and content, plan order first
  function levelStructs(s) {
    var all = [];
    function add(id) { if (id && ST[id] && all.indexOf(id) < 0) all.push(id); }
    s.units.forEach(function (u) { u.s.forEach(add); });
    [].concat(s.spin, s.box).forEach(function (c) { c.t.forEach(function (t) { add(t[0]); }); });
    s.jeo.forEach(function (bd) { bd.tiles.forEach(function (col) { col.forEach(function (c) { c.t.forEach(function (t) { add(t[0]); }); }); }); });
    (s.mission || []).forEach(function (m) { m.t.forEach(function (t) { add(t[0]); }); });
    s.bugs.forEach(function (b) { add(b[2]); });
    (s.rapid || []).forEach(function (r) { add(r[4]); });
    (s.duel || []).forEach(function (r) { add(r[3]); });
    if (s.chain) s.chain.conn.forEach(function (c) { add(c[2]); });
    (s.rooms || []).forEach(function (r) { r.locks.forEach(function (l) { add(l[2]); }); });
    return all;
  }
  window.LAB_DATA = { ST: ST, STUDENTS: STUDENTS, MASTER: MASTER, isClear: isClear, attemptsOf: attemptsOf, statusOf: statusOf, levelStructs: levelStructs };
})();
