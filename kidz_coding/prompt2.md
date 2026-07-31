---

### Prompt 2: Generating Levels 1–20 (Batch 1)

Once your app engine is running, use this prompt to generate the first batch of level data to paste into your `levels` array in `index.html`.

```markdown
Act as a computer science teacher specializing in early childhood education.

I have an offline web application that teaches Java syntax using a JSON level format. Generate Levels 1 through 20 for 5-year-old beginners.

### Requirements:
1. **Pedagogy:** Focus on micro-steps. Do not treat it as a game. Focus on reading code, understanding what `System.out.println()` does, printing numbers, and working with simple math.
2. **Pacing:**
   - **Levels 1–5:** Basic text printing using `System.out.println("...");`
   - **Levels 6–10:** Printing numbers without quotes `System.out.println(123);`
   - **Levels 11–15:** Basic addition and subtraction inside print statements `System.out.println(2 + 3);`
   - **Levels 16–20:** Combining words and numbers `System.out.println("Age: " + 5);`
3. **Output Format:** Return ONLY a valid JSON array of objects with no surrounding conversational text, using this exact schema:

[
  {
    "id": 1,
    "title": "Short Title",
    "instruction": "Simple, 1-2 sentence explanation tailored for a young child.",
    "startingCode": "Code snippet here",
    "expectedOutput": "Exact expected console output"
  }
]