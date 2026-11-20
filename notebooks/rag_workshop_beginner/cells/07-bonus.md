## Bonus: your own text file

You can ask questions about your own text. In Colab, the file you upload goes to Google's computers, so only upload text you are allowed to share.

**Do this:**
1. Save your document as a plain text file. In Google Docs, click **File > Download > Plain text (.txt)**. In Word, click **File > Save As** and choose **Plain Text**.
2. Run the first cell below. Click **Choose Files** under the cell (in some browsers it says **Browse**) and pick your file.
3. In the second cell, replace the question with your own. Keep the quotes. Then run the cell.

```python
from google.colab import files
uploaded = files.upload()
my_text = list(uploaded.values())[0].decode("utf-8", errors="replace")
```

```python
# Change the question and run the cell again.
my_chunks = split(my_text, words_per_chunk={DEMO_SIZE}, overlap={DEMO_OVERLAP})
ask_with_documents("Type your question here", my_chunks)
```

Not in Colab? Put your file next to the notebook and replace the first cell with this line, with your file's name:

```
my_text = open("my_file.txt", encoding="utf-8").read()
```

The same four steps work on any text, though this embedding model searches English text best.
