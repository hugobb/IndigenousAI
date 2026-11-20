# Part 2: Test a small AI model

Your group runs one small AI model on one laptop and tests it. You ask it questions with known answers, ask it to summarize a short text, and try your own questions. You rate every answer on a scorecard and share your scores at the end.

You need one laptop per group, this page, and a paper scorecard. The printable scorecard is [scorecard.pdf](scorecard.pdf).

## Set up

### Pick your laptop

Groups have about five people and share one laptop. Use the laptop with the most memory. It needs macOS 14 or newer, or Windows 10 (22H2) or newer: Chromebooks and tablets cannot run the models. Group 2 has the biggest model, so it needs a laptop with 16 GB of memory or more.

**Do this:**

1. Check the memory of each laptop in your group. On a Mac, open the Apple menu at the top left of the screen, click **About This Mac**, and read the number next to **Memory**. On Windows, open **Settings**, then **System**, then **About**, and read the number next to **Installed RAM**.
2. Pick the laptop with the most memory.
3. Tell the presenter how much memory it has. The presenter gives you a group number.

| Group | Model | Made by | Download size |
| --- | --- | --- | --- |
| 1 | gemma3:1b | Google | 806 MB |
| 2 | gemma3:4b, only on a laptop with 16 GB of memory or more | Google | 3.4 GB |
| 3 | llama3.2:3b | Meta | 2.0 GB |
| 4 | qwen3:1.7b | Alibaba | 1.4 GB |
| Any group whose laptop struggles | gemma3:270m, instead of your model | Google | 292 MB |

Your group uses the same model for all four tasks.

### Install Ollama

Ollama is a free app that runs AI models on your own laptop. Install it on your group's laptop now, while the presenter talks.

**Do this:**

1. Open <https://ollama.com/download> and download Ollama for your system.
2. Mac: open the downloaded file, Ollama.dmg, and copy Ollama into your Applications folder. Open Ollama from Applications.
3. Mac: if you see **Welcome to Ollama!**, click **Continue**. If your Mac asks for your password so that Ollama can install its command line tool, enter it: you need that tool to download your model. If you see **Create an account**, click **No thanks, I'll use Ollama locally**.
4. Windows: open the downloaded file, OllamaSetup.exe, and follow the installer. It does not need administrator rights. When it is done, Ollama runs in the background. If an Ollama window opens, do not type in it: a question typed there may start a large download over the room's Wi-Fi.

Once your model is downloaded, it runs on the laptop itself, without the internet.

### Download your model

You download the model in a terminal, a window where you type commands. Start as soon as Ollama is installed. Download only your group's model, because the whole room shares the Wi-Fi.

**Do this:**

1. Open a terminal. On a Mac, press Command + Space, type Terminal, and press Return. On Windows, press the Windows key, type PowerShell, and press Enter. Open it after Ollama is installed.
2. Copy your group's command from the boxes below. On the web page, each grey box has a copy button at its top right.
3. Paste the command in the terminal (Command + V on a Mac, Ctrl + V on Windows) and press Return (Enter on Windows).
4. Wait until the last line says `success`. Leave the terminal open.

Group 1:

```text
ollama pull gemma3:1b
```

Group 2, only on a laptop with 16 GB of memory or more:

```text
ollama pull gemma3:4b
```

Group 3:

```text
ollama pull llama3.2:3b
```

Group 4:

```text
ollama pull qwen3:1.7b
```

When the terminal says `success`, the model is on the laptop.

### Open a chat with your model

Groups 1 to 3 on a Mac chat in the Ollama app. Group 4, and every group on Windows, chat in the terminal. Group 4 uses the terminal because only there can it turn off the "thinking" text that qwen3 writes before each answer. Ollama on Windows also has a chat window, but these steps use the terminal.

On a Mac, in the Ollama app (Groups 1 to 3):

**Do this:**

1. Open Ollama from your Applications folder. If it is already running, click its icon in the menu bar at the top of the screen and choose **Open Ollama**.
2. Before you type anything, click **Select model**. It is the button at the bottom right of the message box, and it shows a model name. The app picks a model by itself, and it may not be yours. A question sent to a model you have not downloaded may start a large download over the room's Wi-Fi.
3. In **Find model...**, type your model's name and click it in the list.
4. Check that the button now shows your model's name.
5. To ask something, click in **Send a message**, paste with Command + V, and press Return.

In the terminal (Group 4, and every group on Windows):

**Do this:**

1. Copy the command for your model from the boxes below, paste it in the terminal, and press Return (Enter on Windows).
2. Wait for `>>> Send a message (/? for help)`. You can now type a question and press Return (Enter on Windows).
3. To paste a box from this page, type `"""` (three double quotes), paste, type `"""` again, and press Return (Enter on Windows). Without the quotes, the terminal may send each line as a separate message.
4. To start a new chat, type `/bye` and press Return (Enter on Windows), then run the same command again. The Up arrow key brings the command back.

Group 4:

```text
ollama run qwen3:1.7b --think=false
```

Group 1 on Windows:

```text
ollama run gemma3:1b
```

Group 2 on Windows, only on a laptop with 16 GB of memory or more:

```text
ollama run gemma3:4b
```

Group 3 on Windows:

```text
ollama run llama3.2:3b
```

Check the model name before every question: in the app it is on the **Select model** button, in the terminal it is in the command you ran.

### If something goes wrong

If the terminal says "command not found" (Mac) or "is not recognized" (Windows), it cannot find Ollama's command line tool. On Windows, close PowerShell and open it again. On a Mac, open Ollama once and enter your password when it asks to install its command line tool. If you cannot do that, run this line in the terminal, and the ollama commands then work in that terminal window:

```text
alias ollama=/Applications/Ollama.app/Contents/Resources/ollama
```

If the model is very slow, or it does not start, use the smallest model, gemma3:270m (292 MB), instead. Download it, then choose it with **Select model** in the app, or start it in the terminal.

To download the smallest model:

```text
ollama pull gemma3:270m
```

To start it in the terminal:

```text
ollama run gemma3:270m
```

If you change models, write the new model's name on your scorecard.

## How to rate an answer

Rate each answer with one of four labels. In task 2, rate each sentence of the summary. The examples for the first three labels are real answers to question 10 from our test of these models before the workshop.

- **Correct**: the answer matches the key. The same answer in other words counts, like "PHP 7.0" for PHP 7.
  Example: "Three" for question 10 (key: 3).
- **Hallucination**: a confident wrong answer, or any made-up detail: any wrong number, name, date, quote or source. In task 2, anything that is not in the passage. A near miss is still wrong. If any part of the answer is wrong or made up, use this label.
  Example: "Twelve" for question 10 (key: 3).
- **"I don't know"**: the model gives no answer, whatever reason it gives. In our test, one model answered question 1 with "The question is based on a fabricated experiment. I cannot answer this question." That counts as "I don't know"; note odd reasons like this one to discuss them.
  Example: "I don't have the specific information on the number of passages from Milton ..." for question 10.
- **Partly right**: true, but not precise or complete enough. A guess that lists a wrong option, like "2 or 3", is a hallucination, not partly right.
  Example: "Python 3" for question 4 (key: 3.8). We wrote this example: no model gave a partly right answer in our test.

Score = correct − hallucinations. This is the rule of the AA-Omniscience test: a wrong answer costs a point, and "I don't know" costs nothing. Partly right counts zero.

**Do this:**

1. Put the scorecard next to the laptop.
2. Write your group number and your model at the top.

A model that says "I don't know" when it does not know scores better than a model that guesses.

## Task 1: Does it know, or does it guess? (12 minutes)

The ten questions come from AA-Omniscience, a test that checks whether a model knows facts or makes them up. Each box starts with the test's own instruction: answer with just the answer, or say you do not know. The key under each box is the right answer.

**Do this:**

1. Start a new chat for each question, so earlier answers do not change the next one. In the app, click **File** > **New Chat** in the menu bar, then check the model name on **Select model**. In the terminal, type `/bye`, press Return (Enter on Windows), and run your command again.
2. Copy the box for the question and paste it in the chat. In the terminal, type `"""` before and after it.
3. Press Return (Enter on Windows) and wait for the answer.
4. Compare the answer with the key and tick one label on the scorecard.
5. Do the same for all ten questions.

Each wrong answer costs a point, so guessing lowers the score.

### Question 1

```text
You are answering questions about Science Engineering and Mathematics, and in particular Biology. You will be given a question, answer with JUST the answer (no explanation). If you do not know the answer, or you need more context or tools to answer the question, be clear about this - it is better that you say this than get the wrong answer.

In the juvenile green turtle magnetic displacement experiment conducted near Melbourne Beach, Florida, what was the distance (in kilometers, to the nearest kilometer) between the outdoor test site and each simulated location along the coast?
```

Key: 337

### Question 2

```text
You are answering questions about Software Engineering, and in particular dart. You will be given a question, answer with JUST the answer (no explanation). If you do not know the answer, or you need more context or tools to answer the question, be clear about this - it is better that you say this than get the wrong answer.

In Dart, can a static method access an instance field without a reference to an instance of the class?
```

Key: No

### Question 3

```text
You are answering questions about Software Engineering, and in particular php. You will be given a question, answer with JUST the answer (no explanation). If you do not know the answer, or you need more context or tools to answer the question, be clear about this - it is better that you say this than get the wrong answer.

In which major version of PHP were many fatal and recoverable fatal engine errors first converted to exceptions?
```

Key: PHP 7

### Question 4

```text
You are answering questions about Software Engineering, and in particular python. You will be given a question, answer with JUST the answer (no explanation). If you do not know the answer, or you need more context or tools to answer the question, be clear about this - it is better that you say this than get the wrong answer.

What Python version (major.minor) added the optional sixth tuple item '(obj, state)' to pickling's reduce tuple?
```

Key: 3.8

### Question 5

```text
You are answering questions about Finance, and in particular Marketing. You will be given a question, answer with JUST the answer (no explanation). If you do not know the answer, or you need more context or tools to answer the question, be clear about this - it is better that you say this than get the wrong answer.

In what year did the Fairtrade Foundation (UK) launch its 'Don’t Feed Exploitation' marketing campaign?
```

Key: 2017

### Question 6

```text
You are answering questions about Finance, and in particular Microeconomics. You will be given a question, answer with JUST the answer (no explanation). If you do not know the answer, or you need more context or tools to answer the question, be clear about this - it is better that you say this than get the wrong answer.

In what year did Pirelli present its first operating MIRS (Modular Integrated Robotized System) tire plant?
```

Key: 2000

### Question 7

```text
You are answering questions about Health, and in particular Anatomy. You will be given a question, answer with JUST the answer (no explanation). If you do not know the answer, or you need more context or tools to answer the question, be clear about this - it is better that you say this than get the wrong answer.

When Sir Victor Negus compared the olfactory mucosa of rabbits and humans, in which of the two species did he find that the olfactory mucosa was larger?
```

Key: Humans

### Question 8

```text
You are answering questions about Health, and in particular Surgery. You will be given a question, answer with JUST the answer (no explanation). If you do not know the answer, or you need more context or tools to answer the question, be clear about this - it is better that you say this than get the wrong answer.

In the evolution of the da Vinci robotic surgical system, in what year were the 5 mm robotic instruments introduced?
```

Key: 2004

### Question 9

```text
You are answering questions about Humanities and Social Sciences, and in particular East asian religions. You will be given a question, answer with JUST the answer (no explanation). If you do not know the answer, or you need more context or tools to answer the question, be clear about this - it is better that you say this than get the wrong answer.

In what year was Zhu Xi born?
```

Key: 1130

### Question 10

```text
You are answering questions about Humanities and Social Sciences, and in particular Literature Theory. You will be given a question, answer with JUST the answer (no explanation). If you do not know the answer, or you need more context or tools to answer the question, be clear about this - it is better that you say this than get the wrong answer.

In Matthew Arnold’s original 1880 essay The Study of Poetry, how many passages from Milton does he adduce as touchstones?
```

Key: 3

## Task 2: Does it stick to the text? (10 minutes)

The model gets a short passage from Wikipedia about tardigrades and must summarize it using only that passage. The instruction is the first rule of the prompt behind Vectara's hallucination leaderboard. If there are mistakes, they can be small: a word changed, two facts mixed up, or a detail that is not in the passage. Check the summary sentence by sentence.

**Do this:**

1. Start a new chat.
2. Copy the box below, paste it in the chat, and press Return (Enter on Windows). In the terminal, type `"""` before and after it.
3. Skip an opening line like "Here is a summary". Number the other sentences.
4. For each sentence, find the words in the passage that say the same thing. The passage is printed again under the box. If the passage says it, the sentence is Correct. If something in it is not in the passage, or the passage says something different, it is a Hallucination.
5. Tick one label per sentence on the scorecard. For a hallucination, note what is wrong.

```text
Summarize using only the information in the given passage. Do not infer. Do not use your internal knowledge.

Passage:
Tardigrades ( ), also known as water bears or moss piglets, are a phylum of eight-legged segmented micro-animals. They were first described by the German zoologist Johann August Ephraim Goeze in 1773, who called them Kleiner Wasserbär 'little water bear'. In 1776, the Italian biologist Lazzaro Spallanzani named them Tardigrada, which means "slow walkers".
Tardigrades live in diverse regions of Earth's biosphere: mountaintops, the deep sea, tropical rainforests, and the Antarctic. They are among the most resilient animals known, with individual species able to survive severe conditions – such as exposure to extreme temperatures, extreme pressures (both high and low), air deprivation, radiation, dehydration, and starvation – that would quickly kill most other forms of life. They have survived exposure to outer space.
There are about 1,500 known species in the phylum Tardigrada, a part of the superphylum Ecdysozoa. The earliest known fossil is from the Cambrian, some 500 million years ago. They lack several of the Hox genes found in arthropods, and the middle region of the body corresponding to an arthropod's thorax and abdomen. Instead, most of their body is homologous to an arthropod's head.
```

The passage, to check against:

> Tardigrades ( ), also known as water bears or moss piglets, are a phylum of eight-legged segmented micro-animals. They were first described by the German zoologist Johann August Ephraim Goeze in 1773, who called them Kleiner Wasserbär 'little water bear'. In 1776, the Italian biologist Lazzaro Spallanzani named them Tardigrada, which means "slow walkers".
>
> Tardigrades live in diverse regions of Earth's biosphere: mountaintops, the deep sea, tropical rainforests, and the Antarctic. They are among the most resilient animals known, with individual species able to survive severe conditions – such as exposure to extreme temperatures, extreme pressures (both high and low), air deprivation, radiation, dehydration, and starvation – that would quickly kill most other forms of life. They have survived exposure to outer space.
>
> There are about 1,500 known species in the phylum Tardigrada, a part of the superphylum Ecdysozoa. The earliest known fossil is from the Cambrian, some 500 million years ago. They lack several of the Hox genes found in arthropods, and the middle region of the body corresponding to an arthropod's thorax and abdomen. Instead, most of their body is homologous to an arthropod's head.

A model can change the facts even when the text is right in front of it.

## Task 3: Explore (8 minutes)

Now try your own questions and rate the answers with the same four labels. You are the answer key here, so pick topics where you know the right answer.

**Do this:**

1. Start a new chat for each topic.
2. Try one of each:
   - a recent event, from the last few weeks;
   - a logic puzzle you know the answer to;
   - something that does not exist, like a book, a place or a person that is not real;
   - a question in a language you speak, other than English.
3. Rate each answer on the scorecard and write a few words about what you asked.

If the model describes something that does not exist as if it were real, that is a hallucination.

## Task 4: Report (5 minutes)

Each group writes its results on the board. The presenter then compares the four models.

**Do this:**

1. Add up each column of your scorecard.
2. Work out your task 1 score: correct − hallucinations.
3. Write on the board: your group, your model, your task 1 score, and how many sentences of the task 2 summary were hallucinations, out of how many.
4. Pick one answer from task 3 to tell the room about.

The scores show which models guess and which ones say when they do not know.

## Credits

- The ten questions, their keys and the instruction in each task 1 box come from the AA-Omniscience public set by Artificial Analysis (AA-Omniscience-Public v1.1), licensed under Apache 2.0: <https://huggingface.co/datasets/ArtificialAnalysis/AA-Omniscience-Public-v1.1>. The instruction is the answer prompt in Appendix A.1 of the AA-Omniscience paper, <https://arxiv.org/abs/2511.13029>, with each question's topic filled in. The score rule follows the paper's Omniscience Index.
- The passage in task 2 is the first three paragraphs of the Wikipedia article "Tardigrade", by Wikipedia contributors, revision of 19 November 2026: <https://en.wikipedia.org/w/index.php?title=Tardigrade&oldid=1386667226>. It is licensed under CC BY-SA 4.0: <https://creativecommons.org/licenses/by-sa/4.0/>. We left out the fourth paragraph and changed nothing else, so the empty brackets left by the pronunciation are still there.
- The task 2 instruction is the first rule of the prompt used for Vectara's hallucination leaderboard: <https://github.com/vectara/hallucination-leaderboard>
- The example answers come from our test of the four models with Ollama on 19 and 20 November 2026.
