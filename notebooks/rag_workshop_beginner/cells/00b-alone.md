## Before RAG: the AI alone

First, ask the AI about this workshop without giving it the programme. It answers only from what it learned during its training, and it never read this programme. The programme says the hands-on session starts at 1:00 pm, on Friday.

**Do this:**
1. Run the cell. Is the answer right? Does the AI say it does not know, or does it make up an answer that sounds right?
2. Change the question to another one about the workshop, and run the cell again.

```python
ask("{ALONE_QUESTION}")
```
